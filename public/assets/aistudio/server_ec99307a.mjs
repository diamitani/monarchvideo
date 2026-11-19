/**
 * Local Zero-Dependency HTTP Server for `rostr-agent-stack`
 *
 * Runs all 6 layers locally so developers can inspect `/.well-known/agent.json`,
 * call stateless JSON-RPC 2.0 `/mcp`, trigger `/acp/runs`, and execute `/run`
 * with full trace logs before deploying to Cloudflare Workers.
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ContextEngine } from "../packages/substrate/context-engine.mjs";
import { PALCompiler } from "../packages/pal/pal-compiler.mjs";
import { ReasoningAdapter } from "../packages/pal/reasoning-adapter.mjs";
import { MCPServer, MCPClient } from "../packages/mcp/mcp-protocol.mjs";
import { ACPRouter, ACPClient } from "../packages/acp/acp-protocol.mjs";
import { NPAOHarness } from "../packages/orchestrator/npao-harness.mjs";
import { TraceLogger } from "../packages/orchestrator/trace-logger.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

export function createRostrRuntime({
  agentName = "rostr-core-agent",
  provider = process.env.ROSTR_LLM_PROVIDER || "mock",
  publicUrl = "http://127.0.0.1:8787",
} = {}) {
  const substrate = new ContextEngine({ namespace: agentName });
  const traceLogger = new TraceLogger({ serviceName: agentName });

  const covenantPath = path.join(ROOT, "templates/default-agent/covenant.md");
  const promptPath = path.join(ROOT, "templates/default-agent/system_prompt.txt");
  const covenant = fs.existsSync(covenantPath) ? fs.readFileSync(covenantPath, "utf8") : "";
  const systemPrompt = fs.existsSync(promptPath) ? fs.readFileSync(promptPath, "utf8") : "";

  const palCompiler = new PALCompiler({ agentName, covenant, systemPrompt });
  const reasoningAdapter = new ReasoningAdapter({ provider });

  const mcpServer = new MCPServer({ name: `${agentName}-mcp`, version: "1.0.0" });
  mcpServer.registerTool({
    name: "composio_context_search",
    description: "Search fresh hybrid Context Substrate records with RAG DAL credibility scoring.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
    handler: async ({ query }) => {
      const results = await substrate.query(query, { topK: 3 });
      return { matches: results };
    },
  });

  const mcpClient = new MCPClient({ localServer: mcpServer });
  const acpRouter = new ACPRouter({ publicUrl });

  acpRouter.registerAgent({
    name: "specialist-auditor",
    description: "Open-protocol ACP specialist agent for verification and compliance audits.",
    capabilities: ["audit", "verify", "summarize"],
    handler: async ({ input }) => ({
      verdict: "VERIFIED",
      receivedParts: input.length,
      note: "Specialist audit completed over ACP 1.0.",
    }),
  });

  const acpClient = new ACPClient({ localRouter: acpRouter });

  const harness = new NPAOHarness({
    agentName,
    substrate,
    palCompiler,
    reasoningAdapter,
    mcpServer,
    mcpClient,
    acpClient,
    traceLogger,
  });

  acpRouter.registerAgent({
    name: agentName,
    description: "Primary ROSTR 6-layer autonomous agent.",
    capabilities: ["npao", "mcp", "acp", "context-engine"],
    handler: async ({ input }) => {
      const firstText = JSON.stringify(input?.[0]?.parts?.[0]?.content || "status check");
      return harness.run({ intent: firstText });
    },
  });

  return { substrate, traceLogger, palCompiler, reasoningAdapter, mcpServer, mcpClient, acpRouter, acpClient, harness };
}

export function startLocalServer(port = Number(process.env.PORT || 8787)) {
  const runtime = createRostrRuntime({ publicUrl: `http://127.0.0.1:${port}` });

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
    const sendJson = (status, body) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(body, null, 2));
    };

    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const rawBody = Buffer.concat(chunks).toString("utf8");
      const jsonBody = rawBody ? JSON.parse(rawBody) : {};

      if (req.method === "GET" && url.pathname === "/.well-known/agent.json") {
        return sendJson(200, runtime.acpRouter.getDiscoveryCard("rostr-core-agent"));
      }
      if (req.method === "POST" && url.pathname === "/mcp") {
        const rpcRes = await runtime.mcpServer.handleJsonRpc(jsonBody);
        return sendJson(200, rpcRes);
      }
      if (req.method === "GET" && url.pathname === "/acp/agents") {
        return sendJson(200, { agents: runtime.acpRouter.listAgents() });
      }
      if (req.method === "POST" && url.pathname === "/acp/runs") {
        const run = await runtime.acpRouter.createRun({
          agentName: jsonBody.agent_name || "rostr-core-agent",
          input: jsonBody.input || [],
          mode: jsonBody.mode || "sync",
          metadata: jsonBody.metadata || {},
        });
        return sendJson(200, run);
      }
      if (req.method === "GET" && url.pathname.startsWith("/acp/runs/")) {
        const runId = url.pathname.split("/").pop();
        const run = runtime.acpRouter.getRun(runId);
        return run ? sendJson(200, run) : sendJson(404, { error: "Run not found" });
      }
      if (req.method === "POST" && url.pathname === "/run") {
        const result = await runtime.harness.run({
          intent: jsonBody.intent || "Health check",
          idempotencyKey: jsonBody.idempotencyKey || null,
        });
        return sendJson(200, result);
      }
      if (req.method === "GET" && url.pathname === "/traces") {
        return sendJson(200, { spans: runtime.traceLogger.spans });
      }
      return sendJson(200, {
        status: "ROSTR 6-Layer Agent Stack Online",
        endpoints: ["/.well-known/agent.json", "/mcp", "/acp/agents", "/acp/runs", "/run", "/traces"],
      });
    } catch (err) {
      return sendJson(500, { error: err instanceof Error ? err.message : String(err) });
    }
  });

  return { server, runtime };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 8787);
  const { server } = startLocalServer(port);
  server.listen(port, () => {
    console.log(`ROSTR 6-Layer Agent Stack listening on http://127.0.0.1:${port}`);
  });
}
