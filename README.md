# JobMate — Evidence-Grounded AI Career Intelligence Engine

<div align="center">
  <img src="public/favicon.svg" alt="JobMate Logo" width="64" height="64" />
  <p><strong>Turn your real engineering work into evidence-backed, ATS-optimized job applications.</strong></p>
</div>

---

## 🌟 Executive Overview

**JobMate** is an evidence-grounded AI career intelligence engine built to solve the core defect of modern AI resume generators: **unsubstantiated claims and hallucinated metrics**.

Rather than using generic LLM prompt wrappers that invent fake companies, metrics, or technologies, JobMate enforces **100% Evidence Grounding** through:
1. **pgvector PostgreSQL Vector Store & Hybrid Retrieval**: Combines dense embeddings (`text-embedding-3-small`), BM25 lexical search, and skill taxonomy boosting.
2. **Multi-Agent StateGraph Pipeline**: 6-node state graph orchestrating JD analysis, semantic retrieval, strategic planning, Google XYZ synthesis, adversarial guardrail verification, and heuristic ATS auditing with active reflection loops.
3. **Deterministic Claim Provenance**: Every generated accomplishment bullet links back to verified evidence IDs with exact repository, line number, or candidate record attribution.
4. **GitHub AST & Code Intelligence**: Parses code manifests, dependencies, and file structures into verifiable accomplishment statements.
5. **Deterministic Single-Column LaTeX Compiler**: Emits compilable `.tex` source compliant with `glyphtounicode`, `titlesec`, and enterprise ATS parsers (Overleaf & pdflatex compatible).

---

## 🧠 System Architecture

```text
                         JOBMATE

                           USER
                            │
                            ▼
                    JOB DESCRIPTION
                            │
                            ▼
                     JD ANALYZER
                            │
                            ▼
                    REQUIREMENT GRAPH
                            │
                            ▼
              ┌─────────────────────────┐
              │   CANDIDATE EVIDENCE    │
              │                         │
              │ GitHub Manifests / AST  │
              │ Projects / Repositories │
              │ Experience & Roles      │
              │ Skills & Education      │
              └────────────┬────────────┘
                           │
                           ▼
                  EMBEDDING GENERATION
              (openai/text-embedding-3-small)
                           │
                           ▼
                    SUPABASE PGVECTOR
                 (candidate_evidence HNSW)
                           │
                    ┌──────┴──────┐
                    ▼             ▼
                 VECTOR          BM25
                 SEARCH          SEARCH
                    │             │
                    └──────┬──────┘
                           ▼
                     HYBRID RANKING
                 (Dense + Sparse + Skill)
                           │
                           ▼
                  STRUCTURED RERANKER
             (LLM-Based Evidence Reranker)
                           │
                           ▼
                   RESUME PLANNER
                           │
                           ▼
                GROUNDED GENERATOR
              (Google XYZ Bullet Synthesizer)
                           │
                           ▼
                  CLAIM PROVENANCE
             (Per-bullet Evidence Attribution)
                           │
                           ▼
                    CRITIC / VERIFY
                           │
                     ┌─────┴─────┐
                     │           │
                   FAIL         PASS
                     │           │
                     ▼           ▼
                 REFLECTION    ATS AUDIT
                     │           │
                     └─────┐ ┌───┘
                           ▼ ▼
                     FINAL RESUME
                           │
                           ▼
                    LATEX COMPILER
```

---

## 🤖 Multi-Agent Pipeline & StateGraph

JobMate implements a modular, typed state graph with conditional reflection edges:

| Agent Node | Responsibility | Prompt Version | Recommended Model |
| :--- | :--- | :--- | :--- |
| **`JD_Analyzer`** | Decomposes job postings into required hard skills, soft skills, seniority indicators, and core responsibilities. | `v1.2` | `openai/gpt-4o-mini` |
| **`Evidence_Retriever`** | Executes dense cosine search (`vector(1536)`) + BM25 lexical retrieval + skill taxonomy boosting over candidate evidence. | `v1.0` | `openai/text-embedding-3-small` |
| **`Resume_Planner`** | Designs section hierarchies, template selection, and keyword distribution blueprints. | `v1.1` | `openai/gpt-4o-mini` |
| **`XYZ_Synthesizer`** | Drafts accomplishment bullets strictly adhering to Google's XYZ formula (*"Accomplished [X] as measured by [Y], by doing [Z]"*). | `v2.0` | `openai/gpt-4o-mini` |
| **`Critic_Guardrail`** | Adversarially verifies every claim against ground-truth evidence. Triggers reflection passes if unsupported metrics or tools are detected. | `v1.3` | `openai/gpt-4o-mini` |
| **`ATS_Auditor`** | Performs heuristic keyword coverage, action verb scoring, and single-column formatting audit. | `v1.1` | `openai/gpt-4o-mini` |

---

## 🔍 Real RAG & Provenance Pipeline

```text
Candidate Profile / GitHub AST / Projects
      ↓
Document Chunking & Metadata Tagging (chunker.ts)
      ↓
Embedding Generation (openai/text-embedding-3-small)
      ↓
Supabase PostgreSQL + pgvector (candidate_evidence)
      ↓
Dense Vector Cosine + BM25 Lexical + Skill Boost (hybrid-retriever.ts)
      ↓
LLM-Based Structured Evidence Reranker (reranker.ts)
      ↓
Grounded Generation & Claim Provenance Graph (provenance.ts)
```

### Claim Attribution Example:
```json
{
  "claimText": "Engineered automated billing integration using Node.js and PostgreSQL for $2.5M processing volume.",
  "evidenceId": "ev-stripe-billing",
  "evidenceSourceType": "experience",
  "confidenceScore": 0.95,
  "verificationStatus": "grounded",
  "matchedTechnologies": ["node.js", "postgresql", "docker"],
  "matchedMetrics": ["$2.5M"],
  "explanation": "Grounded in experience record 'Senior Engineer at FinTech Corp'. Verified matching technologies and transaction volume."
}
```

---

## 📊 Evaluation Benchmark Results

JobMate includes an automated evaluation suite (`evals/run-evals.ts`) benchmarking retrieval quality, failure-case defenses, and grounding verification across a prototype evaluation dataset (10 diverse job descriptions, 15 candidate evidence records, and 5 explicit failure cases):

| Metric | Measured Score | Evaluation Benchmark Target | Status |
| :--- | :--- | :--- | :--- |
| **Mean Recall@5** | **83.3%** | > 80.0% | ✅ Passed |
| **Mean Precision@5** | **53.0%** | > 50.0% | ✅ Passed |
| **Mean Reciprocal Rank (MRR)** | **0.900** | > 0.850 | ✅ Passed |
| **Failure-Case Pass Rate** | **100%** (5/5) | 100% | ✅ Passed |
| **Grounding Accuracy (on Benchmark)** | **100%** | > 95% | ✅ Passed |
| **Unsupported Claim Rate (on Benchmark)** | **0%** | < 5% | ✅ Passed |
| **Hallucination Rate (on Benchmark)** | **0%** | < 2% | ✅ Passed |

> **Evaluation Methodology & Scope Note**: Metrics above reflect evaluation against the included benchmark dataset (`evals/datasets/`). While the multi-agent critic guardrail actively rejects unsupported claims and penalizes unverified metrics, real-world LLM outputs may still exhibit edge-case variations across unconstrained user inputs.

Run benchmarks locally:
```bash
npm run evals
```

---

## 🛡️ Database Architecture & Security

All data is stored in **Supabase PostgreSQL** with Row-Level Security (RLS) enabled across every table:

* `candidate_evidence`: Document chunks, tags, metrics, and `vector(1536)` embeddings with HNSW indexing.
* `ai_runs`: Persistent execution records tracking workflow, prompt version, latency, input/output tokens, and USD cost.
* `ai_run_nodes`: Node-level execution trace and retry telemetry.
* `ai_tool_audit_logs`: Tool execution audit logs.
* `resumes` & `resume_versions`: Full structured resume snapshots with ATS audit scores.
* `profiles`: User account settings, plan tiers, and server-enforced daily rate limits.

### Security Principles:
- Identity is strictly derived from authenticated Supabase Auth JWTs.
- Client-provided `userId` or `plan_tier` are never trusted.
- Server API keys (`OPENROUTER_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are kept strictly on the server runtime.
- Adversarial prompt injection attacks are sanitized and treated as literal candidate string data.
* `profiles`: User account settings, plan tiers, and server-enforced daily rate limits.

### Security Principles:
- Identity is strictly derived from authenticated Supabase Auth JWTs.
- Client-provided `userId` or `plan_tier` are never trusted.
- Server API keys (`OPENROUTER_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are kept strictly on the server runtime.

---

## 🛠️ Tech Stack

- **Framework**: TanStack Start (React 19), TanStack Router, TanStack Query
- **Language**: TypeScript (Strict mode: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- **Database & Vectors**: Supabase (PostgreSQL 15+, pgvector HNSW)
- **AI Infrastructure**: OpenRouter API (`gpt-4o-mini`, `text-embedding-3-small`), Zod Structured Outputs, Custom StateGraph
- **Testing & Evals**: Vitest, Custom Retrieval & Grounding Evaluation Framework
- **Export Engines**: Deterministic ATS-First LaTeX Generator (`glyphtounicode`, `titlesec`, `hyperref`), HTML Print Stylesheet

---

## 🚀 Local Development Setup

### 1. Prerequisites
- Node.js 18+ / 20+
- npm or pnpm
- Supabase project credentials

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the project root:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# AI Provider Configuration (Server Runtime Only)
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MODEL=openai/gpt-4o-mini
```

### 4. Run Development Server
```bash
npm run dev
```

### 5. Run Verification & Tests
```bash
# Typecheck
npm run typecheck

# Unit Test Suite (36 passing tests)
npm test

# Benchmark Evaluations
npm run evals

# Production Build
npm run build
```

---

## 📄 License

MIT © [Sumit Raikwar](https://github.com/SumitRaikwar18)
