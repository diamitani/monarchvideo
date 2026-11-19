/**
 * LAYER 5 (Observability): OpenTelemetry-Compatible Trace & Span Logger
 *
 * Captures every observation-action transition, MCP tool call, ACP handoff,
 * token usage, and guardrail verdict as structured JSONL spans for full
 * accountability, replay, and error forensics.
 */

import crypto from "node:crypto";

export class TraceLogger {
  constructor({ serviceName = "rostr-agent-stack", sink = null } = {}) {
    this.serviceName = serviceName;
    this.sink = sink;
    /** @type {Array<object>} */
    this.spans = [];
  }

  startTrace(name, attributes = {}) {
    const traceId = crypto.randomBytes(16).toString("hex");
    return this.startSpan({ traceId, parentSpanId: null, name, attributes });
  }

  startSpan({ traceId, parentSpanId = null, name, attributes = {} }) {
    const spanId = crypto.randomBytes(8).toString("hex");
    const startedAt = Date.now();

    const finish = (status = "OK", extraAttributes = {}) => {
      const span = {
        service: this.serviceName,
        traceId,
        spanId,
        parentSpanId,
        name,
        status,
        startedAt: new Date(startedAt).toISOString(),
        durationMs: Date.now() - startedAt,
        attributes: { ...attributes, ...extraAttributes },
      };
      this.spans.push(span);
      if (typeof this.sink === "function") {
        this.sink(span);
      }
      return span;
    };

    return { traceId, spanId, finish };
  }

  exportJsonl() {
    return this.spans.map((s) => JSON.stringify(s)).join("\n");
  }

  getSpansByTrace(traceId) {
    return this.spans.filter((s) => s.traceId === traceId);
  }
}
