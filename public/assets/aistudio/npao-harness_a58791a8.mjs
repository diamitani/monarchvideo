/**
 * LAYER 5 (Orchestration): ROSTR NPAO Closed-Loop Agent Harness
 *
 * Runs the continuous, observable observation-action state machine:
 *   NAVIGATE   -> Retrieve fresh hybrid context from Substrate (Layer 1)
 *   PRIORITIZE -> Compile PAL prompt + covenant guardrails (Layer 2)
 *   ALLOCATE   -> Ask decoupled Reasoning Engine for next action (Layer 2)
 *   ORCHESTRATE -> Execute native MCP tool (Layer 3) or ACP handoff (Layer 4)
 *   REFLECT    -> Record episodic outcome back into ContextEngine (Layer 1)
 *
 * Enforces idempotency keys, destructive-command guardrails, and max-step
 * circuit breakers so agents never spin out of control.
 */

import crypto from "node:crypto";
import { TraceLogger } from "./trace-logger.mjs";

const DESTRUCTIVE_PATTERNS = [/rm\s+-rf\s+\//i, /drop\s+table/i, /truncate\s+table/i, /delete\s+from\s+\w+\s*;/i];

export class NPAOHarness {
  constructor({
    agentName,
    substrate,
    palCompiler,
    reasoningAdapter,
    mcpServer,
    mcpClient,
    acpClient = null,
    traceLogger = null,
    maxSteps = 6,
  }) {
    this.agentName = agentName;
    this.substrate = substrate;
    this.palCompiler = palCompiler;
    this.reasoningAdapter = reasoningAdapter;
    this.mcpServer = mcpServer;
    this.mcpClient = mcpClient;
    this.acpClient = acpClient;
    this.traceLogger = traceLogger || new TraceLogger({ serviceName: agentName });
    this.maxSteps = maxSteps;
    this.idempotencyCache = new Map();
  }

  _checkGuardrails(text) {
    for (const pattern of DESTRUCTIVE_PATTERNS) {
      if (pattern.test(String(text || ""))) {
        return { allowed: false, reason: `Blocked by ROSTR non-destructive covenant guardrail (${pattern})` };
      }
    }
    return { allowed: true };
  }

  async run({ intent, idempotencyKey = null, sessionId = null }) {
    if (idempotencyKey && this.idempotencyCache.has(idempotencyKey)) {
      return {
        ...this.idempotencyCache.get(idempotencyKey),
        replayedFromIdempotencyCache: true,
      };
    }

    const rootSpan = this.traceLogger.startTrace("npao.run", {
      agentName: this.agentName,
      sessionId: sessionId || crypto.randomUUID(),
      intent,
    });

    const guardrail = this._checkGuardrails(intent);
    if (!guardrail.allowed) {
      rootSpan.finish("BLOCKED", { reason: guardrail.reason });
      return {
        status: "HALTED",
        traceId: rootSpan.traceId,
        answer: guardrail.reason,
        stepsExecuted: 0,
      };
    }

    const history = [];
    const mcpTools = this.mcpServer ? this.mcpServer.listToolManifest() : [];
    let finalAnswer = null;
    let status = "HALTED";
    let step = 0;

    try {
      while (step < this.maxSteps) {
        step += 1;

        // 1. NAVIGATE: Fresh hybrid retrieval from Context Substrate
        const navSpan = this.traceLogger.startSpan({
          traceId: rootSpan.traceId,
          parentSpanId: rootSpan.spanId,
          name: `npao.step.${step}.navigate`,
        });
        const contextSlice = await this.substrate.query(intent, { topK: 4 });
        navSpan.finish("OK", { retrievedCount: contextSlice.length });

        // 2. PRIORITIZE: Compile 5-stage PAL payload
        const palPayload = this.palCompiler.compile({
          intent,
          contextSlice,
          mcpTools,
          npaoStage: step === 1 ? "NAVIGATE" : "ORCHESTRATE",
          history,
        });

        // 3. ALLOCATE: Decoupled Reasoning Engine decision
        const reasonSpan = this.traceLogger.startSpan({
          traceId: rootSpan.traceId,
          parentSpanId: rootSpan.spanId,
          name: `npao.step.${step}.reason`,
          attributes: { provider: this.reasoningAdapter.provider, model: this.reasoningAdapter.model },
        });
        const { decision, usage, latencyMs } = await this.reasoningAdapter.reason(palPayload);
        reasonSpan.finish("OK", { action: decision.action, latencyMs, usage });

        if (decision.action === "final") {
          finalAnswer = decision.answer || decision.thought;
          status = "COMPLETED";
          break;
        }

        // 4. ORCHESTRATE: Execute MCP tool or ACP handoff
        if (decision.action === "tool_call") {
          const toolGuard = this._checkGuardrails(JSON.stringify(decision.toolArgs || {}));
          if (!toolGuard.allowed) {
            status = "HALTED";
            finalAnswer = toolGuard.reason;
            break;
          }
          const toolSpan = this.traceLogger.startSpan({
            traceId: rootSpan.traceId,
            parentSpanId: rootSpan.spanId,
            name: `npao.step.${step}.mcp_tool`,
            attributes: { toolName: decision.toolName },
          });
          const toolResult = await this.mcpClient.callTool(decision.toolName, decision.toolArgs || {});
          toolSpan.finish("OK", { isError: toolResult.isError });
          history.push({ role: "assistant", content: JSON.stringify(decision) });
          history.push({ role: "tool", content: JSON.stringify(toolResult) });
          continue;
        }

        if (decision.action === "acp_handoff") {
          if (!this.acpClient) {
            throw new Error("Reasoning requested ACP handoff, but no ACPClient is configured.");
          }
          const acpSpan = this.traceLogger.startSpan({
            traceId: rootSpan.traceId,
            parentSpanId: rootSpan.spanId,
            name: `npao.step.${step}.acp_handoff`,
            attributes: { targetAgent: decision.targetAgent },
          });
          const handoffResult = await this.acpClient.handoff({
            agentName: decision.targetAgent,
            message: decision.toolArgs || { intent },
            mode: "sync",
            metadata: { traceId: rootSpan.traceId, parentAgent: this.agentName },
          });
          acpSpan.finish("OK", { runId: handoffResult.run_id, runStatus: handoffResult.status });
          history.push({ role: "assistant", content: JSON.stringify(decision) });
          history.push({ role: "tool", content: JSON.stringify(handoffResult) });
          continue;
        }

        throw new Error(`Unknown reasoning action: ${decision.action}`);
      }

      // 5. REFLECT: Persist episodic memory back into ContextEngine
      await this.substrate.recordEpisode({
        traceId: rootSpan.traceId,
        intent,
        outcome: status,
        success: status === "COMPLETED",
        summary: `Agent ${this.agentName} (${status}) on "${intent}": ${String(finalAnswer || "").slice(0, 200)}`,
        tags: [this.agentName, status.toLowerCase()],
      });

      rootSpan.finish(status, { stepsExecuted: step });

      const result = {
        status,
        traceId: rootSpan.traceId,
        answer: finalAnswer,
        stepsExecuted: step,
        spans: this.traceLogger.getSpansByTrace(rootSpan.traceId),
      };

      if (idempotencyKey) {
        this.idempotencyCache.set(idempotencyKey, result);
      }

      return result;
    } catch (err) {
      rootSpan.finish("ERROR", { error: err instanceof Error ? err.message : String(err) });
      throw err;
    }
  }
}
