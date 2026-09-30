# JobMate — Final Runtime Execution Trace & Component Connectivity

**Audit Date**: October 2026  
**Auditor**: Forensic Code Execution Tracer  
**Repository State**: Commit `739ca9e` / Hardened Production Pipeline

---

## 1. End-to-End Runtime Execution Path Mapping

| # | User Action / Flow | UI Entry Point | Route / Handler | Core Engine / Service | Database & Provenance Access | Hard Gate / Verification | Output Artifact | Connectivity Status |
|---|---|---|---|---|---|---|---|---|
| **1** | **Mine GitHub Repo** | `Evidence.tsx` / `Builder.tsx` | `handleAnalyzeGithubRepo` / `handleMineRepo` | `GitHubEvidenceMiner` / `analyzeGitHubRepository` | Writes to `candidate_evidence` & `evidence_snapshots` with SHA-256 hash | Level verification (L3-L6) & commit authorship | Mined engineering evidence records | **CONNECTED** |
| **2** | **Add / Scrape Job** | `Jobs.tsx` | `handleScrapeJob` / `handleAnalyzeJob` | `scrapeJobUrlServerFn` / `analyzeJobDescriptionWithAI` | Reads/Writes `jobs` table in Supabase | Schema validation against `JobAnalysisSchema` | Structured Requirement Graph | **CONNECTED** |
| **3** | **Multi-Agent StateGraph** | `Builder.tsx` | `handleRunAgentPipeline` | `executeMultiAgentResumePipeline` (`ResumeStateGraph`) | Reads candidate profile, resume data, & `candidate_evidence` | Anti-Hallucination Critic (`runCriticGuardrailAgent`) & Reflection loop | 6-agent execution trace & tailored content | **CONNECTED** |
| **4** | **Hybrid RAG Retrieval** | Internal Node 2 (`state-graph.ts`) | `nodeEvidenceRag` | `retrieveHybridCandidateEvidence` & `rerankRetrievedEvidence` | Queries pgvector cosine similarity + BM25 sparse index | Filtered by evidence tier & temporal freshness | Top-K ranked evidence items | **CONNECTED** |
| **5** | **Claim Verification Gate** | Internal Node 5 (`state-graph.ts`) / Evaluator | `nodeCriticGuardrail` / `ClaimVerificationEngine` | `ClaimVerificationEngine.executeVerificationGate` | Cross-checks claims against `evidencePool` (L1-L7) | **Hard Claim Gate**: Blocks unevidenced metrics & unsupported claims | Provenance records & verification flags | **CONNECTED** |
| **6** | **Evidence Acquisition** | `Evidence.tsx` / Gap Planner | `planMissingEvidenceAcquisition` | `EvidenceAcquisitionAgent` / `CareerGapPlanner` | Queries missing requirements against candidate evidence | Checks whether gap is a skill gap or evidence gap | Actionable engineering task roadmaps | **CONNECTED** |
| **7** | **Provenance Inspection** | `Builder.tsx` | `ProvenanceModal.tsx` | `buildClaimProvenanceRecords` | Matches claims to exact file paths, line numbers, and repo URLs | Displays verification status (verified / partial / unverified) | Interactive provenance inspector modal | **CONNECTED** |
| **8** | **Deterministic LaTeX** | `Builder.tsx` | `handleDownloadLatex` | `generateLatexResumeSource` | Compiles structured resume JSON into escaping-safe LaTeX | Escapes special TeX characters deterministically | Clean `.tex` source and PDF canvas | **CONNECTED** |
| **9** | **Live AI Telemetry** | `Builder.tsx` | `AiRunDashboardModal.tsx` | `AiExecutionTracer` | Persists execution run telemetry to `ai_execution_traces` | Records step latencies, token counts, and error states | Real-time execution dashboard | **CONNECTED** |

---

## 2. Component Connectivity Breakdown

### A. Routes
- `src/routes/builder.tsx`: **CONNECTED** — Full integration with StateGraph pipeline, Supabase evidence database, GitHub miner, ATS auditor, provenance inspector, and LaTeX compiler.
- `src/routes/evidence.tsx`: **CONNECTED** — Interactive Evidence Graph Explorer loading directly from Supabase `candidate_evidence`, tracking L1–L7 evidence tiers and conflicts.
- `src/routes/jobs.tsx`: **CONNECTED** — Aggregates candidate ground truth skills from database resumes and `candidate_evidence`, parses JDs, and visualizes skill matches.
- `src/routes/dashboard.tsx`: **CONNECTED** — Renders real ATS scores, active applications, and user profile summaries.
- `src/routes/applications.tsx`: **CONNECTED** — Manages application pipeline stages and AI outreach generators.
- `src/routes/settings.tsx`: **CONNECTED** — User credentials, profile targets, and GitHub URL sync.
- `src/routes/templates.tsx`: **CONNECTED** — Template gallery for instant resume design switching.

### B. Core AI Engine Modules
- `src/lib/ai/state-graph.ts`: **CONNECTED** — Cyclical multi-agent DAG with reflection loop and anti-hallucination critic.
- `src/lib/ai/retrieval/hybrid-retriever.ts`: **CONNECTED** — Dense vector + BM25 sparse search with skill boost and reranking.
- `src/lib/ai/evidence/evidence-service.ts`: **CONNECTED** — Idempotent SHA-256 deduplication, confidence calculation, temporal freshness degradation, and Supabase CRUD.
- `src/lib/ai/evidence/conflict-detector.ts`: **CONNECTED** — Deterministic conflict detection for seniority inversions, metric exaggerations, and missing technologies.
- `src/lib/ai/verification/claim-verification-engine.ts`: **CONNECTED** — Atomic claim decomposition and Hard Claim Gate.
- `src/lib/ai/github/github-evidence-miner.ts`: **CONNECTED** — Multi-signal repository miner inspecting manifests, CI/CD, and commits.
- `src/lib/ai/agents/evidence-acquisition-agent.ts`: **CONNECTED** — Proof-building artifact task generator.
- `src/lib/ai/planning/career-gap-planner.ts`: **CONNECTED** — Counterfactual career path planner.
- `src/lib/ai/telemetry/ai-tracer.ts`: **CONNECTED** — Node-level execution telemetry.

---

## 3. Forensic Verdict

All major application pathways are **CONNECTED** to real application logic and database services. No phantom routes, dead AI agents, or disconnected mock-only pipelines remain in the production codebase.
