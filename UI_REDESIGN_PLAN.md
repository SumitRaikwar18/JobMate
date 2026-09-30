# JobMate — UI/UX Redesign Plan & Implementation Roadmap

**Date**: 2026-10-01  
**Target Quality Bar**: High-trust, Developer-Tool Aesthetics (Linear/Vercel/Notion inspired, unique JobMate brand identity).

---

## 1. Brand Logo Resolution

### Problem
`src/components/brand/jobmate-logo.tsx` previously wrapped `jobmate-logo.png` inside an emblem square while rendering `"JobMate AI"` text next to it, duplicating the word "JobMate" awkwardly.

### Solution
Render the official `jobmate-logo.png` image directly as a sleek, crisp, scalable brand asset with clean aspect-ratio control and dark/light mode compatibility.

---

## 2. Redesign Modules & Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. BRAND LOGO (jobmate-logo.tsx)                                           │
│    Direct rendering of official jobmate-logo.png without duplicate text     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ 2. LANDING PAGE (src/components/landing/jobmate-landing.tsx)                │
│    - Hero: "Your skills are only as strong as the proof behind them."       │
│    - Problem: "What skills do you have?" vs "What evidence proves them?"    │
│    - 5-Step Workflow: Connect -> Understand -> Match -> Verify -> Build     │
│    - Evidence Graph Architecture Signature Visual                           │
│    - Real Product Feature Spotlights (Evidence Explorer, Gap Radar, LaTeX)  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ 3. GLOBAL APP LAYOUT (src/components/layout/app-layout.tsx)                 │
│    - High-density developer navbar with JobMate Logo                        │
│    - Clean navigation: Overview, Evidence, Jobs, Resume Builder, Settings   │
│    - Responsive mobile drawer with bottom sheet support                     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ 4. CANDIDATE DASHBOARD (src/routes/dashboard.tsx)                           │
│    - Hero: "Your career evidence"                                           │
│    - Module A: Live Evidence Health Status (Verified, Partial, Unverified)  │
│    - Module B: Recent AST Code Intelligence & Verified Commits              │
│    - Module C: Target Job Radar & Grounded Proof Matches                    │
│    - Module D: Actionable Evidence Gap Closing Roadmaps                     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ 5. EVIDENCE EXPLORER (src/routes/evidence.tsx)                              │
│    - 3-Pane Inspection: Multi-Signal Filter, Item List, Provenance Inspector│
│    - Exact Source Inspector: File, Line Range, AST Node, Commit, Confidence │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Implementation Steps

1. **Brand Logo Update** (`src/components/brand/jobmate-logo.tsx`):
   - Replace composite emblem with direct, beautiful rendering of `/jobmate-logo.png`.
2. **Landing Page Redesign** (`src/components/landing/jobmate-landing.tsx`):
   - Implement authentic evidence narrative, interactive comparison, and live graph preview.
3. **App Layout Polish** (`src/components/layout/app-layout.tsx`):
   - Align navbar, active routes, and quota monitor.
4. **Dashboard Redesign** (`src/routes/dashboard.tsx`):
   - Connect live evidence stats and actionable proof cards.
5. **Evidence Explorer Polish** (`src/routes/evidence.tsx`):
   - Provide interactive deep-inspector panel with code provenance.
6. **Validation & Verification**:
   - Run `npm run typecheck`, `npm test`, `npm run evals`, `npm run build`.
