# JobMate — Real AI Engineering Rebuild Implementation Plan

## 1. Overview & Objective
Transform JobMate from an AI resume writer with heuristic scoring into an **Evidence-Grounded Career Intelligence System** governed by truth, multi-signal verification, and counterfactual gap analysis.

---

## 2. File Change Matrix

### 2.1 Files to Archive / Remove from Flagship Core
- `src/lib/ai/agents/outreach-agent.ts` (Archive / decouple from core product)
- `src/lib/ai/persona-brancher.ts` (Remove generic ungrounded persona generation; replace with evidence-aware candidate profiles)
- `src/server/telegram-bot.ts` (Decouple from core evidence pipeline)
- `package.json` (Remove standalone `bot` runner script from core)

### 2.2 Files to Create (Domain Models, Services & Tools)
- `supabase/migrations/20261001000000_evidence_graph_and_requirements.sql` (Additive schema for evidence items, relationships, snapshots, claims, conflicts, requirements, and execution telemetry)
- `src/lib/ai/evidence/evidence-types.ts` (L0-L7 evidence hierarchy, verification status, atomic facts, provenance records)
- `src/lib/ai/evidence/evidence-service.ts` (Database-native CRUD, temporal freshness, confidence scoring, candidate RLS isolation)
- `src/lib/ai/evidence/conflict-detector.ts` (Timeline, metric, and cross-source conflict detection engine)
- `src/lib/ai/github/github-evidence-miner.ts` (Multi-signal GitHub ingestion: repos, source inspection, manifests, commits, PRs, CI workflows, and AST code intelligence)
- `src/lib/ai/requirements/requirement-extractor.ts` (Structured JD requirement extraction, taxonomy normalization, and evidence-needed mapping)
- `src/lib/ai/requirements/requirement-matcher.ts` (Multi-signal evidence-to-requirement scoring with diversity weighting and explainability)
- `src/lib/ai/agents/evidence-acquisition-agent.ts` (Autonomous tool-calling agent that resolves missing evidence via GitHub search, file queries, and evidence requests)
- `src/lib/ai/planning/career-gap-planner.ts` (Counterfactual gap analysis and concrete artifact-building tasks)
- `src/lib/ai/verification/claim-verification-engine.ts` (Deterministic atomic fact decomposition and hard claim gate)
- `src/lib/ai/telemetry/ai-tracer.ts` (Production telemetry linking run_id, node_id, attempt, token usage, latency, and tool calls)
- `src/routes/evidence.tsx` (Dedicated Evidence Explorer & Proof Coverage surface)

### 2.3 Files to Modify (Deep Architectural Upgrades)
- `src/lib/ai/state-graph.ts` (Wire production StateGraph directly to pgvector + BM25 persistent evidence database; enforce atomic claim verification and eliminate local array shortcuts)
- `src/lib/ai/retrieval/hybrid-retriever.ts` (Database-native hybrid search with pgvector RPC, BM25 text rank, RRF fusion, and diversity reranking)
- `src/lib/ai/retrieval/reranker.ts` (Multi-factor reranking: relevance, evidence level L0-L7, source reliability, and recency)
- `src/lib/ai/agents/github-agent.ts` (Refactor into structured evidence miner outputting explicit evidence records)
- `src/lib/ai/agents/critic-guardrail-agent.ts` (Enforce hard claim gating; reject ungrounded metrics and hallucinated production claims)
- `src/lib/ai/agents/synthesizer-agent.ts` (Ground synthesis strictly on verified evidence records with atomic provenance links)
- `src/lib/ai/model-router.ts` (Task-specific routing with real latency and token tracking)
- `src/lib/ai/types.ts` & schemas (`evidence-schema.ts`, `jd-schema.ts`, `resume-draft-schema.ts`)
- `src/routes/dashboard.tsx` (Display Proof Coverage, Evidence Health, Conflicts, Stale Skills, and Plan Progress)
- `src/routes/jobs.tsx` (Display Requirement Coverage breakdowns, Evidence Diversity, and Counterfactual Gap Plans)
- `src/routes/builder.tsx` (Connect live state graph, provenance inspector, and verified claim badges)
- `src/components/layout/app-layout.tsx` (Add navigation link to Evidence Explorer)

### 2.4 Tests and Evaluations to Add/Update
- `evals/datasets/evaluation-dataset.ts` (50+ JDs, 100+ evidence items, 20+ conflict cases, 20+ unsupported claim cases)
- `tests/unit/evidence-graph.test.ts` (Evidence level hierarchy, confidence math, temporal freshness, candidate isolation)
- `tests/unit/claim-verifier.test.ts` (Atomic fact extraction, metric blocking, hard claim gating)
- `tests/unit/conflict-detection.test.ts` (Timeline conflicts, metric mismatch, resume vs repo discrepancy)
- `tests/unit/github-evidence-miner.test.ts` (Multi-signal repo, commit, CI, and dependency parsing)
- `tests/unit/hybrid-retriever.test.ts` (Database-backed pgvector + BM25 + RRF fusion)

---

## 3. Dependency & Risk Analysis
1. **Database Schema Continuity**: Ensure additive Supabase tables do not drop or corrupt existing `resumes`, `jobs`, or `profiles` tables.
2. **Type Safety & Build Integrity**: Maintain strict `tsc --noEmit` compliance with `exactOptionalPropertyTypes`.
3. **Execution Order**:
   - Phase 1: Cleanup legacy paths (outreach, telegram from core, fake fallbacks).
   - Phase 2: Evidence domain model & database migrations (EvidenceItem, EvidenceLevel L0-L7, Claim, Conflict).
   - Phase 3: Real GitHub Evidence Miner (multi-signal parsing & AST code intelligence).
   - Phase 4: Production Database-Native Hybrid RAG (pgvector, BM25, RRF, evidence diversity reranking).
   - Phase 5: Requirement Graph & Evidence Matcher.
   - Phase 6: Deterministic Claim Verification Engine & Hard Gating.
   - Phase 7: Autonomous Evidence Acquisition Agent.
   - Phase 8: Counterfactual Career Gap Planner.
   - Phase 9: Verified Application Generation & Telemetry.
   - Phase 10: Evaluation Benchmark Suite & UI Integration.
