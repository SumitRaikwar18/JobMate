---
name: jd-resume-ats-tailor
description: Turn an existing resume into a truthful, job-specific, ATS-friendly resume using evidence-grounded tailoring, deterministic LaTeX generation, and honest heuristic scoring.
---

# JD Resume ATS Tailor

Turn an existing resume into a truthful, job-specific, ATS-friendly resume.

The goal is not to stuff keywords or fabricate experience. The goal is to:
1. Understand what the job actually rewards.
2. Understand what the candidate has actually done.
3. Map real candidate evidence to the job's language.
4. Remove weak or irrelevant material.
5. Surface measurable proof.
6. Produce a clean, parseable resume that a recruiter can understand quickly.

## Core Philosophy
A strong ATS resume is not a keyword dump:
`job requirement → candidate evidence → clear bullet → measurable proof`

Do not assume that using a keyword increases qualification. The resume must remain 100% defensible in a technical interview.

## Hard Rules
1. **Never fabricate**: Never invent employers, internships, years of experience, production metrics, latency numbers, accuracy claims, cost reductions, AWS/cloud services, or vector databases.
2. **Treat ATS score as a heuristic**: Score out of 100 based on:
   - Core skills match: 30
   - Relevant project/experience evidence: 30
   - Domain alignment: 15
   - Reliability/production evidence: 15
   - Clarity and ATS parsing: 10
3. **Preserve truth over keyword coverage**: If the candidate only knows concepts, place them under "Concepts" or "Familiarity", never primary experience.
4. **Prefer evidence over adjectives**: Avoid "Strong problem solver", use concrete mechanisms and verified tests.
5. **Do not force metrics (Y) when they do not exist**: Use "Built X using Z, resulting in Y" or "Built X with Y reliability mechanism".

## 10-Step Workflow
- **Step 1 — Read the resume completely**: Build candidate evidence map.
- **Step 2 — Parse the JD**: Split into Must-Haves, Preferences, Reliability/Production expectations, and Domain needs.
- **Step 3 — Score the current resume**: Return heuristic match score, strong matches, gaps, safe-to-add keywords, and unsupported keywords.
- **Step 4 — Select the best evidence**: Rank projects by relevance, technical depth, and reliability proof.
- **Step 5 — Rewrite headline & summary**: Grounded 3-4 line summary.
- **Step 6 — Rewrite bullets**: Focus on what was built, how, and why it was verified.
- **Step 7 — Optimize skills for ATS**: Clear categories (AI/GenAI, Backend, Data, Frontend, Reliability).
- **Step 8 — Pressure-test ATS parsing**: Single column, standard section titles, machine-readable contacts.
- **Step 9 — Verify keyword coverage**: Classify keywords (Covered directly, Equivalent, Not supported / omitted).
- **Step 10 — Produce final artifacts**: Compile clean `.tex` and `.pdf` artifacts.
