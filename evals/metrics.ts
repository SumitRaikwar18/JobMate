export interface RetrievalEvalSample {
  queryId: string;
  retrievedIds: string[];
  expectedRelevantIds: string[];
}

export interface RetrievalMetricsSummary {
  meanRecallAtK: number;
  meanPrecisionAtK: number;
  mrr: number; // Mean Reciprocal Rank
  evaluatedSamplesCount: number;
  k: number;
}

export interface GroundingMetricsSummary {
  totalClaims: number;
  groundedClaims: number;
  unsupportedClaims: number;
  groundingAccuracyPercentage: number;
  hallucinationRatePercentage: number;
}

/**
 * Computes Recall@K: fraction of expected relevant items present in top-K retrieved items
 */
export function calculateRecallAtK(
  retrievedIds: string[],
  expectedRelevantIds?: string[] | undefined,
  k = 5
): number {
  if (!expectedRelevantIds || expectedRelevantIds.length === 0) return 1.0;
  const topKRetrieved = new Set((retrievedIds || []).slice(0, k));
  let hits = 0;

  for (const expected of expectedRelevantIds) {
    if (topKRetrieved.has(expected)) {
      hits++;
    }
  }

  return Number((hits / expectedRelevantIds.length).toFixed(4));
}

/**
 * Computes Precision@K: fraction of top-K retrieved items that are genuinely relevant
 */
export function calculatePrecisionAtK(
  retrievedIds: string[],
  expectedRelevantIds?: string[] | undefined,
  k = 5
): number {
  if (!retrievedIds || retrievedIds.length === 0 || k === 0) return 0.0;
  if (!expectedRelevantIds || expectedRelevantIds.length === 0) return 0.0;
  const expectedSet = new Set(expectedRelevantIds);
  const topKRetrieved = retrievedIds.slice(0, k);
  let hits = 0;

  for (const retrieved of topKRetrieved) {
    if (expectedSet.has(retrieved)) {
      hits++;
    }
  }

  return Number((hits / topKRetrieved.length).toFixed(4));
}

/**
 * Computes Reciprocal Rank for a single query (1 / rank of first relevant item)
 */
export function calculateReciprocalRank(
  retrievedIds: string[],
  expectedRelevantIds?: string[] | undefined
): number {
  if (!expectedRelevantIds || expectedRelevantIds.length === 0) return 0.0;
  const expectedSet = new Set(expectedRelevantIds);
  const items = retrievedIds || [];
  for (let idx = 0; idx < items.length; idx++) {
    const id = items[idx]!;
    if (expectedSet.has(id)) {
      return Number((1 / (idx + 1)).toFixed(4));
    }
  }
  return 0.0;
}

/**
 * Computes MRR across multiple retrieval evaluation samples
 */
export function calculateMeanReciprocalRank(samples: RetrievalEvalSample[]): number {
  if (samples.length === 0) return 0.0;
  const sumRR = samples.reduce(
    (acc, sample) => acc + calculateReciprocalRank(sample.retrievedIds, sample.expectedRelevantIds),
    0
  );
  return Number((sumRR / samples.length).toFixed(4));
}

/**
 * Aggregates all retrieval metrics across a benchmark evaluation set
 */
export function aggregateRetrievalMetrics(
  samples: RetrievalEvalSample[],
  k = 5
): RetrievalMetricsSummary {
  if (samples.length === 0) {
    return {
      meanRecallAtK: 0,
      meanPrecisionAtK: 0,
      mrr: 0,
      evaluatedSamplesCount: 0,
      k,
    };
  }

  const sumRecall = samples.reduce(
    (acc, s) => acc + calculateRecallAtK(s.retrievedIds, s.expectedRelevantIds, k),
    0
  );
  const sumPrecision = samples.reduce(
    (acc, s) => acc + calculatePrecisionAtK(s.retrievedIds, s.expectedRelevantIds, k),
    0
  );
  const mrr = calculateMeanReciprocalRank(samples);

  return {
    meanRecallAtK: Number((sumRecall / samples.length).toFixed(4)),
    meanPrecisionAtK: Number((sumPrecision / samples.length).toFixed(4)),
    mrr,
    evaluatedSamplesCount: samples.length,
    k,
  };
}

/**
 * Computes Grounding & Factuality Metrics
 */
export function evaluateGroundingMetrics(
  claims: Array<{ isGrounded: boolean; isFlaggedHallucination?: boolean | undefined }>
): GroundingMetricsSummary {
  if (claims.length === 0) {
    return {
      totalClaims: 0,
      groundedClaims: 0,
      unsupportedClaims: 0,
      groundingAccuracyPercentage: 100,
      hallucinationRatePercentage: 0,
    };
  }

  const grounded = claims.filter((c) => c.isGrounded).length;
  const unsupported = claims.length - grounded;
  const hallucinations = claims.filter((c) => c.isFlaggedHallucination ?? !c.isGrounded).length;

  return {
    totalClaims: claims.length,
    groundedClaims: grounded,
    unsupportedClaims: unsupported,
    groundingAccuracyPercentage: Math.round((grounded / claims.length) * 100),
    hallucinationRatePercentage: Math.round((hallucinations / claims.length) * 100),
  };
}
