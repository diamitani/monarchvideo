/**
 * LAYER 5 (Observability): OpenTelemetry-Compatible Trace & Span Logger
 */

import crypto from 'node:crypto';
import type { RostrTraceSpan } from '../../src/types/monarch.ts';

export class TraceLogger {
  serviceName: string;
  spans: RostrTraceSpan[] = [];

  constructor(options: { serviceName?: string } = {}) {
    this.serviceName = options.serviceName || 'monarch-video-agent';
  }

  startTrace(name: string, attributes: Record<string, unknown> = {}) {
    const traceId = crypto.randomBytes(16).toString('hex');
    return this.startSpan({ traceId, parentSpanId: null, name, attributes });
  }

  startSpan({
    traceId,
    parentSpanId = null,
    name,
    attributes = {},
  }: {
    traceId: string;
    parentSpanId?: string | null;
    name: string;
    attributes?: Record<string, unknown>;
  }) {
    const spanId = crypto.randomBytes(8).toString('hex');
    const startedAt = Date.now();

    const finish = (status = 'OK', extraAttributes: Record<string, unknown> = {}): RostrTraceSpan => {
      const span: RostrTraceSpan = {
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
      if (this.spans.length > 250) {
        this.spans.splice(0, this.spans.length - 250);
      }
      return span;
    };

    return { traceId, spanId, finish };
  }

  getSpansByTrace(traceId: string): RostrTraceSpan[] {
    return this.spans.filter((s) => s.traceId === traceId);
  }

  getRecentSpans(limit = 40): RostrTraceSpan[] {
    return this.spans.slice(-limit).reverse();
  }
}
