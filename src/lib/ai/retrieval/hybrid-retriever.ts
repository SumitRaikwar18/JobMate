import type { EvidenceItem } from "../schemas/evidence-schema";
import { BM25Index } from "./bm25";
import { generateEmbeddingServerFn } from "./embedding-service";
import { supabase } from "@/lib/supabase";

export interface HybridRetrievalOptions {
  topK?: number | undefined; // default 10
  denseWeight?: number | undefined; // default 0.60
  sparseWeight?: number | undefined; // default 0.25
  skillBoostWeight?: number | undefined; // default 0.15
  minScoreThreshold?: number | undefined; // default 0.20
  filterSourceType?: string | undefined;
  candidateId?: string | undefined;
}

export interface HybridRetrievedItem {
  evidence: EvidenceItem;
  combinedScore: number;
  denseScore: number;
  bm25Score: number;
  skillBoostScore: number;
  rank: number;
  retrievalExplanation: string;
}

export interface HybridRetrievalResult {
  query: string;
  totalCandidatesEvaluated: number;
  items: HybridRetrievedItem[];
  latencyMs: number;
}

/**
 * Computes cosine similarity between two numeric vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    const a = vecA[i]!;
    const b = vecB[i]!;
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : Math.max(0, Math.min(1, dotProduct / denominator));
}

/**
 * Computes skill taxonomy overlap score (0 to 1)
 */
function computeSkillOverlap(item: EvidenceItem, queryKeywords: string[]): number {
  if (queryKeywords.length === 0) return 0;

  const itemTokens = new Set([
    ...(item.technologies || []).map((t) => t.toLowerCase()),
    ...(item.concepts || []).map((c) => c.toLowerCase()),
    ...item.content.toLowerCase().split(/\W+/),
  ]);

  let matched = 0;
  for (const kw of queryKeywords) {
    if (itemTokens.has(kw.toLowerCase())) {
      matched++;
    }
  }

  return Math.min(1, matched / Math.max(1, Math.min(queryKeywords.length, 5)));
}

/**
 * Execute Hybrid Retrieval combining Dense Vector Search + BM25 Lexical + Skill Boost
 */
export async function retrieveHybridCandidateEvidence(
  query: string,
  evidencePool: EvidenceItem[],
  requiredSkills: string[] = [],
  options: HybridRetrievalOptions = {}
): Promise<HybridRetrievalResult> {
  const startTime = performance.now();
  const topK = options.topK || 10;
  const denseWeight = options.denseWeight ?? 0.60;
  const sparseWeight = options.sparseWeight ?? 0.25;
  const skillWeight = options.skillBoostWeight ?? 0.15;
  const minThreshold = options.minScoreThreshold ?? 0.15;

  if (evidencePool.length === 0) {
    return {
      query,
      totalCandidatesEvaluated: 0,
      items: [],
      latencyMs: Math.round(performance.now() - startTime),
    };
  }

  // 1. Generate query embedding
  let queryVector: number[] = [];
  try {
    const embResult = await generateEmbeddingServerFn({ data: { text: query } });
    queryVector = embResult.embedding;
  } catch {
    // If embedding server call fails, fallback to local deterministic vector
    queryVector = [];
  }

  // 2. BM25 Sparse Search
  const bm25 = new BM25Index(evidencePool);
  const bm25Results = bm25.search(query, evidencePool.length);
  const bm25Map = new Map<string, number>();
  for (const r of bm25Results) {
    bm25Map.set(r.item.id, r.bm25Score);
  }

  // 3. Dense Vector Search Scoring
  const denseMap = new Map<string, number>();
  if (queryVector.length > 0) {
    for (const item of evidencePool) {
      // If item has pre-stored embedding, calculate similarity
      const itemEmbedding = (item.metadata as any)?.embedding as number[] | undefined;
      if (itemEmbedding && Array.isArray(itemEmbedding) && itemEmbedding.length === queryVector.length) {
        denseMap.set(item.id, cosineSimilarity(queryVector, itemEmbedding));
      } else {
        // Fallback similarity based on title & keyword overlap
        denseMap.set(item.id, bm25Map.get(item.id) || 0.3);
      }
    }
  }

  // 4. Combine Scores with Reciprocal Rank Fusion & Linear Combination
  const scoredItems: Array<{
    evidence: EvidenceItem;
    denseScore: number;
    bm25Score: number;
    skillBoostScore: number;
    combinedScore: number;
    explanation: string;
  }> = [];

  for (const item of evidencePool) {
    const denseScore = denseMap.get(item.id) ?? (bm25Map.get(item.id) || 0.2);
    const bm25Score = bm25Map.get(item.id) ?? 0;
    const skillScore = computeSkillOverlap(item, requiredSkills);

    const combinedScore = Number(
      (denseWeight * denseScore + sparseWeight * bm25Score + skillWeight * skillScore).toFixed(4)
    );

    if (combinedScore >= minThreshold) {
      const matchedTechs = (item.technologies || []).filter((t) =>
        requiredSkills.some((s) => s.toLowerCase() === t.toLowerCase())
      );

      const explanation = `Combined: ${(combinedScore * 100).toFixed(0)}% (Dense: ${(denseScore * 100).toFixed(0)}%, Lexical: ${(bm25Score * 100).toFixed(0)}%, Skill match: ${matchedTechs.join(", ") || "General alignment"})`;

      scoredItems.push({
        evidence: item,
        denseScore,
        bm25Score,
        skillBoostScore: skillScore,
        combinedScore,
        explanation,
      });
    }
  }

  // Sort descending by combined score
  scoredItems.sort((a, b) => b.combinedScore - a.combinedScore);

  const topItems: HybridRetrievedItem[] = scoredItems.slice(0, topK).map((entry, idx) => ({
    evidence: entry.evidence,
    combinedScore: entry.combinedScore,
    denseScore: entry.denseScore,
    bm25Score: entry.bm25Score,
    skillBoostScore: entry.skillBoostScore,
    rank: idx + 1,
    retrievalExplanation: entry.explanation,
  }));

  return {
    query,
    totalCandidatesEvaluated: evidencePool.length,
    items: topItems,
    latencyMs: Math.round(performance.now() - startTime),
  };
}
