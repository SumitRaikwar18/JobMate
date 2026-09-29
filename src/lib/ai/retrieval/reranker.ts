import type { HybridRetrievedItem } from "./hybrid-retriever";
import { generateStructuredOutput } from "../structured-output";
import { z } from "zod";

export interface RerankedItem extends HybridRetrievedItem {
  rerankScore: number;
  originalRank: number;
  newRank: number;
  rankDelta: number;
  rerankReasoning: string;
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
 * LLM-Based Structured Evidence Reranker
 * Evaluates and re-scores candidate evidence items specifically for target job requirements using structured JSON evaluation.
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
    }> = retrievedItems.map((item) => {
      const llmEval = scoresMap.get(item.evidence.id);
      const rerankScore = llmEval !== undefined
        ? Number((0.7 * llmEval.score + 0.3 * item.combinedScore).toFixed(4))
        : item.combinedScore;

      return {
        item,
        rerankScore,
        reasoning: llmEval?.reasoning || item.retrievalExplanation,
      };
    });

    rerankedList.sort((a, b) => b.rerankScore - a.rerankScore);

    const finalItems: RerankedItem[] = rerankedList.map((entry, idx) => ({
      ...entry.item,
      rerankScore: entry.rerankScore,
      originalRank: entry.item.rank,
      newRank: idx + 1,
      rankDelta: entry.item.rank - (idx + 1), // positive means moved up
      rerankReasoning: entry.reasoning,
    }));

    return {
      jobRequirement,
      items: finalItems,
      latencyMs: Math.round(performance.now() - startTime),
    };
  } catch (err) {
    console.warn("[Reranker] LLM reranking unavailable, falling back to hybrid retrieval scores:", err);

    const fallbackItems: RerankedItem[] = retrievedItems.map((item, idx) => ({
      ...item,
      rerankScore: item.combinedScore,
      originalRank: item.rank,
      newRank: idx + 1,
      rankDelta: 0,
      rerankReasoning: item.retrievalExplanation,
    }));

    return {
      jobRequirement,
      items: fallbackItems,
      latencyMs: Math.round(performance.now() - startTime),
    };
  }
}
