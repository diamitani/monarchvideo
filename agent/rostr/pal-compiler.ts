/**
 * LAYER 2: Prompt Abstraction Layer (PAL) Compiler
 *
 * Implements the 5-stage ROSTR PAL pipeline:
 *   1. Intent      — Normalize goal + constraints
 *   2. Context     — Inject fresh hybrid-retrieved substrate chunks
 *   3. Plan        — Attach NPAO stage + covenant guardrails
 *   4. Compile     — Emit a vendor-agnostic message payload + MCP tool manifest
 *   5. Execute     — Hand off to any reasoning provider without vendor lock-in
 */

export interface PALCompiledPayload {
  palVersion: string;
  agentName: string;
  npaoStage: string;
  messages: Array<{ role: string; content: string }>;
  tools: Array<{ name: string; description: string; inputSchema?: Record<string, unknown> }>;
}

export class PALCompiler {
  agentName: string;
  covenant: string;
  systemPrompt: string;

  constructor(options: { agentName?: string; covenant?: string; systemPrompt?: string }) {
    this.agentName = options.agentName || 'monarch-video-agent';
    this.covenant = options.covenant || '';
    this.systemPrompt = options.systemPrompt || '';
  }

  compile(params: {
    intent: string;
    contextSlice?: Array<{ source?: string; credibility?: number; content?: string }>;
    mcpTools?: Array<{ name: string; description: string; inputSchema?: Record<string, unknown> }>;
    npaoStage?: string;
    history?: Array<{ role: string; content: string }>;
  }): PALCompiledPayload {
    const contextSlice = params.contextSlice || [];
    const mcpTools = params.mcpTools || [];
    const npaoStage = params.npaoStage || 'NAVIGATE';
    const history = params.history || [];

    const contextBlock =
      contextSlice.length > 0
        ? contextSlice
            .map(
              (c, i) =>
                `[${i + 1}] (source=${c.source || 'substrate'}, credibility=${c.credibility ?? 0.85}) ${c.content || ''}`
            )
            .join('\n')
        : 'No prior context retrieved.';

    const toolBlock =
      mcpTools.length > 0
        ? mcpTools.map((t) => `- ${t.name}: ${t.description}`).join('\n')
        : 'No external MCP tools attached.';

    const compiledSystem = [
      `# ROSTR Agent Identity: ${this.agentName}`,
      this.systemPrompt.trim(),
      '',
      '## Operational Covenant (Hard Guardrails)',
      this.covenant.trim(),
      '',
      `## Current NPAO Stage: ${npaoStage}`,
      "Respond in strict JSON with shape: { thought, action: 'tool_call' | 'acp_handoff' | 'final', toolName?, toolArgs?, targetAgent?, answer? }.",
      '',
      '## Fresh Context Substrate (RAG DAL Hybrid Retrieval)',
      contextBlock,
      '',
      '## Available MCP Tools (2026-07-28)',
      toolBlock,
    ]
      .filter(Boolean)
      .join('\n');

    return {
      palVersion: '2.0',
      agentName: this.agentName,
      npaoStage,
      messages: [
        { role: 'system', content: compiledSystem },
        ...history,
        { role: 'user', content: params.intent },
      ],
      tools: mcpTools,
    };
  }
}
