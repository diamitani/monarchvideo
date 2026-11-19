export interface PALCompiledPayload {
  palVersion: string;
  agentName: string;
  npaoStage: string;
  messages: Array<{ role: string; content: string }>;
  tools: Array<{ name: string; description: string; inputSchema?: Record<string, unknown> }>;
}

export declare class PALCompiler {
  constructor(options: { agentName: string; covenant: string; systemPrompt: string });
  compile(params: {
    intent: string;
    contextSlice?: Array<Record<string, unknown>>;
    mcpTools?: Array<{ name: string; description: string; inputSchema?: Record<string, unknown> }>;
    npaoStage?: string;
    history?: Array<{ role: string; content: string }>;
  }): PALCompiledPayload;
}

export declare class ReasoningAdapter {
  constructor(options?: {
    provider?: "openai" | "anthropic" | "gemini" | "ollama" | "mock";
    model?: string;
    apiKey?: string;
    baseUrl?: string;
    mockHandler?: (payload: PALCompiledPayload) => Promise<unknown>;
  });
  reason(compiledPayload: PALCompiledPayload): Promise<{
    provider: string;
    model: string;
    latencyMs: number;
    decision: {
      thought: string;
      action: "tool_call" | "acp_handoff" | "final";
      toolName?: string;
      toolArgs?: Record<string, unknown>;
      targetAgent?: string;
      answer?: string;
    };
    usage: { promptTokens: number; completionTokens: number };
  }>;
}
