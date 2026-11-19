/**
 * LAYER 1: Context Substrate & Semantic Retrieval
 *
 * Implements the ROSTR ContextEngine + RAG DAL (Dynamic Acquisition Layer):
 * - Hybrid retrieval combining lexical TF scoring + dense cosine similarity
 *   fused via Reciprocal Rank Fusion (RRF).
 * - Credibility-weighted scoring (freshness decay + source trust score).
 * - Episodic memory loop for brand consistency and project relearning.
 */

import crypto from 'node:crypto';

const DEFAULT_VECTOR_DIM = 64;

export interface ContextDocument {
  id?: string;
  content: string;
  source?: string;
  tags?: string[];
  trustScore?: number;
  pinned?: boolean;
  metadata?: Record<string, unknown>;
  embedding?: number[];
  updatedAt?: number;
}

export interface ContextQueryResult {
  id: string;
  content: string;
  source: string;
  tags: string[];
  metadata: Record<string, unknown>;
  credibility: number;
  hybridScore: number;
  updatedAt: number;
}

interface StoredContextRecord {
  id: string;
  namespace: string;
  content: string;
  source: string;
  tags: string[];
  trustScore: number;
  pinned: boolean;
  metadata: Record<string, unknown>;
  embedding: number[];
  tokens: string[];
  updatedAt: number;
}

export function tokenize(text: string): string[] {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

export function deterministicEmbed(text: string, dim = DEFAULT_VECTOR_DIM): number[] {
  const vec = new Float32Array(dim);
  const tokens = tokenize(text);
  if (tokens.length === 0) return Array.from(vec);

  for (const token of tokens) {
    const hash = crypto.createHash('sha256').update(token).digest();
    for (let i = 0; i < dim; i++) {
      const byte = hash[i % hash.length];
      vec[i] += byte / 127.5 - 1.0;
    }
  }

  let norm = 0;
  for (let i = 0; i < dim; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm) || 1;
  return Array.from(vec, (v) => v / norm);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

export function computeCredibility(
  record: { trustScore?: number; updatedAt?: number; pinned?: boolean },
  nowMs = Date.now()
): number {
  const trust = Math.max(0, Math.min(1, record.trustScore ?? 0.8));
  const ageHours = Math.max(0, (nowMs - (record.updatedAt ?? nowMs)) / 3_600_000);
  const decay = record.pinned ? 1.0 : Math.pow(0.5, ageHours / 720);
  return Number((0.65 * trust + 0.35 * decay).toFixed(4));
}

export class ContextEngine {
  namespace: string;
  private embedFn: (text: string) => Promise<number[]> | number[];
  private records = new Map<string, StoredContextRecord>();
  private episodicLog: Array<Record<string, unknown>> = [];

  constructor(options: { namespace?: string; embedFn?: (text: string) => Promise<number[]> | number[] } = {}) {
    this.namespace = options.namespace || 'monarch-video-agent';
    this.embedFn = options.embedFn || ((text) => deterministicEmbed(text));
  }

  async upsert(doc: ContextDocument): Promise<{ id: string; namespace: string; credibility: number }> {
    const id = doc.id || crypto.randomUUID();
    const now = Date.now();
    const embedding = doc.embedding || (await this.embedFn(doc.content));

    const record: StoredContextRecord = {
      id,
      namespace: this.namespace,
      content: String(doc.content || ''),
      source: doc.source || 'user',
      tags: Array.isArray(doc.tags) ? doc.tags : [],
      trustScore: doc.trustScore ?? 0.85,
      pinned: Boolean(doc.pinned),
      metadata: doc.metadata || {},
      embedding,
      tokens: tokenize(doc.content),
      updatedAt: doc.updatedAt ?? now,
    };

    this.records.set(id, record);
    return { id, namespace: this.namespace, credibility: computeCredibility(record) };
  }

  async query(queryText: string, options: { topK?: number; minCredibility?: number } = {}): Promise<ContextQueryResult[]> {
    const topK = options.topK ?? 5;
    const minCredibility = options.minCredibility ?? 0.2;
    const qTokens = tokenize(queryText);
    const qVec = await this.embedFn(queryText);
    const docs = Array.from(this.records.values());

    if (docs.length === 0) return [];

    const lexicalRanked = docs
      .map((doc) => {
        let hits = 0;
        for (const qt of qTokens) {
          for (const dt of doc.tokens) {
            if (dt === qt) hits += 1;
            else if (dt.includes(qt) && qt.length >= 3) hits += 0.4;
          }
        }
        const score = hits / Math.max(1, Math.sqrt(doc.tokens.length));
        return { id: doc.id, score };
      })
      .sort((a, b) => b.score - a.score);

    const vectorRanked = docs
      .map((doc) => ({
        id: doc.id,
        score: cosineSimilarity(qVec, doc.embedding),
      }))
      .sort((a, b) => b.score - a.score);

    const lexRankMap = new Map(lexicalRanked.map((r, idx) => [r.id, idx + 1]));
    const vecRankMap = new Map(vectorRanked.map((r, idx) => [r.id, idx + 1]));
    const rrfK = 60;

    return docs
      .map((doc) => {
        const lexRank = lexRankMap.get(doc.id) ?? docs.length;
        const vecRank = vecRankMap.get(doc.id) ?? docs.length;
        const rrf = 1 / (rrfK + lexRank) + 1 / (rrfK + vecRank);
        const credibility = computeCredibility(doc);
        return {
          id: doc.id,
          content: doc.content,
          source: doc.source,
          tags: doc.tags,
          metadata: doc.metadata,
          credibility,
          hybridScore: Number((rrf * credibility).toFixed(6)),
          updatedAt: doc.updatedAt,
        };
      })
      .filter((item) => item.credibility >= minCredibility)
      .sort((a, b) => b.hybridScore - a.hybridScore)
      .slice(0, topK);
  }

  async recordEpisode(episode: {
    traceId?: string;
    intent?: string;
    outcome?: string;
    success?: boolean;
    summary?: string;
    tags?: string[];
  }): Promise<Record<string, unknown>> {
    const entry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...episode,
    };
    this.episodicLog.push(entry);
    if (episode.summary) {
      await this.upsert({
        id: `episode:${entry.id}`,
        content: episode.summary,
        source: 'relearning-loop',
        tags: ['episode', ...(episode.tags || [])],
        trustScore: episode.success ? 0.92 : 0.65,
        metadata: { traceId: episode.traceId, outcome: episode.outcome },
      });
    }
    return entry;
  }

  stats() {
    return {
      namespace: this.namespace,
      totalRecords: this.records.size,
      totalEpisodes: this.episodicLog.length,
    };
  }
}
