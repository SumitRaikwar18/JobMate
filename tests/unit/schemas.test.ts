import { describe, it, expect } from "vitest";
import { JobRequirementsSchema } from "../../src/lib/ai/schemas/jd-schema";
import { EvidenceItemSchema } from "../../src/lib/ai/schemas/evidence-schema";
import { CriticResultSchema } from "../../src/lib/ai/schemas/critic-schema";
import { ResumeDraftSchema } from "../../src/lib/ai/schemas/resume-draft-schema";
import { ATSReportSchema } from "../../src/lib/ai/schemas/ats-schema";
import { GitHubAnalysisSchema } from "../../src/lib/ai/schemas/github-schema";

describe("Phase 1: AI Zod Schemas & Validation", () => {
  it("validates structured JobRequirements", () => {
    const valid = {
      roleTitle: "Staff AI Systems Engineer",
      company: "Acme AI",
      seniority: "senior",
      requiredSkills: [
        {
          name: "Python",
          normalizedName: "python",
          category: "language",
          importance: "required",
          evidenceExpected: true,
        },
        {
          name: "PostgreSQL",
          normalizedName: "postgresql",
          category: "database",
          importance: "required",
          evidenceExpected: true,
        },
      ],
      preferredSkills: [],
      responsibilities: ["Architect RAG retrieval systems", "Optimize latency"],
      qualifications: ["5+ years experience in distributed systems"],
      domainSignals: ["RAG", "Vector Search"],
      toolingSignals: ["Docker", "Kubernetes"],
      keywords: ["Python", "PostgreSQL", "RAG"],
    };

    const parsed = JobRequirementsSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it("rejects JobRequirements with missing required roleTitle", () => {
    const invalid = {
      company: "Acme AI",
      requiredSkills: [],
    };
    const parsed = JobRequirementsSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it("validates EvidenceItem with provenance", () => {
    const validEvidence = {
      id: "ev-101",
      candidateId: "cand-456",
      sourceType: "github",
      sourceUrl: "https://github.com/user/jobmate",
      title: "Built PostgreSQL Vector Retriever",
      content: "Implemented match_candidate_evidence RPC using pgvector.",
      technologies: ["PostgreSQL", "pgvector", "TypeScript"],
      concepts: ["Vector Search", "Cosine Similarity"],
      metrics: [],
      verified: true,
      confidence: 0.95,
      sourcePath: "src/lib/ai/retrieval/vector-retriever.ts",
      sourceLineStart: 42,
      sourceLineEnd: 88,
    };

    const parsed = EvidenceItemSchema.safeParse(validEvidence);
    expect(parsed.success).toBe(true);
  });

  it("validates CriticResult with claim audit verdicts", () => {
    const validReport = {
      passed: true,
      overallGroundingScore: 92,
      verifiedClaimsCount: 5,
      unsupportedClaimsCount: 0,
      claims: [
        {
          claimId: "cl-1",
          claimText: "Engineered pgvector semantic retrieval pipeline",
          verdict: "supported",
          evidenceIds: ["ev-101"],
          explanation: "Supported by repository source implementation in vector-retriever.ts",
          confidence: 0.95,
        },
      ],
      critique: "All technical claims are verified against ground truth.",
      status: "verified",
    };

    const parsed = CriticResultSchema.safeParse(validReport);
    expect(parsed.success).toBe(true);
  });

  it("validates ATSReport with explainable issues and disclaimer", () => {
    const validATS = {
      overallScore: 88,
      keywordCoverage: 85,
      evidenceCoverage: 90,
      sectionCompleteness: 100,
      formattingScore: 95,
      readabilityScore: 82,
      actionVerbScore: 90,
      quantifiableImpactScore: 80,
      matchedKeywords: ["Python", "PostgreSQL", "RAG"],
      missingKeywords: ["FastAPI"],
      strongActionVerbs: ["Architected", "Engineered"],
      weakActionVerbs: [],
      issues: [
        {
          id: "iss-1",
          category: "keyword_coverage",
          severity: "warning",
          message: "Missing target keyword: FastAPI",
          suggestedFix: "Consider adding verified FastAPI experience if applicable.",
        },
      ],
    };

    const parsed = ATSReportSchema.safeParse(validATS);
    expect(parsed.success).toBe(true);
  });

  it("validates GitHubAnalysis with verified claims", () => {
    const validGithub = {
      repoUrl: "https://github.com/user/project",
      fullName: "user/project",
      description: "Distributed task engine",
      primaryLanguage: "TypeScript",
      languages: { TypeScript: 12000, Python: 3000 },
      topics: ["rag", "vector-search"],
      stars: 42,
      forks: 5,
      detectedTechnologies: ["TypeScript", "Docker", "PostgreSQL"],
      architectureSummary: "Client-server distributed architecture",
      complexityLevel: "Production-Grade",
      verifiedClaims: [
        {
          claim: "Built Dockerized backend architecture",
          source: {
            repository: "user/project",
            path: "Dockerfile",
            lineStart: 1,
            lineEnd: 20,
          },
          evidence: "Dockerfile present with multi-stage build",
          confidence: 1.0,
          category: "deployment",
        },
      ],
      xyzBullets: [
        "Architected containerized microservice utilizing Docker and TypeScript.",
      ],
      atsKeywords: ["TypeScript", "Docker", "PostgreSQL"],
    };

    const parsed = GitHubAnalysisSchema.safeParse(validGithub);
    expect(parsed.success).toBe(true);
  });
});
