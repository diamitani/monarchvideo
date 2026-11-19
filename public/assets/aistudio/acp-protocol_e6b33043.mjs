/**
 * LAYER 4: Multi-Agent Handoffs — Agent Communication Protocol (ACP) + A2A Bridge
 *
 * Implements the open, RESTful, async-first Agent Communication Protocol (ACP)
 * with offline discovery manifests (`/.well-known/agent.json`) aligned with the
 * Linux Foundation ACP -> A2A convergence.
 *
 * Standard Endpoints:
 * - GET  /.well-known/agent.json   (Offline discovery card for ACP & A2A peers)
 * - GET  /acp/agents               (List locally hosted agents)
 * - POST /acp/runs                 (Create sync or async agent handoff run)
 * - GET  /acp/runs/:runId          (Poll run status & output messages)
 */

import crypto from "node:crypto";

export const ACP_VERSION = "1.0";

export class ACPRouter {
  constructor({ publicUrl = "http://localhost:8787" } = {}) {
    this.publicUrl = publicUrl;
    /** @type {Map<string, { manifest: object, handler: Function }>} */
    this.agents = new Map();
    /** @type {Map<string, object>} */
    this.runs = new Map();
  }

  registerAgent({ name, description, capabilities = [], inputModes = ["text/plain", "application/json"], outputModes = ["application/json"], handler }) {
    if (!name || typeof handler !== "function") {
      throw new Error("ACP agent registration requires a name and handler function.");
    }
    const manifest = {
      name,
      description: description || "",
      protocol: "acp",
      protocolVersion: ACP_VERSION,
      a2aCompatible: true,
      url: `${this.publicUrl}/acp/runs`,
      capabilities,
      inputModes,
      outputModes,
    };
    this.agents.set(name, { manifest, handler });
    return manifest;
  }

  getDiscoveryCard(primaryAgentName) {
    const primary = this.agents.get(primaryAgentName) || this.agents.values().next().value;
    return {
      schemaVersion: "1.0",
      protocols: ["acp/1.0", "a2a/1.0", "mcp/2026-07-28"],
      name: primary?.manifest?.name || "rostr-agent-stack",
      description: primary?.manifest?.description || "ROSTR 6-Layer Interoperable Agent",
      url: this.publicUrl,
      endpoints: {
        acpAgents: `${this.publicUrl}/acp/agents`,
        acpRuns: `${this.publicUrl}/acp/runs`,
        mcp: `${this.publicUrl}/mcp`,
      },
      agents: Array.from(this.agents.values()).map((a) => a.manifest),
    };
  }

  listAgents() {
    return Array.from(this.agents.values()).map((a) => a.manifest);
  }

  /**
   * Create and execute an ACP handoff run (supports `sync` and `async` modes).
   */
  async createRun({ agentName, input = [], mode = "sync", sessionId = null, metadata = {} }) {
    const target = this.agents.get(agentName);
    if (!target) {
      throw new Error(`ACP target agent not found: ${agentName}`);
    }

    const runId = `run_${crypto.randomUUID().slice(0, 12)}`;
    const runRecord = {
      run_id: runId,
      agent_name: agentName,
      session_id: sessionId || `sess_${crypto.randomUUID().slice(0, 8)}`,
      mode,
      status: "in-progress",
      created_at: new Date().toISOString(),
      finished_at: null,
      input,
      output: [],
      metadata,
      error: null,
    };
    this.runs.set(runId, runRecord);

    const execute = async () => {
      try {
        const result = await target.handler({ runId, input, sessionId: runRecord.session_id, metadata });
        runRecord.output = [
          {
            role: "agent",
            parts: [
              {
                content_type: "application/json",
                content: typeof result === "string" ? { text: result } : result,
              },
            ],
          },
        ];
        runRecord.status = "completed";
        runRecord.finished_at = new Date().toISOString();
      } catch (err) {
        runRecord.status = "failed";
        runRecord.error = err instanceof Error ? err.message : String(err);
        runRecord.finished_at = new Date().toISOString();
      }
      return runRecord;
    };

    if (mode === "async") {
      // Fire asynchronously without blocking caller
      void execute();
      return { ...runRecord };
    }

    return await execute();
  }

  getRun(runId) {
    return this.runs.get(runId) || null;
  }
}

export class ACPClient {
  constructor({ localRouter = null, authToken = "" } = {}) {
    this.localRouter = localRouter;
    this.authToken = authToken;
  }

  async handoff({ endpointUrl = null, agentName, message, mode = "sync", metadata = {} }) {
    const input = [
      {
        role: "user",
        parts: [{ content_type: "application/json", content: message }],
      },
    ];

    if (!endpointUrl && this.localRouter) {
      return this.localRouter.createRun({ agentName, input, mode, metadata });
    }

    if (!endpointUrl) {
      throw new Error("ACPClient requires either a localRouter or a remote endpointUrl.");
    }

    const headers = { "Content-Type": "application/json" };
    if (this.authToken) headers["Authorization"] = `Bearer ${this.authToken}`;

    const res = await fetch(`${endpointUrl.replace(/\/$/, "")}/acp/runs`, {
      method: "POST",
      headers,
      body: JSON.stringify({ agent_name: agentName, input, mode, metadata }),
    });
    if (!res.ok) throw new Error(`ACP HTTP ${res.status}: ${await res.text()}`);
    return res.json();
  }
}
