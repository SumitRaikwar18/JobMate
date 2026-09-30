import { describe, it, expect } from "vitest";
import { EvidenceConflictDetector } from "@/lib/ai/evidence/conflict-detector";
import type { EvidenceItem, AtomicFact } from "@/lib/ai/evidence/evidence-types";

describe("Evidence Conflict Detection Tests", () => {
  it("detects unsupported metric claims when benchmark or test artifacts are missing", () => {
    const atomicFacts: AtomicFact[] = [
      {
        factText: "Reduced API response latency by 45%",
        category: "metric_claim",
        status: "unsupported",
        matchedEvidenceIds: [],
        confidence: 0.5,
      },
    ];

    const evidencePool: EvidenceItem[] = [
      {
        id: "ev-1",
        candidateId: "user-1",
        sourceType: "github",
        evidenceLevel: "L3_MANIFEST_DEPENDENCY",
        verificationStatus: "verified",
        title: "FastAPI Dependency",
        content: "fastapi in requirements.txt",
        observedAt: new Date().toISOString(),
        technologies: ["FastAPI"],
        concepts: ["Backend"],
        metrics: [], // No quantified metric test
        confidence: 0.7,
      },
    ];

    const conflicts = EvidenceConflictDetector.detectConflicts(
      "user-1",
      "claim-1",
      atomicFacts,
      evidencePool
    );

    expect(conflicts.length).toBe(1);
    expect(conflicts[0]?.conflictType).toBe("METRIC_UNSUPPORTED");
    expect(conflicts[0]?.severity).toBe("high");
  });

  it("detects unverified technology assertions when no matching artifacts exist", () => {
    const atomicFacts: AtomicFact[] = [
      {
        factText: "Architected distributed Kafka event pipelines",
        category: "technology_usage",
        status: "unsupported",
        matchedEvidenceIds: [],
        confidence: 0.5,
      },
    ];

    const evidencePool: EvidenceItem[] = [
      {
        id: "ev-1",
        candidateId: "user-1",
        sourceType: "github",
        evidenceLevel: "L4_SOURCE_CODE",
        verificationStatus: "verified",
        title: "PostgreSQL Client",
        content: "pg pool",
        observedAt: new Date().toISOString(),
        technologies: ["PostgreSQL"],
        concepts: ["Database"],
        metrics: [],
        confidence: 0.9,
      },
    ];

    const conflicts = EvidenceConflictDetector.detectConflicts(
      "user-1",
      "claim-2",
      atomicFacts,
      evidencePool
    );

    expect(conflicts.length).toBe(1);
    expect(conflicts[0]?.conflictType).toBe("TECH_UNVERIFIED");
  });

  it("detects chronological timeline discrepancies", () => {
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();

    const evidencePool: EvidenceItem[] = [
      {
        id: "ev-rust",
        candidateId: "user-1",
        sourceType: "github",
        evidenceLevel: "L4_SOURCE_CODE",
        verificationStatus: "verified",
        title: "Rust CLI Tool",
        content: "Rust source",
        observedAt: sixMonthsAgo,
        technologies: ["Rust"],
        concepts: ["Systems"],
        metrics: [],
        confidence: 0.9,
      },
    ];

    // Candidate claims 4 years of Rust, but first repo was observed only 6 months ago
    const conflict = EvidenceConflictDetector.detectTimelineConflicts(
      "user-1",
      "Rust",
      4.0,
      evidencePool
    );

    expect(conflict).not.toBeNull();
    expect(conflict?.conflictType).toBe("TIMELINE_MISMATCH");
    expect(conflict?.description).toContain("earliest recorded repository activity");
  });
});
