import { describe, it, expect } from "vitest";
import { ClaimVerificationEngine } from "@/lib/ai/verification/claim-verification-engine";
import type { EvidenceItem, AtomicFact } from "@/lib/ai/evidence/evidence-types";

describe("Deterministic Claim Verification & Hard Gating Tests", () => {
  it("extracts atomic facts and verifies them against ground-truth evidence", () => {
    const atomicFacts: AtomicFact[] = [
      {
        factText: "Built high-throughput indexing with PostgreSQL and pgvector",
        category: "technology_usage",
        status: "unsupported",
        matchedEvidenceIds: [],
        confidence: 0.5,
      },
      {
        factText: "Achieved 99.99% uptime in production",
        category: "metric_claim",
        status: "unsupported",
        matchedEvidenceIds: [],
        confidence: 0.5,
      },
    ];

    const evidencePool: EvidenceItem[] = [
      {
        id: "ev-pg",
        candidateId: "user-1",
        sourceType: "github",
        evidenceLevel: "L4_SOURCE_CODE",
        verificationStatus: "verified",
        title: "PostgreSQL pgvector client",
        content: "pgvector similarity queries in client.ts",
        observedAt: new Date().toISOString(),
        technologies: ["PostgreSQL", "pgvector"],
        concepts: ["Vector Database"],
        metrics: [], // Notice: No uptime benchmark metric
        confidence: 0.95,
      },
    ];

    const verified = ClaimVerificationEngine.verifyAtomicFacts(atomicFacts, evidencePool);

    // PostgreSQL fact should be verified
    expect(verified[0]?.status).toBe("verified");
    expect(verified[0]?.matchedEvidenceIds).toContain("ev-pg");

    // 99.99% uptime metric without proof must fail closed as unsupported
    expect(verified[1]?.status).toBe("unsupported");
    expect(verified[1]?.confidence).toBe(0.0);
  });

  it("blocks claims containing unproven metrics under the Hard Claim Gate", async () => {
    const bulletStatements = [
      "Engineered vector retrieval engine using PostgreSQL and pgvector.",
      "Optimized query response latency by 45% with multi-tier Redis caching.", // 45% unproven
    ];

    const evidencePool: EvidenceItem[] = [
      {
        id: "ev-1",
        candidateId: "user-1",
        sourceType: "github",
        evidenceLevel: "L4_SOURCE_CODE",
        verificationStatus: "verified",
        title: "PostgreSQL pgvector engine",
        content: "Vector search queries",
        observedAt: new Date().toISOString(),
        technologies: ["PostgreSQL", "pgvector"],
        concepts: ["Vector Search"],
        metrics: [],
        confidence: 0.95,
      },
    ];

    const gateResult = await ClaimVerificationEngine.executeVerificationGate(
      "user-1",
      bulletStatements,
      evidencePool
    );

    expect(gateResult.unsupportedMetricsCount).toBeGreaterThan(0);
    expect(gateResult.blockedClaimsCount).toBeGreaterThan(0);
    expect(gateResult.passed).toBe(false);
    expect(gateResult.failureReasons.length).toBeGreaterThan(0);
  });
});
