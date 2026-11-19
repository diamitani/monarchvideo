/**
 * LAYER 5 (Orchestration): ROSTR NPAO Closed-Loop Agent Harness
 *
 * Runs the continuous, observable observation-action state machine:
 *   NAVIGATE    -> Retrieve fresh hybrid context from Substrate (Layer 1)
 *   PRIORITIZE  -> Compile 5-stage PAL payload + covenant guardrails (Layer 2)
 *   ALLOCATE    -> Ask decoupled Reasoning Engine for next action (Layer 2)
 *   ORCHESTRATE -> Execute native MCP tool (Layer 3) or ACP handoff (Layer 4)
 *   REFLECT     -> Record episodic outcome back into ContextEngine (Layer 1)
 */

import crypto from 'node:crypto';
import type { RostrTraceSpan } from '../../src/types/monarch.ts';
import type { ACPRouter } from './acp-protocol.ts';
import type { ContextEngine } from './context-engine.ts';
import type { MCPServer } from './mcp-protocol.ts';
import type { PALCompiler } from './pal-compiler.ts';
import type { ReasoningAdapter } from './reasoning-adapter.ts';
import { TraceLogger } from './trace-logger.ts';

const DESTRUCTIVE_PATTERNS = [
  /rm\s+-rf\s+\//i,
  /drop\s+table/i,
  /truncate\s+table/i,
  /delete\s+from\s+\w+\s*;/i,
];

const RETIRED_ENDPOINT_PATTERNS = [/openai\s+sora\s+api/i, /v1\/videos\/sora/i];

export interface NPAORunResult {
  status: 'COMPLETED' | 'HALTED';
  traceId: string;
  answer: string | null;
  stepsExecuted: number;
  spans: RostrTraceSpan[];
  replayedFromIdempotencyCache?: boolean;
}

export class NPAOHarness {
  agentName: string;
  substrate: ContextEngine;
  palCompiler: PALCompiler;
  reasoningAdapter: ReasoningAdapter;
  mcpServer: MCPServer;
  acpRouter: ACPRouter;
  traceLogger: TraceLogger;
  maxSteps: number;
  private idempotencyCache = new Map<string, NPAORunResult>();

  constructor(options: {
    agentName: string;
    substrate: ContextEngine;
    palCompiler: PALCompiler;
    reasoningAdapter: ReasoningAdapter;
    mcpServer: MCPServer;
    acpRouter: ACPRouter;
    traceLogger?: TraceLogger;
    maxSteps?: number;
  }) {
    this.agentName = options.agentName;
    this.substrate = options.substrate;
    this.palCompiler = options.palCompiler;
    this.reasoningAdapter = options.reasoningAdapter;
    this.mcpServer = options.mcpServer;
    this.acpRouter = options.acpRouter;
    this.traceLogger = options.traceLogger || new TraceLogger({ serviceName: options.agentName });
    this.maxSteps = options.maxSteps ?? 6;
  }

  private _checkGuardrails(text: string): { allowed: boolean; reason?: string } {
    for (const pattern of DESTRUCTIVE_PATTERNS) {
      if (pattern.test(String(text || ''))) {
        return {
          allowed: false,
          reason: `Blocked by ROSTR non-destructive covenant guardrail (${pattern})`,
        };
      }
    }
    for (const pattern of RETIRED_ENDPOINT_PATTERNS) {
      if (pattern.test(String(text || ''))) {
        return {
          allowed: false,
          reason:
            'Blocked by Monarch 2026 Provider Guardrail: OpenAI Sora API was retired Sept 24, 2026. Use Veo 3.1, Runway Gen-4.5, Kling 4.0, or LTX-2.5.',
        };
      }
    }
    return { allowed: true };
  }

  async run(params: {
    intent: string;
    idempotencyKey?: string | null;
    sessionId?: string | null;
  }): Promise<NPAORunResult> {
    const { intent, idempotencyKey = null, sessionId = null } = params;

    if (idempotencyKey && this.idempotencyCache.has(idempotencyKey)) {
      return {
        ...this.idempotencyCache.get(idempotencyKey)!,
        replayedFromIdempotencyCache: true,
      };
    }

    const rootSpan = this.traceLogger.startTrace('npao.run', {
      agentName: this.agentName,
      sessionId: sessionId || crypto.randomUUID(),
      intent,
    });

    const guardrail = this._checkGuardrails(intent);
    if (!guardrail.allowed) {
      rootSpan.finish('BLOCKED', { reason: guardrail.reason });
      return {
        status: 'HALTED',
        traceId: rootSpan.traceId,
        answer: guardrail.reason || 'Blocked by covenant guardrail.',
        stepsExecuted: 0,
        spans: this.traceLogger.getSpansByTrace(rootSpan.traceId),
      };
    }

    const history: Array<{ role: string; content: string }> = [];
    const mcpTools = this.mcpServer.listToolManifest();
    let finalAnswer: string | null = null;
    let status: 'COMPLETED' | 'HALTED' = 'HALTED';
    let step = 0;

    try {
      while (step < this.maxSteps) {
        step += 1;

        // 1. NAVIGATE
        const navSpan = this.traceLogger.startSpan({
          traceId: rootSpan.traceId,
          parentSpanId: rootSpan.spanId,
          name: `npao.step.${step}.navigate`,
        });
        const contextSlice = await this.substrate.query(intent, { topK: 4 });
        navSpan.finish('OK', { retrievedCount: contextSlice.length });

        // 2. PRIORITIZE
        const palPayload = this.palCompiler.compile({
          intent,
          contextSlice,
          mcpTools,
          npaoStage: step === 1 ? 'NAVIGATE' : 'ORCHESTRATE',
          history,
        });

        // 3. ALLOCATE
        const reasonSpan = this.traceLogger.startSpan({
          traceId: rootSpan.traceId,
          parentSpanId: rootSpan.spanId,
          name: `npao.step.${step}.reason`,
          attributes: {
            provider: this.reasoningAdapter.provider,
            model: this.reasoningAdapter.model,
          },
        });
        const { decision, usage, latencyMs } = await this.reasoningAdapter.reason(palPayload);
        reasonSpan.finish('OK', { action: decision.action, latencyMs, usage });

        if (decision.action === 'final') {
          finalAnswer = decision.answer || decision.thought;
          status = 'COMPLETED';
          break;
        }

        // 4. ORCHESTRATE — MCP Tool Call
        if (decision.action === 'tool_call' && decision.toolName) {
          const toolGuard = this._checkGuardrails(JSON.stringify(decision.toolArgs || {}));
          if (!toolGuard.allowed) {
            status = 'HALTED';
            finalAnswer = toolGuard.reason || 'Blocked by guardrail.';
            break;
          }
          const toolSpan = this.traceLogger.startSpan({
            traceId: rootSpan.traceId,
            parentSpanId: rootSpan.spanId,
            name: `npao.step.${step}.mcp_tool`,
            attributes: { toolName: decision.toolName },
          });
          const rpcRes = await this.mcpServer.handleJsonRpc({
            jsonrpc: '2.0',
            id: step,
            method: 'tools/call',
            params: { name: decision.toolName, arguments: decision.toolArgs || {} },
          });
          toolSpan.finish('error' in rpcRes && rpcRes.error ? 'ERROR' : 'OK');
          history.push({ role: 'assistant', content: JSON.stringify(decision) });
          history.push({ role: 'tool', content: JSON.stringify(rpcRes) });
          continue;
        }

        // 4. ORCHESTRATE — ACP Multi-Agent Handoff
        if (decision.action === 'acp_handoff' && decision.targetAgent) {
          const acpSpan = this.traceLogger.startSpan({
            traceId: rootSpan.traceId,
            parentSpanId: rootSpan.spanId,
            name: `npao.step.${step}.acp_handoff`,
            attributes: { targetAgent: decision.targetAgent },
          });
          const handoffResult = await this.acpRouter.createRun({
            agentName: decision.targetAgent,
            input: [
              {
                role: 'user',
                parts: [{ content_type: 'application/json', content: decision.toolArgs || { intent } }],
              },
            ],
            mode: 'sync',
            metadata: { traceId: rootSpan.traceId, parentAgent: this.agentName },
          });
          acpSpan.finish('OK', { runId: handoffResult.run_id, runStatus: handoffResult.status });
          history.push({ role: 'assistant', content: JSON.stringify(decision) });
          history.push({ role: 'tool', content: JSON.stringify(handoffResult) });
          continue;
        }

        throw new Error(`Unknown reasoning action: ${decision.action}`);
      }

      // 5. REFLECT
      await this.substrate.recordEpisode({
        traceId: rootSpan.traceId,
        intent,
        outcome: status,
        success: status === 'COMPLETED',
        summary: `Agent ${this.agentName} (${status}) on "${intent}": ${String(finalAnswer || '').slice(0, 180)}`,
        tags: [this.agentName, status.toLowerCase()],
      });

      rootSpan.finish(status, { stepsExecuted: step });

      const result: NPAORunResult = {
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
      rootSpan.finish('ERROR', { error: err instanceof Error ? err.message : String(err) });
      throw err;
    }
  }
}
