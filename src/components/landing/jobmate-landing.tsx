import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronRight,
  Code2,
  Cpu,
  Database,
  ExternalLink,
  FileCode,
  FileText,
  FolderGit2,
  GitBranch,
  GitCommit,
  Layers,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  Network,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Terminal,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { JobMateLogo } from "@/components/brand/jobmate-logo";

const navItems = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Evidence Graph", href: "#evidence-graph" },
  { label: "Capabilities", href: "#capabilities" },
  { label: "Templates", to: "/templates" as const },
];

function Navbar() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between" aria-label="Main navigation">
        <Link to="/" className="inline-flex items-center" aria-label="JobMate home">
          <JobMateLogo size="md" />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            item.to ? (
              <Link
                key={item.label}
                to={item.to}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
              >
                {item.label}
              </a>
            )
          ))}
        </div>

        {/* Action Buttons */}
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <Link
              to="/dashboard"
              className={cn(
                buttonVariants({ variant: "primary" }),
                "gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-xs"
              )}
            >
              <LayoutDashboard className="size-3.5" />
              <span>Dashboard</span>
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 px-3 py-2 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/login"
                className={cn(
                  buttonVariants({ variant: "primary" }),
                  "gap-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs px-4 py-2 rounded-xl shadow-xs"
                )}
              >
                <span>Analyze Profile</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 focus:outline-none"
            aria-label="Toggle menu"
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {open && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 pt-2 pb-6 space-y-3">
          {navItems.map((item) => (
            item.to ? (
              <Link
                key={item.label}
                to={item.to}
                onClick={() => setOpen(false)}
                className="block py-2 text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block py-2 text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                {item.label}
              </a>
            )
          ))}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
            <Link
              to={user ? "/dashboard" : "/login"}
              onClick={() => setOpen(false)}
              className="w-full text-center py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold"
            >
              {user ? "Open Dashboard" : "Analyze My Profile"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export function JobMateLanding() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white">
      <Navbar />

      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-slate-200/60 dark:border-slate-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/80 dark:bg-indigo-950/40 px-3.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 shadow-2xs">
              <ShieldCheck className="size-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>EVIDENCE-GROUNDED CAREER INTELLIGENCE</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
              Your skills are only as strong as the <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 bg-clip-text text-transparent">proof behind them.</span>
            </h1>

            {/* Supporting Subtext */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto font-normal">
              JobMate connects directly to your GitHub repositories, AST syntax trees, commits, CI test suites, and project artifacts — mapping verified engineering proof to target job requirements without hallucinating fake claims.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                to={user ? "/dashboard" : "/login"}
                className={cn(
                  buttonVariants({ variant: "primary" }),
                  "w-full sm:w-auto gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02]"
                )}
              >
                <span>Analyze My Profile</span>
                <ArrowRight className="size-4" />
              </Link>
              <a
                href="#how-it-works"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "w-full sm:w-auto text-sm font-semibold text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-3.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors"
                )}
              >
                See How It Works
              </a>
            </div>

            {/* Micro proof badges */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Check className="size-3.5 text-emerald-600" />
                6-Language AST Code Intelligence
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="size-3.5 text-emerald-600" />
                Deterministic Single-Column LaTeX
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="size-3.5 text-emerald-600" />
                100% Truth-Grounded Claim Verification
              </span>
            </div>
          </div>

          {/* Hero Visual: Interactive Evidence Graph Preview */}
          <div className="mt-14 max-w-5xl mx-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
            <div className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-rose-400/80" />
                <div className="size-3 rounded-full bg-amber-400/80" />
                <div className="size-3 rounded-full bg-emerald-400/80" />
                <span className="ml-2 font-mono text-xs text-slate-500 dark:text-slate-400">jobmate://evidence-graph/inspect</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200/60">
                  <ShieldCheck className="size-3" /> VERIFIED PROVENANCE
                </span>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              {/* Node 1: Code Artifact */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">01. Source Code AST</span>
                  <span className="font-mono text-[10px] text-indigo-600 bg-indigo-50 dark:bg-indigo-950/80 px-1.5 py-0.5 rounded">L4_SOURCE</span>
                </div>
                <div className="font-mono text-xs text-slate-800 dark:text-slate-200 space-y-1 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
                  <p className="text-slate-400 text-[10px]">// src/api/users.ts:L14-L38</p>
                  <p><span className="text-indigo-600 dark:text-indigo-400 font-bold">export async function</span> createUser(req) &#123;</p>
                  <p className="pl-3 text-slate-500">supabase.from("users").insert(..)</p>
                  <p>&#125;</p>
                </div>
                <p className="text-xs text-slate-500">AST identified exported HTTP handler & Supabase client integration.</p>
              </div>

              {/* Node 2: Evidence Graph Node */}
              <div className="rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/20 dark:bg-indigo-950/20 p-4 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">02. Evidence Node</span>
                  <span className="font-mono text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded">95% Conf</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <p className="font-bold text-slate-900 dark:text-white">API Engineering & Database</p>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                    Repository <code className="text-indigo-600 font-mono">JobMate/CoreService</code> with verified author commit history.
                  </p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    <span className="text-[10px] font-mono bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">TypeScript</span>
                    <span className="text-[10px] font-mono bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">Supabase</span>
                    <span className="text-[10px] font-mono bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">REST API</span>
                  </div>
                </div>
              </div>

              {/* Node 3: Grounded Application Claim */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">03. Grounded Application</span>
                  <span className="font-mono text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded">ATS 100%</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800 space-y-1">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">
                    • Engineered high-throughput REST API handlers with Supabase PostgreSQL integration.
                  </p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ Proven by AST file range src/api/users.ts
                  </p>
                </div>
                <p className="text-xs text-slate-500">Emitted directly to ATS-proof Overleaf pdflatex source.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE PROBLEM SECTION: Traditional Resumes vs JobMate */}
      <section className="py-20 bg-white dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Why Traditional Career & AI Tools Fail
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-base">
              Most resume tools ask: <strong className="text-slate-900 dark:text-white">"What skills do you have?"</strong><br className="hidden sm:inline" />
              JobMate asks: <strong className="text-indigo-600 dark:text-indigo-400">"What evidence proves you have them?"</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Traditional Resume Approach */}
            <div className="rounded-2xl border border-rose-200 dark:border-rose-950 bg-rose-50/20 dark:bg-rose-950/10 p-6 space-y-4">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                <ShieldAlert className="size-4" />
                <span>Traditional Resumes & Generic AI</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Keyword Stuffing & Fabricated Claims</h3>
              <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300 font-medium">
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span><strong>Unsubstantiated Lists:</strong> Listing "React, Python, PostgreSQL" without verifiable proof.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span><strong>Hallucinated Metrics:</strong> AI prompt wrappers inventing fake percentages and revenue impact.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span><strong>ATS Table Parsing Failures:</strong> Multi-column graphics truncated by enterprise recruiters.</span>
                </li>
              </ul>
            </div>

            {/* JobMate Evidence Approach */}
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/20 dark:bg-emerald-950/10 p-6 space-y-4">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <ShieldCheck className="size-4" />
                <span>JobMate Evidence Intelligence</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Multi-Signal Code Proof & Attribution</h3>
              <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300 font-medium">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span><strong>Real AST Verification:</strong> Every skill maps to source files, exported functions, and schemas.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span><strong>Adversarial Claim Gate:</strong> Blocks unverified metrics and flags stale candidate records.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span><strong>Deterministic pdflatex Source:</strong> 100% ATS-compliant single-column LaTeX compilation.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 5-STEP WORKFLOW: How It Works */}
      <section id="how-it-works" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Engineering Workflow</span>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            How Evidence Intelligence Works
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            A deterministic pipeline turning your real engineering history into verifiable job applications.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            {
              step: "01",
              title: "Connect",
              desc: "Link GitHub repositories and career artifacts to snapshot your work.",
              icon: FolderGit2,
            },
            {
              step: "02",
              title: "Understand",
              desc: "Multi-language AST inspects syntax trees, routes, DB calls, and tests.",
              icon: Code2,
            },
            {
              step: "03",
              title: "Match",
              desc: "Target JDs are decomposed into atomic hard/soft skill requirement graphs.",
              icon: Target,
            },
            {
              step: "04",
              title: "Verify",
              desc: "Evidence classified as Supported, Partial, Conflicted, or Stale.",
              icon: ShieldCheck,
            },
            {
              step: "05",
              title: "Build",
              desc: "Identifies proof gaps and generates single-column LaTeX resumes.",
              icon: FileCode,
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3 hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-md">
                  {item.step}
                </span>
                <item.icon className="size-4 text-slate-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. SIGNATURE EVIDENCE GRAPH SECTION */}
      <section id="evidence-graph" className="py-20 bg-slate-900 text-white border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">Truth-Grounded Graph</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Trace any accomplishment back to an exact AST node and commit.
              </h2>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                JobMate never simply generates claims out of thin air. When an application states you built a payment workflow or designed a vector search pipeline, it retains complete provenance:
              </p>
              <div className="space-y-3 font-mono text-xs text-slate-300 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                <p className="text-indigo-400 font-bold">Candidate</p>
                <p className="pl-3">└── Repository <span className="text-slate-500">(JobMate/CoreService)</span></p>
                <p className="pl-6">└── File <span className="text-slate-500">(src/api/users.ts)</span></p>
                <p className="pl-9">└── AST Symbol <span className="text-slate-500">(createUser: L14-L38)</span></p>
                <p className="pl-12 text-emerald-400">└── Evidence Item (L4_SOURCE_CODE)</p>
                <p className="pl-15 text-indigo-300">└── Grounded Job Requirement Match</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-300">Supported AST Parsers</span>
                <span className="text-[11px] font-mono text-emerald-400">73/73 Tests Passing</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                {[
                  { lang: "TypeScript / TSX", parser: "TS Compiler API", fact: "Classes, Hooks, Routes" },
                  { lang: "JavaScript / JSX", parser: "V8 AST Engine", fact: "Express, Fastify API" },
                  { lang: "Python", parser: "Tokenizer & AST", fact: "FastAPI, SQLAlchemy" },
                  { lang: "Java", parser: "Spring AST Parser", fact: "REST Controllers, JPA" },
                  { lang: "Go", parser: "Go Receiver Parser", fact: "Gin Routes, database/sql" },
                  { lang: "Rust", parser: "Syntax Tree Parser", fact: "Actix, Axum, SQLx" },
                ].map((item) => (
                  <div key={item.lang} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <p className="font-bold text-slate-200">{item.lang}</p>
                    <p className="text-[10px] text-indigo-400 font-mono">{item.parser}</p>
                    <p className="text-[10px] text-slate-500">{item.fact}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PRODUCT CAPABILITIES SECTION */}
      <section id="capabilities" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Core Capabilities</span>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Developer-First Career Intelligence
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-3">
            <FolderGit2 className="size-6 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Evidence Explorer</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Explore every independent signal mined from your work: dependency manifests, AST exported handlers, commit histories, and CI pipelines.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-3">
            <Target className="size-6 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Skill Gap vs Evidence Gap</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Know the difference between capabilities you lack versus skills you possess but haven't proven yet — with concrete artifact roadmaps to close gaps.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-3">
            <FileCode className="size-6 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Single-Column LaTeX Engine</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Compiles deterministic Overleaf pdflatex-compatible `.tex` source code adhering to strict single-column ATS typography and glyph standards.
            </p>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION FOOTER BANNER */}
      <section className="py-16 bg-slate-900 text-white border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Know what you can prove. Build what you can't.
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Connect your engineering profile to extract multi-signal evidence and generate ATS-grounded job applications today.
          </p>
          <div className="pt-2">
            <Link
              to={user ? "/dashboard" : "/login"}
              className={cn(
                buttonVariants({ variant: "primary" }),
                "gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-8 py-3.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
              )}
            >
              <span>Analyze My Profile</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <JobMateLogo size="sm" />
          <p className="text-xs text-slate-500">
            Real Skills. Real Evidence. Real Opportunities. © {new Date().getFullYear()} JobMate AI.
          </p>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
            <a href="https://github.com/SumitRaikwar18/JobMate" target="_blank" rel="noreferrer" className="hover:text-slate-900 dark:hover:text-white">
              GitHub
            </a>
            <Link to="/templates" className="hover:text-slate-900 dark:hover:text-white">
              Templates
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}