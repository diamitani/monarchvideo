export declare const ACP_VERSION: "1.0";

export declare class ACPRouter {
  constructor(options?: { publicUrl?: string });
  registerAgent(agent: {
    name: string;
    description: string;
    capabilities?: string[];
    handler: (ctx: { runId: string; input: unknown[]; sessionId: string; metadata: Record<string, unknown> }) => Promise<unknown> | unknown;
  }): Record<string, unknown>;
  getDiscoveryCard(primaryAgentName?: string): Record<string, unknown>;
  listAgents(): Array<Record<string, unknown>>;
  createRun(params: {
    agentName: string;
    input?: unknown[];
    mode?: "sync" | "async";
    sessionId?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<Record<string, unknown>>;
  getRun(runId: string): Record<string, unknown> | null;
}

export declare class ACPClient {
  constructor(options?: { localRouter?: ACPRouter | null; authToken?: string });
  handoff(params: {
    endpointUrl?: string | null;
    agentName: string;
    message: unknown;
    mode?: "sync" | "async";
    metadata?: Record<string, unknown>;
  }): Promise<Record<string, unknown>>;
}
