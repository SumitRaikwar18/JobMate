import { describe, it, expect } from "vitest";
import { EvidenceService } from "@/lib/ai/evidence/evidence-service";
import type { EvidenceItem, EvidenceLevel } from "@/lib/ai/evidence/evidence-types";
import { EVIDENCE_LEVEL_WEIGHTS } from "@/lib/ai/evidence/evidence-types";

describe("Evidence Domain & Graph Tests", () => {
  it("computes evidence confidence strictly derived from tier and signal diversity without defaulting to 1.0", () => {
    // L0 User Assertion
    const l0Confidence = EvidenceService.calculateConfidence("L0_USER_ASSERTION", 1, false);
    expect(l0Confidence).toBeLessThan(0.30);

    // L3 Manifest Dependency
    const l3Confidence = EvidenceService.calculateConfidence("L3_MANIFEST_DEPENDENCY", 1, false);
    expect(l3Confidence).toBeGreaterThan(0.60);
    expect(l3Confidence).toBeLessThan(0.85);

    // L6 Test / CI Evidence
    const l6Confidence = EvidenceService.calculateConfidence("L6_TEST_CI", 3, false);
    expect(l6Confidence).toBeGreaterThan(0.90);
  });

  it("applies staleness penalty for technologies unseen in over 12 months", () => {
    const freshConfidence = EvidenceService.calculateConfidence("L4_SOURCE_CODE", 1, false);
    const staleConfidence = EvidenceService.calculateConfidence("L4_SOURCE_CODE", 1, true);

    expect(staleConfidence).toBeLessThan(freshConfidence);
    expect(freshConfidence - staleConfidence).toBeCloseTo(0.25, 2);
  });

  it("correctly identifies stale technologies in an evidence list", () => {
    const twoYearsAgo = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const sampleItems: EvidenceItem[] = [
      {
        id: "ev-1",
        candidateId: "user-1",
        sourceType: "github",
        evidenceLevel: "L4_SOURCE_CODE",
        verificationStatus: "verified",
        title: "Legacy Kubernetes Cluster",
        content: "kubectl manifests from 2 years ago",
        observedAt: twoYearsAgo,
        technologies: ["Kubernetes"],
        concepts: ["DevOps"],
        metrics: [],
        confidence: 0.7,
      },
      {
        id: "ev-2",
        candidateId: "user-1",
        sourceType: "github",
        evidenceLevel: "L4_SOURCE_CODE",
        verificationStatus: "verified",
        title: "Modern React App",
        content: "React components",
        observedAt: yesterday,
        technologies: ["React", "TypeScript"],
        concepts: ["Frontend"],
        metrics: [],
        confidence: 0.9,
      },
    ];

    const freshness = EvidenceService.assessFreshness(sampleItems);
    expect(freshness.get("kubernetes")?.isStale).toBe(true);
    expect(freshness.get("react")?.isStale).toBe(false);
  });
});
