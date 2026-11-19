/**
 * LAYER 1: Context Substrate & Semantic Retrieval
 *
 * Implements the ROSTR ContextEngine + RAG DAL (Dynamic Acquisition Layer):
 * - Hybrid retrieval combining lexical BM25-style scoring + dense cosine similarity
 *   fused via Reciprocal Rank Fusion (RRF).
 * - Credibility-weighted scoring (freshness decay + source trust score) so agents
 *   act on fresh, unified data instead of stale snapshots.
 * - Pluggable storage backends: Cloudflare Durable Object SQLite + Vectorize in
 *   production, and a zero-dependency local adapter for offline dev & CI.
 */

import crypto from "node:crypto";

const DEFAULT_VECTOR_DIM = 64;

/**
 * Deterministic lightweight embedding generator for zero-dep local dev & tests.
 * In production on Cloudflare Workers, pass an embeddingFn backed by Workers AI
 * (`@cf/baai/bge-base-en-v1.5`) or your BYOK embedding endpoint.
 */
export function deterministicEmbed(text, dim = DEFAULT_VECTOR_DIM) {
  const vec = new Float32Array(dim);
  const tokens = tokenize(text);
  if (tokens.length === 0) return Array.from(vec);

  for (const token of tokens) {
    const hash = crypto.createHash("sha256").update(token).digest();
    for (let i = 0; i < dim; i++) {
      const byte = hash[i % hash.length];
      vec[i] += (byte / 127.5) - 1.0;
    }
  }

  let norm = 0;
  for (let i = 0; i < dim; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm) || 1;
  return Array.from(vec, (v) => v / norm);
}

export function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

export function cosineSimilarity(a, b) {
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

/**
 * RAG DAL Credibility Score: combines source trust (0..1) and recency decay.
 */
export function computeCredibility(record, nowMs = Date.now()) {
  const trust = Math.max(0, Math.min(1, record.trustScore ?? 0.8));
  const ageHours = Math.max(0, (nowMs - (record.updatedAt ?? nowMs)) / 3_600_000);
  // Half-life of 720 hours (~30 days) for non-pinned facts
  const decay = record.pinned ? 1.0 : Math.pow(0.5, ageHours / 720);
  return Number((0.65 * trust + 0.35 * decay).toFixed(4));
}

export class ContextEngine {
  /**
   * @param {object} options
   * @param {string} [options.namespace] - Tenant/workspace isolation namespace
   * @param {(text: string) => Promise<number[]> | number[]} [options.embedFn]
   * @param {object} [options.vectorize] - Optional Cloudflare Vectorize index binding
   * @param {object} [options.sql] - Optional Cloudflare Durable Object SQLite storage
   */
  constructor(options = {}) {
    this.namespace = options.namespace || "default";
    this.embedFn = options.embedFn || ((text) => deterministicEmbed(text));
    this.vectorize = options.vectorize || null;
    this.sql = options.sql || null;
    /** @type {Map<string, any>} */
    this.records = new Map();
    /** @type {Array<any>} */
    this.episodicLog = [];
  }

  /**
   * Upsert a context document into the substrate (idempotent by id).
   */
  async upsert(doc) {
    const id = doc.id || crypto.randomUUID();
    const now = Date.now();
    const embedding = doc.embedding || (await this.embedFn(doc.content));
    const record = {
      id,
      namespace: this.namespace,
      content: String(doc.content || ""),
      source: doc.source || "user",
      tags: Array.isArray(doc.tags) ? doc.tags : [],
      trustScore: doc.trustScore ?? 0.85,
      pinned: Boolean(doc.pinned),
      metadata: doc.metadata || {},
      embedding,
      tokens: tokenize(doc.content),
      updatedAt: doc.updatedAt ?? now,
    };

    this.records.set(id, record);

    if (this.vectorize && typeof this.vectorize.upsert === "function") {
      await this.vectorize.upsert([
        {
          id: `${this.namespace}:${id}`,
          values: embedding,
          metadata: {
            namespace: this.namespace,
            source: record.source,
            trustScore: record.trustScore,
          },
        },
      ]);
    }

    if (this.sql && typeof this.sql.exec === "function") {
      this.sql.exec(
        `CREATE TABLE IF NOT EXISTS rostr_context (
          id TEXT PRIMARY KEY,
          namespace TEXT NOT NULL,
          content TEXT NOT NULL,
          source TEXT NOT NULL,
          trust_score REAL NOT NULL,
          pinned INTEGER NOT NULL,
          metadata_json TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        )`
      );
      this.sql.exec(
        `INSERT OR REPLACE INTO rostr_context
         (id, namespace, content, source, trust_score, pinned, metadata_json, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        record.id,
        record.namespace,
        record.content,
        record.source,
        record.trustScore,
        record.pinned ? 1 : 0,
        JSON.stringify(record.metadata),
        record.updatedAt
      );
    }

    return { id, namespace: this.namespace, credibility: computeCredibility(record) };
  }

  /**
   * Hybrid Search: Lexical BM25-like TF scoring + Vector Cosine fused with RRF
   * and weighted by RAG DAL credibility.
   */
  async query(queryText, options = {}) {
    const topK = options.topK ?? 5;
    const minCredibility = options.minCredibility ?? 0.2;
    const qTokens = tokenize(queryText);
    const qVec = await this.embedFn(queryText);
    const docs = Array.from(this.records.values());

    if (docs.length === 0) return [];

    // 1. Lexical ranking
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

    // 2. Dense vector ranking
    const vectorRanked = docs
      .map((doc) => ({
        id: doc.id,
        score: cosineSimilarity(qVec, doc.embedding),
      }))
      .sort((a, b) => b.score - a.score);

    const lexRankMap = new Map(lexicalRanked.map((r, idx) => [r.id, idx + 1]));
    const vecRankMap = new Map(vectorRanked.map((r, idx) => [r.id, idx + 1]));
    const rrfK = 60;

    // 3. Reciprocal Rank Fusion + RAG DAL credibility weighting
    const fused = docs
      .map((doc) => {
        const lexRank = lexRankMap.get(doc.id) ?? docs.length;
        const vecRank = vecRankMap.get(doc.id) ?? docs.length;
        const rrf = (1 / (rrfK + lexRank)) + (1 / (rrfK + vecRank));
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

    return fused;
  }

  /**
   * Append an episodic observation from the NPAO loop so the agent relearns over time.
   */
  async recordEpisode(episode) {
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
        source: "relearning-loop",
        tags: ["episode", ...(episode.tags || [])],
        trustScore: episode.success ? 0.9 : 0.65,
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
