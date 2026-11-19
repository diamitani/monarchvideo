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

export class PALCompiler {
  constructor({ agentName, covenant, systemPrompt }) {
    this.agentName = agentName || "rostr-agent";
    this.covenant = covenant || "";
    this.systemPrompt = systemPrompt || "";
  }

  /**
   * Compile a vendor-agnostic reasoning request from live substrate & MCP tools.
   */
  compile({ intent, contextSlice = [], mcpTools = [], npaoStage = "NAVIGATE", history = [] }) {
    const contextBlock =
      contextSlice.length > 0
        ? contextSlice
            .map(
              (c, i) =>
                `[${i + 1}] (source=${c.source}, credibility=${c.credibility}) ${c.content}`
            )
            .join("\n")
        : "No prior context retrieved.";

    const toolBlock =
      mcpTools.length > 0
        ? mcpTools
            .map((t) => `- ${t.name}: ${t.description}`)
            .join("\n")
        : "No external MCP tools attached.";

    const compiledSystem = [
      `# ROSTR Agent Identity: ${this.agentName}`,
      this.systemPrompt.trim(),
      "",
      "## Operational Covenant (Hard Guardrails)",
      this.covenant.trim(),
      "",
      `## Current NPAO Stage: ${npaoStage}`,
      "Respond in strict JSON with shape: { thought, action: 'tool_call' | 'acp_handoff' | 'final', toolName?, toolArgs?, targetAgent?, answer? }.",
      "",
      "## Fresh Context Substrate (RAG DAL Hybrid Retrieval)",
      contextBlock,
      "",
      "## Available MCP Tools (2026-07-28)",
      toolBlock,
    ]
      .filter(Boolean)
      .join("\n");

    return {
      palVersion: "2.0",
      agentName: this.agentName,
      npaoStage,
      messages: [
        { role: "system", content: compiledSystem },
        ...history,
        { role: "user", content: intent },
      ],
      tools: mcpTools,
    };
  }
}
