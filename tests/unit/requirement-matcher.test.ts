import { describe, it, expect } from "vitest";
import { RequirementMatcher } from "@/lib/ai/requirements/requirement-matcher";
import type { JobRequirement, EvidenceItem } from "@/lib/ai/evidence/evidence-types";

describe("Requirement Matcher & Evidence Diversity Tests", () => {
  it("matches candidate evidence with diversity scoring and explicit proof explanations", () => {
    const requirement: JobRequirement = {
      id: "req-rag",
      candidateId: "user-1",
      requirementText: "Production RAG and Semantic Embeddings experience",
      category: "technical",
      normalizedSkills: ["RAG", "Embeddings", "pgvector"],
      importance: "high",
      evidenceNeeded: ["retrieval implementation", "vector database"],
      confidence: 0.9,
      createdAt: new Date().toISOString(),
    };

    const evidencePool: EvidenceItem[] = [
      {
        id: "ev-1",
        candidateId: "user-1",
        sourceType: "github",
        evidenceLevel: "L4_SOURCE_CODE",
        verificationStatus: "verified",
        title: "pgvector Hybrid Retriever",
        content: "pgvector similarity queries",
        observedAt: new Date().toISOString(),
        technologies: ["pgvector", "RAG"],
        concepts: ["Vector Search"],
        metrics: [],
        confidence: 0.95,
      },
      {
        id: "ev-2",
        candidateId: "user-1",
        sourceType: "github",
        evidenceLevel: "L3_MANIFEST_DEPENDENCY",
        verificationStatus: "verified",
        title: "pgvector NPM Dependency",
        content: "pgvector in package.json",
        observedAt: new Date().toISOString(),
        technologies: ["pgvector"],
        concepts: ["Dependencies"],
        metrics: [],
        confidence: 0.70,
      },
      {
        id: "ev-3",
        candidateId: "user-1",
        sourceType: "github",
        evidenceLevel: "L6_TEST_CI",
        verificationStatus: "verified",
        title: "Retrieval Unit Tests",
        content: "vitest tests for hybrid retriever",
        observedAt: new Date().toISOString(),
        technologies: ["RAG", "Vitest"],
        concepts: ["Testing"],
        metrics: [],
        confidence: 0.96,
      },
    ];

    const decision = RequirementMatcher.matchRequirement(requirement, evidencePool);

    expect(decision.status).toBe("supported");
    expect(decision.proofScore).toBeGreaterThan(75);
    expect(decision.evidenceDiversity).toBeGreaterThanOrEqual(3);
    expect(decision.explanation).toContain("Corroborated across");
  });

  it("classifies absent requirements with zero proof score and clear absence reasoning", () => {
    const requirement: JobRequirement = {
      id: "req-k8s",
      candidateId: "user-1",
      requirementText: "Kubernetes cluster administration",
      category: "technical",
      normalizedSkills: ["Kubernetes", "Helm"],
      importance: "high",
      evidenceNeeded: ["deployment manifests", "helm charts"],
      confidence: 0.9,
      createdAt: new Date().toISOString(),
    };

    const evidencePool: EvidenceItem[] = []; // No Kubernetes evidence

    const decision = RequirementMatcher.matchRequirement(requirement, evidencePool);

    expect(decision.status).toBe("absent");
    expect(decision.proofScore).toBe(0);
    expect(decision.evidenceDiversity).toBe(0);
    expect(decision.explanation).toContain("No candidate evidence");
  });
});
