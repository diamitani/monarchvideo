export declare class TraceLogger {
  constructor(options?: { serviceName?: string; sink?: ((span: Record<string, unknown>) => void) | null });
  startTrace(name: string, attributes?: Record<string, unknown>): { traceId: string; spanId: string; finish: (status?: string, extra?: Record<string, unknown>) => Record<string, unknown> };
  exportJsonl(): string;
  getSpansByTrace(traceId: string): Array<Record<string, unknown>>;
}

export declare class NPAOHarness {
  constructor(options: Record<string, unknown>);
  run(params: { intent: string; idempotencyKey?: string | null; sessionId?: string | null }): Promise<{
    status: "COMPLETED" | "HALTED";
    traceId: string;
    answer: string | null;
    stepsExecuted: number;
    spans?: Array<Record<string, unknown>>;
    replayedFromIdempotencyCache?: boolean;
  }>;
}
