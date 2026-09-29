import { describe, it, expect } from "vitest";
import { chunkDocument, extractTechnologiesFromText, extractMetricsFromText } from "../../src/lib/ai/retrieval/chunker";
import { BM25Index } from "../../src/lib/ai/retrieval/bm25";
import {
  cosineSimilarity,
  retrieveHybridCandidateEvidence,
} from "../../src/lib/ai/retrieval/hybrid-retriever";
import { generateDeterministicUnitVector } from "../../src/lib/ai/retrieval/embedding-service";
import {
  buildClaimProvenanceRecords,
  auditResumeGrounding,
} from "../../src/lib/ai/retrieval/provenance";
import type { EvidenceItem } from "../../src/lib/ai/schemas/evidence-schema";
import type { ResumeClaim } from "../../src/lib/ai/schemas/resume-draft-schema";

describe("Phase 2: RAG & Evidence Grounding Pipeline", () => {
  describe("Evidence Chunker & Entity Extraction", () => {
    it("extracts recognized technologies and metrics accurately", () => {
      const text = "Architected a PostgreSQL and Redis backend using TypeScript and Docker, reducing API latency by 45% for 50k daily active users.";
      const techs = extractTechnologiesFromText(text);
      const metrics = extractMetricsFromText(text);

      expect(techs).toContain("postgresql");
      expect(techs).toContain("redis");
      expect(techs).toContain("typescript");
      expect(techs).toContain("docker");

      expect(metrics.length).toBeGreaterThan(0);
      const metricValues = metrics.map((m) => m.metricValue);
      expect(metricValues.some((v) => v.includes("45%"))).toBe(true);
    });

    it("chunks large documents into semantic pieces while preserving metadata", () => {
      const rawDoc = {
        candidateId: "user-123",
        sourceType: "experience" as const,
        sourceId: "exp-1",
        title: "Senior Software Engineer at Acme Corp",
        rawText: `
          • Designed and deployed high-throughput distributed ingestion pipelines using Go and Kafka.
          • Reduced database query times from 850ms to 45ms by introducing Redis caching layers.
          • Implemented robust unit and integration testing suites with Jest and Vitest, achieving 92% code coverage.
          • Mentored 4 junior engineers on clean code practices, Git workflows, and CI/CD automation with GitHub Actions.
        `,
      };

      const chunks = chunkDocument(rawDoc, { maxChunkSize: 200, chunkOverlap: 40 });
      expect(chunks.length).toBeGreaterThan(1);
      for (const chunk of chunks) {
        expect(chunk.candidateId).toBe("user-123");
        expect(chunk.sourceType).toBe("experience");
        expect(chunk.content.length).toBeGreaterThan(0);
      }
    });
  });

  describe("BM25 Okapi Lexical Index", () => {
    const mockItems: EvidenceItem[] = [
      {
        id: "ev-1",
        candidateId: "u-1",
        sourceType: "experience",
        title: "Backend Engineer",
        content: "Built distributed microservices in Go, PostgreSQL, and Docker for payment processing.",
        technologies: ["go", "postgresql", "docker"],
        concepts: ["microservices", "payments"],
        metrics: [],
        verified: true,
        confidence: 1.0,
        metadata: {},
      },
      {
        id: "ev-2",
        candidateId: "u-1",
        sourceType: "project",
        title: "Frontend Dashboard",
        content: "Crafted interactive React, Next.js, and Tailwind CSS web dashboard with real-time charts.",
        technologies: ["react", "next.js", "tailwind"],
        concepts: ["frontend", "ui"],
        metrics: [],
        verified: true,
        confidence: 1.0,
        metadata: {},
      },
      {
        id: "ev-3",
        candidateId: "u-1",
        sourceType: "project",
        title: "AI RAG Search Engine",
        content: "Developed full-text vector similarity search with pgvector, LangChain, and OpenAI embeddings.",
        technologies: ["pgvector", "python", "embeddings"],
        concepts: ["rag", "llm", "search"],
        metrics: [],
        verified: true,
        confidence: 1.0,
        metadata: {},
      },
    ];

    it("ranks relevant documents top for specific keyword queries", () => {
      const bm25 = new BM25Index(mockItems);
      const results = bm25.search("PostgreSQL Docker microservices");

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.item.id).toBe("ev-1");
      expect(results[0]?.bm25Score).toBeGreaterThan(0);
    });

    it("ranks AI/RAG project first when searching for vector similarity embeddings", () => {
      const bm25 = new BM25Index(mockItems);
      const results = bm25.search("vector embeddings pgvector search");

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.item.id).toBe("ev-3");
    });
  });

  describe("Vector Cosine Math & Hybrid Retrieval", () => {
    it("computes exact cosine similarity between normalized unit vectors", () => {
      const vecA = generateDeterministicUnitVector("hello world", 1536);
      const vecB = generateDeterministicUnitVector("hello world", 1536);
      const vecC = generateDeterministicUnitVector("different query entirely", 1536);

      const simIdentical = cosineSimilarity(vecA, vecB);
      const simDifferent = cosineSimilarity(vecA, vecC);

      expect(simIdentical).toBeCloseTo(1.0, 4);
      expect(simDifferent).toBeLessThan(0.95);
    });

    it("executes hybrid retrieval combining lexical, dense, and skill boost scores", async () => {
      const evidencePool: EvidenceItem[] = [
        {
          id: "ev-react",
          candidateId: "u-1",
          sourceType: "project",
          title: "Next.js E-Commerce Platform",
          content: "Built scalable frontend with React, TypeScript, and Tailwind CSS.",
          technologies: ["react", "typescript", "tailwind", "next.js"],
          concepts: ["ecommerce", "web"],
          metrics: [],
          verified: true,
          confidence: 1.0,
          metadata: {
            embedding: generateDeterministicUnitVector("Next.js React TypeScript web app", 1536),
          },
        },
        {
          id: "ev-python",
          candidateId: "u-1",
          sourceType: "experience",
          title: "Data Engineer",
          content: "Managed data pipelines with Python, Spark, and AWS S3.",
          technologies: ["python", "spark", "aws"],
          concepts: ["data", "etl"],
          metrics: [],
          verified: true,
          confidence: 1.0,
          metadata: {
            embedding: generateDeterministicUnitVector("Python Spark ETL data pipelines", 1536),
          },
        },
      ];

      const result = await retrieveHybridCandidateEvidence(
        "React TypeScript Frontend Engineer",
        evidencePool,
        ["React", "TypeScript"],
        { topK: 5 }
      );

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items[0]?.evidence.id).toBe("ev-react");
      expect(result.items[0]?.combinedScore).toBeGreaterThan(0.5);
      expect(result.items[0]?.skillBoostScore).toBeGreaterThan(0);
    });
  });

  describe("Claim Provenance & Grounding Audit", () => {
    const evidencePool: EvidenceItem[] = [
      {
        id: "ev-payments",
        candidateId: "u-1",
        sourceType: "experience",
        title: "Senior Software Engineer",
        content: "Built Stripe payment integration with Node.js and PostgreSQL handling $5M processing volume.",
        technologies: ["node.js", "postgresql", "stripe"],
        concepts: ["payments"],
        metrics: [{ metricName: "volume", metricValue: "$5M" }],
        verified: true,
        confidence: 1.0,
        metadata: {},
      },
    ];

    it("identifies grounded claims with backing evidence records", () => {
      const claims: ResumeClaim[] = [
        {
          id: "claim-1",
          claimText: "Integrated Stripe payment gateway using Node.js and PostgreSQL for $5M volume.",
          evidenceIds: ["ev-payments"],
          confidenceScore: 0.95,
          isVerified: true,
        },
      ];

      const records = buildClaimProvenanceRecords(claims, evidencePool);
      expect(records.length).toBe(1);
      expect(records[0]?.verificationStatus).toBe("grounded");
      expect(records[0]?.evidenceId).toBe("ev-payments");
      expect(records[0]?.matchedTechnologies).toContain("node.js");
    });

    it("identifies unsupported claims that lack candidate evidence", () => {
      const claims: ResumeClaim[] = [
        {
          id: "claim-fake",
          claimText: "Invented new blockchain consensus algorithm at Google X with 10M daily transactions.",
          evidenceIds: ["non-existent-id"],
          confidenceScore: 0.1,
          isVerified: false,
        },
      ];

      const audit = auditResumeGrounding(claims, evidencePool);
      expect(audit.totalClaims).toBe(1);
      expect(audit.unsupportedClaimsCount).toBe(1);
      expect(audit.groundedClaimsCount).toBe(0);
      expect(audit.groundingRatePercentage).toBe(0);
    });
  });

  describe("Embedding Environment & Strict Production Safety", () => {
    it("throws an explicit PROVIDER_ERROR in production mode if API key is missing", async () => {
      const originalEnv = process.env["NODE_ENV"];
      const originalMode = process.env["EMBEDDING_MODE"];
      const originalKey = process.env["OPENROUTER_API_KEY"];

      try {
        process.env["EMBEDDING_MODE"] = "production";
        delete process.env["OPENROUTER_API_KEY"];

        const { generateDenseEmbedding } = await import("../../src/lib/ai/retrieval/embedding-service");
        
        await expect(
          generateDenseEmbedding("Senior Software Engineer")
        ).rejects.toThrow(/embedding_unavailable/);
      } finally {
        if (originalEnv !== undefined) process.env["NODE_ENV"] = originalEnv;
        else delete process.env["NODE_ENV"];

        if (originalMode !== undefined) process.env["EMBEDDING_MODE"] = originalMode;
        else delete process.env["EMBEDDING_MODE"];

        if (originalKey !== undefined) process.env["OPENROUTER_API_KEY"] = originalKey;
        else delete process.env["OPENROUTER_API_KEY"];
      }
    });

    it("generates deterministic unit vectors in offline test/dev mode without throwing", () => {
      const vec = generateDeterministicUnitVector("PostgreSQL Database Optimization", 1536);
      expect(vec.length).toBe(1536);
      
      // Verify L2 norm is 1.0 (unit vector)
      const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
      expect(norm).toBeCloseTo(1.0, 4);
    });
  });
});
