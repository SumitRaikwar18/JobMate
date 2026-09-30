# JobMate — Final Production Architecture Audit

**Audit Date**: October 2026  
**System Status**: **PRODUCTION-HARDENED & VERIFIED**  
**Core Principle**: *"Show me the proof."* Every generated career statement and match conclusion is deterministically grounded in candidate evidence.

---

## 1. System Architecture & Real Execution Path

JobMate is built as an **Evidence Intelligence and Career Engineering Platform**. Unlike generic generative AI wrappers that hallucinate achievements or assign ungrounded confidence scores, JobMate enforces end-to-end traceability from raw engineering artifacts to final tailored resumes.

### End-to-End Execution Flow

```text
User Input (Repository URL / Job Description)
      │
      ├──▶ [1] GitHub Evidence Miner (AST, Manifests, CI/CD, Commits)
      │         │
      │         └──▶ Normalized Evidence Items (L1-L7 Tiers, Hashes, Authorship)
      │                   │
      │                   └──▶ Supabase pgvector Database (candidate_evidence table)
      │
      └──▶ [2] Requirement Graph Extractor
                │
                └──▶ Structured Requirements (Hard/Soft Skills, Evidence Needed)
                          │
                          ▼
            [3] Hybrid RAG Retrieval & Multi-Signal Matcher
                • Dense Cosine Similarity (pgvector embeddings)
                • BM25 Lexical Keyword Matching
                • Provenance Level Boost (L3-L6 weights)
                • Temporal Freshness Decay (Fresh / Aging / Stale)
                          │
                          ▼
            [4] Deterministic Requirement Classification
                • SUPPORTED (Evidence matches with proof)
                • PARTIALLY_SUPPORTED (Secondary evidence / user assertion)
                • CONFLICTED (Inconsistencies detected)
                • STALE (Observed > 36 months ago)
                • ABSENT (No backing proof)
                          │
        ┌─────────────────┴─────────────────┐
        ▼                                   ▼
 [5A] Evidence Acquisition             [5B] Resume StateGraph Planner
      • Skill vs Evidence Gap               • Structured Resume Plan
      • Actionable Artifact Tasks           • XYZ Achievement Synthesizer
      • Required Proof Checklist            • Atomic Claim Decomposition
        │                                   │
        ▼                                   ▼
 [6] Candidate Builds Proof            [7] Claim Verification Engine & Hard Gate
                                            • Rejects unverified metrics (e.g. "slashed latency 45%")
                                            • Demotes ungrounded claims
                                            • Blocks generation if high-risk unsupported claims exist
                                            │
                                            ▼
                                       [8] Deterministic LaTeX Compiler & PDF
```

---

## 2. Evidence Graph Hierarchy (L1 - L7)

All evidence ingested into JobMate is categorized and scored deterministically according to verifiable engineering depth:

| Level | Category | Source Artifacts | Truth Weight | Default Confidence |
|---|---|---|---|---|
| **L7** | External Verification | Production URLs, third-party benchmarks, npm registry packages | 1.00 | 0.98 |
| **L6** | Test & CI Execution | GitHub Actions workflows, Jest/Vitest test suites, coverage reports | 0.90 | 0.95 |
| **L5** | Commit & PR History | Candidate-authored Git commits, merged pull requests, code reviews | 0.85 | 0.90 |
| **L4** | Source Code & AST | Tree-sitter / regex AST parser extracting imports, functions, classes | 0.75 | 0.85 |
| **L3** | Manifest Dependencies | `package.json`, `Cargo.toml`, `go.mod`, `requirements.txt` | 0.65 | 0.75 |
| **L2** | Readme / Documentation | `README.md`, docstrings, architecture diagrams | 0.40 | 0.50 |
| **L1** | User Self-Assertion | Manual resume text, form inputs, unverified claims | 0.20 | 0.35 |

---

## 3. Trust-Bypassing Fallbacks Audit & Remediation

All synthetic fallbacks and ungrounded confidence assignments were audited and hardened:

1. **Elimination of Fake `verified: true` & `confidence: 1.0`**:
   - **Chunker (`chunker.ts`)**: Raw ingested text chunks now default to `verified: false` with tiered baseline confidence (0.50 for resume text, 0.75 for repository chunks) until deterministically verified against engineering artifacts.
   - **Evidence Ingestion (`evidence-ingestion.ts`)**: Database reads now respect explicit stored verification statuses (`row.verified ?? false`, `row.confidence ?? 0.5`) rather than assuming perfection.
   - **StateGraph (`state-graph.ts`)**: In-memory evidence conversion dynamically evaluates candidate bank records (`item.verificationStatus === "VERIFIED"`), preserving unverified assertions without silent elevation.

2. **Hard Claim Gate Enforcement (`claim-verification-engine.ts`)**:
   - Decomposes resume bullet points into atomic facts (`metric_claim`, `technology_usage`, `leadership_claim`, `timeline_claim`).
   - Every metric assertion (e.g., `"reduced latency by 45%"`, `"scaled to 10M users"`) requires supporting L6 test or L4 telemetry artifacts. If absent, the claim is flagged as `blocked` and the Hard Gate prevents resume finalization.

3. **Temporal Freshness Evaluation (`evidence-service.ts`)**:
   - Evaluates timestamps against modern industry thresholds:
     - **FRESH**: Observed $\le 18$ months ago.
     - **AGING**: Observed between 18 and 36 months ago.
     - **STALE**: Observed $> 36$ months ago. Evidence undergoes confidence degradation.

---

## 4. Supabase Database & Security Verification

- **Schema Migration**: `supabase/migrations/20261001000000_evidence_graph_and_requirements.sql` provisions tables for `candidate_evidence`, `evidence_snapshots`, `evidence_relationships`, `evidence_conflicts`, `job_requirements`, `requirement_evidence_matches`, `evidence_plans`, `evidence_tasks`, and `ai_execution_traces`.
- **Row Level Security (RLS)**: Enforced across all tables with `auth.uid() = candidate_id` / `user_id`.
- **Tenant Isolation**: Candidate A cannot access, query, or mutate Candidate B's evidence items, conflict reports, or AI execution traces.

---

## 5. UI Evidence Intelligence Integration

- **Dedicated Evidence Explorer (`src/routes/evidence.tsx`)**: Allows candidates to inspect all ingested repositories, view exact evidence levels (L1–L7), verify confidence scores, filter by technologies, and examine detected conflicts.
- **Explainable Job Match Dashboard (`src/routes/jobs.tsx`)**: Replaces generic opaque percentage scores with structured requirement breakdown showing exact matching evidence, missing proof, and direct action items.
- **Candidate Provenance Modal (`src/components/builder/provenance-modal.tsx`)**: Shows sentence-by-sentence proof attribution for generated resume bullets with direct file links and commit references.

---

## 6. Audit Conclusion

JobMate has transitioned from a prototype AI tool to an **evidence-grounded career engineering system**. Unsupported metrics are stopped at the Hard Claim Gate, missing skills produce concrete evidence acquisition tasks, and candidate provenance is traceable at every layer.
