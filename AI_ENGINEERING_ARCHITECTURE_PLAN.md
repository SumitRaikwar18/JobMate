# 🏗️ JobMate Production-Grade AI Engineering Architecture Plan

This architecture transitions JobMate from simple API calls to a **LangGraph-style StateGraph Multi-Agent DAG**, **Evidence-Grounded Hybrid RAG Pipeline**, and **Deterministic LaTeX AST Compiler**.

---

## 📐 1. Master System Architecture

```mermaid
graph TD
    User([Candidate / Job Posting]) --> Gateway[Agent Gateway & Input Sanitizer]
    
    subgraph LangGraph_Agentic_DAG [LangGraph StateGraph Engine]
        Gateway --> Node1[Node 1: JD Semantic Decomposer]
        Node1 --> Node2[Node 2: Evidence Retriever & RAG Matcher]
        Node2 --> Node3[Node 3: Strategic Resume Planner]
        Node3 --> Node4[Node 4: XYZ Achievement Synthesizer]
        Node4 --> Node5[Node 5: Anti-Hallucination Critic Guardrail]
        
        %% Reflection Loop
        Node5 -- "Unverified Claim Detected (Reflection Loop)" --> Node4
        Node5 -- "0% Hallucination Passed" --> Node6[Node 6: ATS Parser & AST Auditor]
    end
    
    subgraph Evidence_RAG_Store [Candidate Evidence Ground-Truth]
        DB[(Supabase PostgreSQL + pgvector)]
        DB --> Node2
        DB -. Ground-Truth Check .-> Node5
    end
    
    subgraph Deterministic_Compiler [Deterministic Document Engine]
        Node6 --> AST[Structured Resume JSON AST]
        AST --> LaTeX[ATS Single-Column LaTeX Engine (.tex)]
        AST --> HTML[Live Interactive Web Canvas]
        LaTeX --> PDF[Compiled PDF Document]
    end
```

---

## 🧠 2. LangGraph-Style StateGraph Specification

The core execution engine is modeled as a stateful graph where each node updates a strongly typed **State Channel** with immutability and checkpoints:

### 📋 State Schema (`AgentStateChannels`)
```typescript
export interface ResumeAgentState {
  // Candidate Context
  candidateId: string;
  candidateProfile: CandidateProfile;
  evidenceBank: CandidateEvidenceBank;
  
  // Job Posting Context
  rawJdText: string;
  targetCompany?: string;
  jobAnalysis?: JobAnalysisResult;
  
  // RAG & Planning Channel
  retrievedEvidence: RetrievedEvidenceItem[];
  resumePlan?: ResumePlan;
  
  // Synthesis & Draft Channel
  currentDraft?: GeneratedResumeContent;
  
  // Reflection & Verification Channel
  reflectionCount: number;
  maxReflections: number;
  guardrailReport?: GuardrailValidationReport;
  criticFeedback?: string;
  
  // Final Evaluation
  atsAudit?: AtsSimulationAudit;
  executionTrace: AgentExecutionStep[];
  status: "idle" | "running" | "reflecting" | "completed" | "failed";
}
```

---

## 🤖 3. The 6-Agent Execution Pipeline

| Node / Agent | Role | Tools & Capabilities | Input / Output |
| :--- | :--- | :--- | :--- |
| **Node 1: `JD_Decomposer`** | Semantic requirement decomposition | Extracts technical hard skills, soft skills, seniority indicators, and core challenges into a normalized taxonomy. | `rawJdText` → `JobAnalysisResult` |
| **Node 2: `Evidence_RAG`** | Hybrid candidate retrieval | Queries candidate evidence bank (projects, verified claims, metrics) against extracted JD taxonomy. | `jobAnalysis` + `evidenceBank` → `retrievedEvidence` |
| **Node 3: `Resume_Planner`** | Section hierarchy & strategy | Determines section ordering, template recommendation, and keyword placement allocation map. | `retrievedEvidence` → `ResumePlan` |
| **Node 4: `XYZ_Synthesizer`** | Grounded bullet drafting | Formulates achievements using Google XYZ formula (*Accomplished [X] as measured by [Y], by doing [Z]*) strictly using retrieved evidence. | `ResumePlan` + `criticFeedback` → `currentDraft` |
| **Node 5: `Critic_Guardrail`** | Anti-hallucination referee | Compares draft line-by-line against ground-truth evidence. If unverified metrics, tools, or claims exist, triggers **Conditional Edge (Reflection)** back to Node 4 with precise instructions. | `currentDraft` → `guardrailReport` (Pass/Fail) |
| **Node 6: `ATS_Auditor`** | Deterministic ATS simulation | Evaluates single-column AST readability, keyword density, and 5-category heuristic scoring (0–100). | `currentDraft` → `AtsSimulationAudit` |

---

## 🛡️ 4. Anti-Hallucination & Conditional Reflection Routing

```typescript
// Conditional Edge Router
function shouldReflectOrCompile(state: ResumeAgentState): "synthesize_node" | "ats_audit_node" {
  const { guardrailReport, reflectionCount, maxReflections } = state;
  
  // If unverified claims detected and within retry budget -> Trigger Reflection
  if (!guardrailReport.isPassed && reflectionCount < maxReflections) {
    return "synthesize_node";
  }
  
  // Verification passed -> Proceed to ATS Simulation & Compilation
  return "ats_audit_node";
}
```

---

## 🗄️ 5. Dedicated Modular UI Routes with `AppLayout`

To deliver a cohesive, unified workspace, all pages share a single layout shell (`src/components/layout/app-layout.tsx`):

```
src/
├── components/
│   └── layout/
│       └── app-layout.tsx      # Sidebar + Header with Search, Notifications & User Menu
├── lib/
│   ├── ai/
│   │   ├── state-graph.ts      # LangGraph-style state machine orchestrator
│   │   ├── rag-retriever.ts    # Hybrid evidence retrieval & ranking
│   │   ├── agents/             # 6 Specialized Agent nodes
│   │   └── openrouter.ts       # LLM transport with JSON schema validation
│   └── latex/
│       └── latex-generator.ts  # Deterministic LaTeX ATS Compiler
└── routes/
    ├── dashboard.tsx           # 🏠 Overview, metrics, recent activity & quick triggers
    ├── builder.tsx             # 📝 Live Multi-Agent Resume Studio
    ├── templates.tsx           # 📑 Interactive ATS & LaTeX Template Showcase
    ├── jobs.tsx                # 📋 Dedicated Semantic JD Analyzer & Matcher
    ├── applications.tsx        # 🚀 Job Application Kanban / List Tracker
    ├── assistant.tsx           # 🤖 Full-Screen Career Copilot & Interview Prep
    └── settings.tsx            # ⚙️ Candidate Ground-Truth Evidence & Account Sync
```

---

## 🚀 6. Step-by-Step Implementation Roadmap & Status

1. **Step 1: LangGraph-Style State Engine (`src/lib/ai/`)** — ✅ **COMPLETED**
   - Implemented `state-graph.ts` with typed channels, node dispatchers, and conditional reflection loops.
   - Implemented `rag-retriever.ts` for hybrid keyword and evidence ranking.
   - Implemented 5 specialized agent nodes in `src/lib/ai/agents/`.
2. **Step 2: Unified `AppLayout` Component (`src/components/layout/app-layout.tsx`)** — ✅ **COMPLETED**
   - Shared responsive sidebar, top search bar with `Ctrl + K`, live notification popover, and user dropdown with Sign Out.
3. **Step 3: Dedicated Page Routes** — ✅ **COMPLETED**
   - Upgraded `/dashboard` with dynamic (non-mock) ATS scoring, real Supabase resumes, and mini-copilot.
   - Implemented `/templates` with 5 ATS templates, live `.tex` inspection, Overleaf download, and builder launch.
   - Implemented `/jobs` with real AI job description decomposition, skill gap matrix, and direct tailoring.
   - Implemented `/applications` with full pipeline tracker (*Saved → Applied → Interviewing → Offer → Rejected*) synced to Supabase.
   - Implemented `/assistant` with full-screen Copilot chat, Google XYZ bullet transformer, and technical interview simulator.
   - Implemented `/settings` with candidate ground-truth profile editor and Telegram bot pairing token linker.
4. **Step 4: End-to-End Validation & Build Verification** — ✅ **COMPLETED**
   - Multi-agent state machine and reflection loops tested.
   - Production bundle compiled with `npm run build` with **0 errors** across client, SSR, and Nitro server.

