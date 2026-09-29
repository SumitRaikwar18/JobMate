import { describe, it, expect } from "vitest";
import {
  calculateRecallAtK,
  calculatePrecisionAtK,
  calculateReciprocalRank,
  calculateMeanReciprocalRank,
  aggregateRetrievalMetrics,
  evaluateGroundingMetrics,
  type RetrievalEvalSample,
} from "../../evals/metrics";

describe("Phase 4: Evaluation Framework & Metrics", () => {
  describe("Retrieval Metrics (Recall@K, Precision@K, MRR)", () => {
    it("calculates Recall@K correctly for perfect and partial matches", () => {
      const retrieved = ["doc-1", "doc-2", "doc-3", "doc-4", "doc-5"];
      const expected = ["doc-1", "doc-3"];

      const recall = calculateRecallAtK(retrieved, expected, 5);
      expect(recall).toBe(1.0); // 2 out of 2 found

      const partialExpected = ["doc-1", "doc-99"];
      const partialRecall = calculateRecallAtK(retrieved, partialExpected, 5);
      expect(partialRecall).toBe(0.5); // 1 out of 2 found
    });

    it("calculates Precision@K correctly", () => {
      const retrieved = ["doc-1", "doc-2", "doc-3", "doc-4", "doc-5"];
      const expected = ["doc-1", "doc-3"];

      const precision = calculatePrecisionAtK(retrieved, expected, 5);
      expect(precision).toBe(0.4); // 2 relevant out of 5 retrieved
    });

    it("calculates Reciprocal Rank and MRR accurately", () => {
      const retrieved = ["doc-unrelated", "doc-first-hit", "doc-second-hit"];
      const expected = ["doc-first-hit"];

      const rr = calculateReciprocalRank(retrieved, expected);
      expect(rr).toBe(0.5); // rank 2 -> 1/2 = 0.5

      const samples: RetrievalEvalSample[] = [
        { queryId: "q1", retrievedIds: ["hit-1", "other"], expectedRelevantIds: ["hit-1"] }, // RR = 1.0
        { queryId: "q2", retrievedIds: ["other", "hit-2"], expectedRelevantIds: ["hit-2"] }, // RR = 0.5
      ];
      const mrr = calculateMeanReciprocalRank(samples);
      expect(mrr).toBe(0.75); // (1.0 + 0.5) / 2 = 0.75
    });

    it("aggregates all retrieval metrics across a benchmark dataset", () => {
      const samples: RetrievalEvalSample[] = [
        { queryId: "q1", retrievedIds: ["doc-1", "doc-2", "doc-3"], expectedRelevantIds: ["doc-1"] },
        { queryId: "q2", retrievedIds: ["doc-a", "doc-b", "doc-c"], expectedRelevantIds: ["doc-b"] },
      ];

      const summary = aggregateRetrievalMetrics(samples, 3);
      expect(summary.evaluatedSamplesCount).toBe(2);
      expect(summary.meanRecallAtK).toBe(1.0);
      expect(summary.mrr).toBeGreaterThan(0.7);
    });
  });

  describe("Grounding & Anti-Hallucination Metrics", () => {
    it("computes grounding accuracy and unsupported claim rate", () => {
      const claims = [
        { isGrounded: true, isFlaggedHallucination: false },
        { isGrounded: true, isFlaggedHallucination: false },
        { isGrounded: true, isFlaggedHallucination: false },
        { isGrounded: false, isFlaggedHallucination: true }, // ungrounded hallucination
      ];

      const metrics = evaluateGroundingMetrics(claims);
      expect(metrics.totalClaims).toBe(4);
      expect(metrics.groundedClaims).toBe(3);
      expect(metrics.unsupportedClaims).toBe(1);
      expect(metrics.groundingAccuracyPercentage).toBe(75);
      expect(metrics.hallucinationRatePercentage).toBe(25);
    });
  });
});
