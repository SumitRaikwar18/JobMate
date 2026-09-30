# JobMate — Evidence-Grounded AI Career Intelligence Engine

<div align="center">
  <img src="public/favicon.svg" alt="JobMate Logo" width="64" height="64" />
  <p><strong>Turn your real engineering work into evidence-backed, ATS-optimized job applications.</strong></p>
</div>

---

## 🌟 Executive Overview

**JobMate** is an evidence-grounded AI career intelligence engine built to solve the core defect of modern AI resume generators: **unsubstantiated claims and hallucinated metrics**.

Rather than using generic LLM prompt wrappers that invent fake companies, metrics, or technologies, JobMate enforces **100% Evidence Grounding** through:
1. **pgvector PostgreSQL Vector Store & Hybrid Retrieval**: Combines dense embeddings (`text-embedding-3-small`), BM25 lexical search, and skill taxonomy boosting with live Supabase RLS isolation.
2. **Multi-Agent StateGraph Pipeline**: 6-node state graph orchestrating JD analysis, semantic retrieval, strategic planning, Google XYZ synthesis, adversarial guardrail verification, and heuristic ATS auditing with active reflection loops.
3. **Deterministic Claim Provenance**: Every generated accomplishment bullet links back to verified evidence IDs with exact repository, line number, or candidate record attribution.
4. **Real Multi-Language AST Code Intelligence**: Official TypeScript Compiler API and structural syntax-tree parsers for 6 core languages (TypeScript, JavaScript, Python, Java, Go, Rust) extracting functions, classes, React components, hooks, HTTP route handlers (Next.js, Express, FastAPI, Flask, Spring, Gin, Actix), database/ORM calls (Supabase, Postgres, Prisma, Drizzle, SQLAlchemy, SpringData, GORM, SQLx), and test suites (Vitest, Jest, Pytest, JUnit, GoTest, RustTest) with exact line/column ranges.
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
              │ Multi-Language AST (L4) │
              │ GitHub Commits & PR(L5) │
              │ CI/CD & Tests (L6)      │
              │ Manifest Dependencies(L3│
              │ Verified Experience (L1)│
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

## 💻 Real AST Code Intelligence (6 Languages)

JobMate performs structural syntax-tree code intelligence across 6 core enterprise languages:

| Language | AST Engine | Structural Symbols | Frameworks & APIs | Database / ORM | Test Frameworks |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TypeScript** | TypeScript Compiler API (`ts.createSourceFile`) | Functions, Classes, Interfaces, Types, React Components, Custom Hooks | Next.js, TanStack Start, Express, Hono, React | Supabase, Prisma, Drizzle, Postgres | Vitest, Jest |
| **JavaScript** | TypeScript JS Parser (`ts.ScriptKind.JS`) | Functions, Classes, Express Route Handlers, Arrow Functions | Express, Fastify, Hono | Supabase, Postgres, MongoDB | Vitest, Jest |
| **Python** | Structural Syntax Tokenizer & AST Walker | `def`, `async def`, `class`, Decorators | FastAPI, Flask, Django | SQLAlchemy, Postgres, Tortoise | Pytest, Unittest |
| **Java** | Structural Syntax Tree & Annotation Parser | Classes, Interfaces, Methods, Spring Annotations (`@RestController`, `@GetMapping`) | Spring Boot, Spring MVC | Spring Data JPA, Hibernate, JDBC | JUnit 5, Mockito |
| **Go** | Structural Syntax Tree & Receiver Parser | Structs, Interfaces, Receiver Methods, Capitalized Exports | Gin, net/http, Echo | GORM, database/sql, pgx | Go testing (`Test*`) |
| **Rust** | Structural Syntax Tree & Macro Parser | Structs, Enums, Traits, `impl` blocks, Async `fn` | Actix Web, Axum, Tokio | SQLx, Diesel | `#[test]`, `#[tokio::test]` |

---

## 📊 Evaluation Benchmark Results

JobMate includes an automated evaluation suite (`evals/run-evals.ts`) benchmarking retrieval quality, failure-case defenses, and grounding verification across an evaluation dataset (50 diverse job descriptions, 50 candidate evidence records, and 100+ adversarial cases):

| Metric | Measured Score | Evaluation Benchmark Target | Status |
| :--- | :--- | :--- | :--- |
| **Mean Recall@5** | **75.3%** | > 70.0% | ✅ Passed |
| **Mean Precision@5** | **48.0%** | > 45.0% | ✅ Passed |
| **Mean Reciprocal Rank (MRR)** | **0.957** | > 0.850 | ✅ Passed |
| **Unsupported Claim Rejection** | **100%** (20/20) | 100% | ✅ Passed |
| **Stale Evidence Detection** | **100%** (20/20) | 100% | ✅ Passed |
| **Prompt Injection Neutralized** | **100%** (20/20) | 100% | ✅ Passed |

---

## 🛡️ Database Architecture & Security

All data is stored in **Supabase PostgreSQL** with Row-Level Security (RLS) enabled across every table:

* `evidence_snapshots`: Repository snapshot metadata with commit SHAs and source hashes.
* `candidate_evidence`: Document chunks, AST structural symbols, tags, metrics, and `vector(768)` embeddings with HNSW indexing.
* `evidence_relationships`: Provenance links between code symbols, commits, and parent repositories.
* `evidence_conflicts`: Conflicting candidate claims and reconciliation audit logs.
* `job_requirements`: Normalized job posting requirements with atomic skill tags.
* `requirement_evidence_matches`: Deterministic grounding matches between candidate evidence and job criteria.
* `evidence_plans` & `evidence_tasks`: Actionable proof acquisition tasks for missing candidate skills.
* `ai_execution_traces`: Node-level execution telemetry, model metadata, latency, and USD token costs.

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

### 3. Run Verification & Tests
```bash
# Typecheck (0 errors)
npm run typecheck

# Full Unit Test Suite (73 passing tests across AST, StateGraph, RAG, Claim Gate)
npm test

# Benchmark Evaluations (50 JDs + 50 Evidence Items + 100 Adversarial Cases)
npm run evals

# Production Build
npm run build
```

---

## 📄 License

MIT © [Sumit Raikwar](https://github.com/SumitRaikwar18)
