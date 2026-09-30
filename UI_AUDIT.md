# JobMate — UI/UX Forensic Audit & Architectural Assessment

**Date**: 2026-10-01  
**Auditor**: Senior Product Designer & Frontend Architect  
**Scope**: Full application inspection across Landing Page, Dashboard, Evidence Explorer, Jobs Radar, Resume Builder, Navigation, and Design System.

---

## 1. Executive Summary & Brand Positioning

### Core Product Positioning
JobMate is an **Evidence-Grounded Career Intelligence System** that solves the fundamental defect of generic AI resume generators: **unsubstantiated claims and hallucinated metrics**.

$$\text{Candidate Artifacts (GitHub/AST/Work)} \longrightarrow \text{Evidence Graph} \longleftrightarrow \text{Job Requirements} \longrightarrow \text{Deterministic Verification} \longrightarrow \text{Grounded Applications}$$

### The Primary UI Problem
Prior UI screens frequently mixed authentic evidence features with generic SaaS copy ("AI Resume Builder", "AI Copilot", emoji badges, duplicated logo text). The brand image (`public/jobmate-logo.png`) was previously wrapped with redundant text next to it.

---

## 2. Screen-by-Screen Audit

### A. Landing Page (`/` → `src/components/landing/jobmate-landing.tsx`)
* **Purpose**: Primary conversion and product explanation for engineers and tech professionals.
* **Current Components**: Hero, Features carousel, Stats bar, Testimonials, FAQ, Footer.
* **UX/Visual Issues**:
  * Brand Logo: Rendered tiny badge with duplicated "JobMate AI" text next to the image.
  * Positioning: Hero copy previously led with generic "Autonomous Multi-Agent ATS Resume Engineering".
  * Narrative: Missing the crisp "Traditional Resume (What skills do you have?) vs JobMate (What proof do you have?)" visual comparison.
  * Evidence Graph: Did not feature the signature visual mapping from GitHub repository $\rightarrow$ AST source file $\rightarrow$ Code symbol $\rightarrow$ Job requirement.
* **Recommended Changes**:
  * Redesign Hero around: *"Your skills are only as strong as the proof behind them."*
  * Feature authentic Evidence Graph and Multi-Signal hierarchy (L1-L6).
  * 5-step engineering workflow: Connect $\rightarrow$ Understand $\rightarrow$ Match $\rightarrow$ Verify $\rightarrow$ Build.
  * Pure, crisp developer-tool aesthetic (Linear/Vercel calm dark/light mode, clear typography, restrained borders).

---

### B. App Layout & Global Navigation (`src/components/layout/app-layout.tsx`)
* **Purpose**: Primary desktop/mobile shell housing top navbar, sidebar, notifications, quota status, and user profile dropdown.
* **Current Navigation**: Dashboard, Builder, Templates, Jobs, Evidence, Applications, Assistant, Settings.
* **UX/Visual Issues**:
  * Navbar brand logo had an emblem box + redundant text.
  * Navigation items were disorganized with overlapping concerns ("Builder" vs "Templates" vs "Assistant").
* **Recommended Changes**:
  * Render `jobmate-logo.png` directly as the brand asset.
  * Reorganize navigation hierarchy into clean, logical pillars:
    * **Overview** (`/dashboard`)
    * **Evidence Explorer** (`/evidence`)
    * **Jobs & Requirements** (`/jobs`)
    * **Resume Builder** (`/builder`)
    * **Applications** (`/applications`)
    * **Settings** (`/settings`)
  * Ensure crisp mobile drawer with bottom-sheet behavior for evidence details.

---

### C. Dashboard (`/dashboard` → `src/routes/dashboard.tsx`)
* **Purpose**: Central candidate command center answering: *"What do I know about myself, what can I prove, and what should I do next?"*
* **Current Data Sources**: `public.resumes`, `public.jobs`, `public.candidate_evidence`.
* **UX/Visual Issues**:
  * Hero led with generic greeting rather than evidence health status.
  * Lacked direct aggregation of evidence verification tiers (Strong, Partial, Unverified, Stale, Conflicts).
  * Action cards were generic rather than proof-oriented.
* **Recommended Changes**:
  * Hero: *"Your career evidence"* with live evidence count and verification coverage.
  * Real Evidence Health panel with live DB counts.
  * Recent verified engineering artifacts showing exact file, line range, and commit SHA.
  * Quick gap closing recommendations (e.g., missing Docker evidence $\rightarrow$ add Dockerfile + CI test).

---

### D. Evidence Explorer (`/evidence` → `src/routes/evidence.tsx`)
* **Purpose**: Interactive inspection of mined AST symbols, manifest dependencies, commits, and CI test pipelines.
* **Current Data Sources**: `EvidenceService.getCandidateEvidence` (`public.candidate_evidence`).
* **UX/Visual Issues**:
  * Card grid lacked a detailed side-by-side inspection drawer for deep code range inspection.
  * Level filtering was coarse.
* **Recommended Changes**:
  * 3-pane / responsive split layout: Filters on left/top, Evidence list in center, Deep Inspector on right.
  * Inspector shows: Capability Title, Why it matters, Code snippet range (`file.ts:L12-L34`), AST symbol, Commit SHA, Technology tags, Confidence score.

---

### E. Jobs & Requirement Radar (`/jobs` → `src/routes/jobs.tsx`)
* **Purpose**: Deconstruct job descriptions into atomic requirements and match them against ground-truth candidate evidence.
* **Current Data Sources**: `analyzeJobDescriptionWithAI`, `public.jobs`, `public.job_requirements`.
* **UX/Visual Issues**:
  * Focused heavily on raw text pasting rather than requirement evidence coverage breakdown.
* **Recommended Changes**:
  * Clear distinction between **Skill Gap** (capability missing) vs **Evidence Gap** (unverified assertion).
  * Real atomic requirement breakdown: Supported $\rightarrow$ Partial $\rightarrow$ Unverified $\rightarrow$ Absent.

---

## 3. Design System & Visual Standard

* **Background**: Clean white / dark navy palette with subtle borders (`border-slate-200/80` / `border-slate-800/80`).
* **Typography**: Crisp `DM Sans` with monospaced accents for files, line numbers, and commit hashes.
* **Semantic Verification Colors**:
  * `Verified / Supported`: Emerald (`#10b981`)
  * `Partial`: Amber (`#f59e0b`)
  * `Conflict / Error`: Rose (`#f43f5e`)
  * `Stale / Unverified`: Muted Slate (`#64748b`)
  * `AST / Code Signal`: Indigo (`#6366f1`)
