import type { HybridRetrievedItem } from "./hybrid-retriever";
import { generateStructuredOutput } from "../structured-output";
import { z } from "zod";
import { EVIDENCE_LEVEL_WEIGHTS, type EvidenceLevel } from "../evidence/evidence-types";

export interface RerankedItem extends HybridRetrievedItem {
  rerankScore: number;
  originalRank: number;
  newRank: number;
  rankDelta: number;
  rerankReasoning: string;
  tierBoostApplied?: number;
}

export interface RerankingResult {
  jobRequirement: string;
  items: RerankedItem[];
  latencyMs: number;
}

const RerankResponseSchema = z.object({
  rankings: z.array(
    z.object({
      evidenceId: z.string(),
      relevanceScore: z.number().min(0).max(1),
      reasoning: z.string(),
    })
  ),
});

/**
 * Multi-Factor Evidence Reranker
 * Combines semantic LLM relevance, L0-L7 evidence tier reliability, and freshness.
 */
export async function rerankRetrievedEvidence(
  jobRequirement: string,
  retrievedItems: HybridRetrievedItem[]
): Promise<RerankingResult> {
  const startTime = performance.now();

  if (retrievedItems.length <= 1) {
    const items: RerankedItem[] = retrievedItems.map((item, idx) => ({
      ...item,
      rerankScore: item.combinedScore,
      originalRank: item.rank,
      newRank: idx + 1,
      rankDelta: 0,
      rerankReasoning: item.retrievalExplanation,
    }));

    return {
      jobRequirement,
      items,
      latencyMs: Math.round(performance.now() - startTime),
    };
  }

  try {
    const evidenceSnippets = retrievedItems.map((item) => ({
      id: item.evidence.id,
      title: item.evidence.title,
      level: (item.evidence as any).evidenceLevel || "L1_RESUME_CLAIM",
      technologies: item.evidence.technologies,
      content: item.evidence.content.slice(0, 300),
      metrics: item.evidence.metrics,
    }));

    const systemPrompt = `You are an expert technical resume evaluator. Evaluate how well each candidate evidence item demonstrates the specific job requirement.
Score each item from 0.0 (unrelated) to 1.0 (exact match with verifiable impact/technologies). Provide concise reasoning.`;

    const userPrompt = `Job Requirement: "${jobRequirement}"

Candidate Evidence Items to Rerank:
${JSON.stringify(evidenceSnippets, null, 2)}

Respond with JSON adhering to the required schema with evidenceId, relevanceScore (0.0 to 1.0), and reasoning.`;

    const result = await generateStructuredOutput({
      schema: RerankResponseSchema,
      schemaName: "RerankResponse",
      systemPrompt,
      userPrompt,
      temperature: 0.1,
      maxRetries: 1,
    });

    const scoresMap = new Map<string, { score: number; reasoning: string }>();
    for (const ranking of result.data.rankings) {
      scoresMap.set(ranking.evidenceId, {
        score: ranking.relevanceScore,
        reasoning: ranking.reasoning,
      });
    }

    const rerankedList: Array<{
      item: HybridRetrievedItem;
      rerankScore: number;
      reasoning: string;
      tierBoost: number;
    }> = retrievedItems.map((item) => {
      const llmEval = scoresMap.get(item.evidence.id);
      const level = ((item.evidence as any).evidenceLevel as EvidenceLevel) || "L1_RESUME_CLAIM";
      const tierWeight = EVIDENCE_LEVEL_WEIGHTS[level] || 0.5;
      const tierBoost = Number((tierWeight * 0.20).toFixed(3));

      // Weighted combination: 55% LLM relevance + 25% dense/sparse search score + 20% tier reliability
      const relevance = llmEval !== undefined ? llmEval.score : item.combinedScore;
      const rerankScore = Number(
        (0.55 * relevance + 0.25 * item.combinedScore + tierBoost).toFixed(4)
      );

      return {
        item,
        rerankScore,
        tierBoost,
        reasoning: llmEval?.reasoning || item.retrievalExplanation,
      };
    });

    rerankedList.sort((a, b) => b.rerankScore - a.rerankScore);

    const finalItems: RerankedItem[] = rerankedList.map((entry, idx) => ({
      ...entry.item,
      rerankScore: entry.rerankScore,
      originalRank: entry.item.rank,
      newRank: idx + 1,
      rankDelta: entry.item.rank - (idx + 1),
      rerankReasoning: entry.reasoning,
      tierBoostApplied: entry.tierBoost,
    }));

    return {
      jobRequirement,
      items: finalItems,
      latencyMs: Math.round(performance.now() - startTime),
    };
  } catch (error) {
    console.warn("[Reranker] Model reranking unavailable, using tier-weighted fallback:", error);

    const fallbackList = retrievedItems.map((item) => {
      const level = ((item.evidence as any).evidenceLevel as EvidenceLevel) || "L1_RESUME_CLAIM";
      const tierWeight = EVIDENCE_LEVEL_WEIGHTS[level] || 0.5;
      const rerankScore = Number((0.7 * item.combinedScore + 0.3 * tierWeight).toFixed(4));
      return { item, rerankScore };
    });

    fallbackList.sort((a, b) => b.rerankScore - a.rerankScore);

    return {
      jobRequirement,
      items: fallbackList.map((entry, idx) => ({
        ...entry.item,
        rerankScore: entry.rerankScore,
        originalRank: entry.item.rank,
        newRank: idx + 1,
        rankDelta: entry.item.rank - (idx + 1),
        rerankReasoning: entry.item.retrievalExplanation,
      })),
      latencyMs: Math.round(performance.now() - startTime),
    };
  }
}
