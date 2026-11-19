/**
 * LAYER 4: Multi-Agent Handoffs — Agent Communication Protocol (ACP 1.0) + A2A Bridge
 */

import crypto from 'node:crypto';
import { MCP_PROTOCOL_VERSION } from './mcp-protocol.ts';

export const ACP_VERSION = '1.0' as const;

export interface ACPAgentRegistration {
  name: string;
  description: string;
  capabilities?: string[];
  inputModes?: string[];
  outputModes?: string[];
  handler: (ctx: {
    runId: string;
    input: unknown[];
    sessionId: string;
    metadata: Record<string, unknown>;
  }) => Promise<unknown> | unknown;
}

export interface ACPRunRecord {
  run_id: string;
  agent_name: string;
  session_id: string;
  mode: 'sync' | 'async';
  status: 'in-progress' | 'completed' | 'failed';
  created_at: string;
  finished_at: string | null;
  input: unknown[];
  output: Array<{
    role: string;
    parts: Array<{ content_type: string; content: unknown }>;
  }>;
  metadata: Record<string, unknown>;
  error: string | null;
}

export class ACPRouter {
  publicUrl: string;
  private agents = new Map<string, { manifest: Record<string, unknown>; handler: ACPAgentRegistration['handler'] }>();
  private runs = new Map<string, ACPRunRecord>();

  constructor(options: { publicUrl?: string } = {}) {
    this.publicUrl = options.publicUrl || 'http://localhost:3000';
  }

  registerAgent(agent: ACPAgentRegistration) {
    const manifest = {
      name: agent.name,
      description: agent.description,
      protocol: 'acp',
      protocolVersion: ACP_VERSION,
      a2aCompatible: true,
      url: `${this.publicUrl}/acp/runs`,
      capabilities: agent.capabilities || [],
      inputModes: agent.inputModes || ['text/plain', 'application/json'],
      outputModes: agent.outputModes || ['application/json'],
    };
    this.agents.set(agent.name, { manifest, handler: agent.handler });
    return manifest;
  }

  getDiscoveryCard(primaryAgentName?: string) {
    const primary = (primaryAgentName ? this.agents.get(primaryAgentName) : undefined) || this.agents.values().next().value;
    return {
      schemaVersion: '1.0',
      protocols: [`acp/${ACP_VERSION}`, 'a2a/1.0', `mcp/${MCP_PROTOCOL_VERSION}`],
      name: (primary?.manifest?.name as string) || 'monarch-video-agent',
      description:
        (primary?.manifest?.description as string) ||
        'Monarch Video Agent — ROSTR 6-Layer Programmatic Video Production Stack',
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

  async createRun(params: {
    agentName: string;
    input?: unknown[];
    mode?: 'sync' | 'async';
    sessionId?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<ACPRunRecord> {
    const target = this.agents.get(params.agentName);
    if (!target) {
      throw new Error(`ACP target agent not found: ${params.agentName}`);
    }

    const runId = `run_${crypto.randomUUID().slice(0, 12)}`;
    const runRecord: ACPRunRecord = {
      run_id: runId,
      agent_name: params.agentName,
      session_id: params.sessionId || `sess_${crypto.randomUUID().slice(0, 8)}`,
      mode: params.mode || 'sync',
      status: 'in-progress',
      created_at: new Date().toISOString(),
      finished_at: null,
      input: params.input || [],
      output: [],
      metadata: params.metadata || {},
      error: null,
    };
    this.runs.set(runId, runRecord);

    const execute = async () => {
      try {
        const result = await target.handler({
          runId,
          input: runRecord.input,
          sessionId: runRecord.session_id,
          metadata: runRecord.metadata,
        });
        runRecord.output = [
          {
            role: 'agent',
            parts: [
              {
                content_type: 'application/json',
                content: typeof result === 'string' ? { text: result } : result,
              },
            ],
          },
        ];
        runRecord.status = 'completed';
        runRecord.finished_at = new Date().toISOString();
      } catch (err) {
        runRecord.status = 'failed';
        runRecord.error = err instanceof Error ? err.message : String(err);
        runRecord.finished_at = new Date().toISOString();
      }
      return runRecord;
    };

    if (runRecord.mode === 'async') {
      void execute();
      return { ...runRecord };
    }

    return execute();
  }

  getRun(runId: string): ACPRunRecord | null {
    return this.runs.get(runId) || null;
  }
}
