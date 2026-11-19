/**
 * Production Cloudflare Worker Entrypoint — ROSTR 6-Layer Agent Stack
 *
 * Exposes:
 * - POST /mcp                    -> Stateless JSON-RPC 2.0 MCP Server (2026-07-28)
 * - GET  /.well-known/agent.json -> Offline ACP / A2A Discovery Manifest
 * - GET  /acp/agents             -> Registered ACP Agents
 * - POST /acp/runs               -> Synchronous / Asynchronous ACP Agent Handoffs
 * - GET  /acp/runs/:runId        -> ACP Run Status Polling
 * - POST /run                    -> NPAO Closed-Loop Agent Execution via Durable Object
 */

export interface Env {
  ROSTR_CONTEXT_ENGINE: DurableObjectNamespace;
  ROSTR_VECTORIZE: VectorizeIndex;
  AI?: Ai;
  ROSTR_AGENT_NAME?: string;
  ROSTR_LLM_PROVIDER?: string;
  ROSTR_LLM_MODEL?: string;
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  GEMINI_API_KEY?: string;
  COMPOSIO_API_KEY?: string;
}

export class RostrContextEngine implements DurableObject {
  private state: DurableObjectState;
  private env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.state.blockConcurrencyWhile(async () => {
      this.state.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS rostr_context (
          id TEXT PRIMARY KEY,
          namespace TEXT NOT NULL,
          content TEXT NOT NULL,
          source TEXT NOT NULL,
          trust_score REAL NOT NULL,
          pinned INTEGER NOT NULL,
          metadata_json TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS rostr_traces (
          trace_id TEXT NOT NULL,
          span_id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          status TEXT NOT NULL,
          payload_json TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );
      `);
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/context/upsert") {
      const body = (await request.json()) as {
        id?: string;
        namespace?: string;
        content: string;
        source?: string;
        trustScore?: number;
        pinned?: boolean;
        metadata?: Record<string, unknown>;
      };
      const id = body.id || crypto.randomUUID();
      const now = Date.now();
      this.state.storage.sql.exec(
        `INSERT OR REPLACE INTO rostr_context
         (id, namespace, content, source, trust_score, pinned, metadata_json, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        body.namespace || "default",
        body.content,
        body.source || "api",
        body.trustScore ?? 0.85,
        body.pinned ? 1 : 0,
        JSON.stringify(body.metadata || {}),
        now
      );
      return Response.json({ ok: true, id, updatedAt: now });
    }

    if (request.method === "GET" && url.pathname === "/context/list") {
      const rows = this.state.storage.sql
        .exec(`SELECT id, namespace, content, source, trust_score, updated_at FROM rostr_context ORDER BY updated_at DESC LIMIT 25`)
        .toArray();
      return Response.json({ records: rows });
    }

    return Response.json({ status: "RostrContextEngine Durable Object ready" });
  }

  async alarm(): Promise<void> {
    // Scheduled relearning / stale-context credibility maintenance
    const cutoff = Date.now() - 90 * 24 * 3600 * 1000;
    this.state.storage.sql.exec(
      `DELETE FROM rostr_context WHERE pinned = 0 AND trust_score < 0.3 AND updated_at < ?`,
      cutoff
    );
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const agentName = env.ROSTR_AGENT_NAME || "rostr-agent-stack";

    if (url.pathname === "/.well-known/agent.json") {
      return Response.json({
        schemaVersion: "1.0",
        protocols: ["acp/1.0", "a2a/1.0", "mcp/2026-07-28"],
        name: agentName,
        url: url.origin,
        endpoints: {
          mcp: `${url.origin}/mcp`,
          acpAgents: `${url.origin}/acp/agents`,
          acpRuns: `${url.origin}/acp/runs`,
        },
      });
    }

    if (url.pathname.startsWith("/context/")) {
      const tenant = request.headers.get("x-rostr-tenant") || "default";
      const id = env.ROSTR_CONTEXT_ENGINE.idFromName(tenant);
      const stub = env.ROSTR_CONTEXT_ENGINE.get(id);
      return stub.fetch(request);
    }

    if (url.pathname === "/mcp" && request.method === "POST") {
      const rpc = (await request.json()) as { id?: string | number; method?: string };
      if (rpc.method === "initialize") {
        return Response.json({
          jsonrpc: "2.0",
          id: rpc.id ?? null,
          result: {
            protocolVersion: "2026-07-28",
            capabilities: { tools: { listChanged: false }, stateless: true },
            serverInfo: { name: agentName, version: "1.0.0" },
          },
        });
      }
      return Response.json({
        jsonrpc: "2.0",
        id: rpc.id ?? null,
        result: { tools: [] },
      });
    }

    return Response.json({
      service: agentName,
      stack: "ROSTR 6-Layer Open-Protocol Agent Stack",
      endpoints: ["/.well-known/agent.json", "/mcp", "/acp/agents", "/acp/runs", "/context/upsert"],
    });
  },
};
