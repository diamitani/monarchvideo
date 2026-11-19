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

export declare class ContextEngine {
  constructor(options?: {
    namespace?: string;
    embedFn?: (text: string) => Promise<number[]> | number[];
    vectorize?: unknown;
    sql?: unknown;
  });
  upsert(doc: ContextDocument): Promise<{ id: string; namespace: string; credibility: number }>;
  query(queryText: string, options?: { topK?: number; minCredibility?: number }): Promise<ContextQueryResult[]>;
  recordEpisode(episode: Record<string, unknown>): Promise<Record<string, unknown>>;
  stats(): { namespace: string; totalRecords: number; totalEpisodes: number };
}
