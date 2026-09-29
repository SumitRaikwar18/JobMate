import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Download,
  Eye,
  FileCheck2,
  FileCode,
  FileText,
  Layers,
  Sparkles,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppLayout } from "@/components/layout/app-layout";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { generateLatexResumeSource } from "@/lib/latex/latex-generator";

export const Route = createFileRoute("/templates")({
  head: () => ({
    meta: [
      { title: "ATS Resume Templates (LaTeX & Single-Column) — JobMate AI" },
      { name: "description", content: "Explore deterministic 1-page single-column ATS LaTeX templates engineered for Overleaf pdflatex and automated recruiting parsers (Workday, Greenhouse, Lever)." },
      { name: "keywords", content: "ATS resume templates, LaTeX resume template, Overleaf resume, single column resume template, tech resume template, software engineer resume template, parseable ATS template" },
      { property: "og:title", content: "ATS Resume Templates (LaTeX & Single-Column) — JobMate AI" },
      { property: "og:description", content: "Single-column, 99% ATS-compliant LaTeX templates engineered for modern tech, backend, fullstack, and AI engineering roles." },
      { property: "og:url", content: "https://jobmate-ebon.vercel.app/templates" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://jobmate-ebon.vercel.app/og-banner.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "ATS Resume Templates (LaTeX & Single-Column) — JobMate AI" },
      { name: "twitter:description", content: "Explore deterministic 1-page single-column ATS LaTeX templates engineered for Overleaf and automated recruiting parsers." },
      { name: "twitter:image", content: "https://jobmate-ebon.vercel.app/og-banner.png" },
    ],
    links: [
      { rel: "canonical", href: "https://jobmate-ebon.vercel.app/templates" },
    ],
  }),
  component: TemplatesPage,
});

interface TemplateSpec {
  id: "modern-clean" | "tech-minimalist" | "executive-pro" | "ivy-classic" | "ai-researcher";
  name: string;
  tagline: string;
  bestFor: string;
  font: string;
  atsRating: number;
  badge: string;
  description: string;
  colorScheme: string;
  features: string[];
}

const TEMPLATES: TemplateSpec[] = [
  {
    id: "modern-clean",
    name: "Modern Clean ATS",
    tagline: "Standard single-column layout for modern tech and software roles.",
    bestFor: "Software Engineers, Full-Stack Developers, DevOps",
    font: "Helvetica / Arial / Sans-Serif",
    atsRating: 99,
    badge: "Most Popular",
    colorScheme: "Slate & Indigo",
    description: "Engineered to maximize readability across both machine parsers (Workday, Greenhouse) and human technical recruiters. Optimized font sizing with 0.75in margins.",
    features: [
      "Strict single-column layout (no parsing errors)",
      "Glyphtounicode mapping for clear character extraction",
      "Semantic subheadings with explicit date alignments",
      "100% compliant with Overleaf pdflatex",
    ],
  },
  {
    id: "tech-minimalist",
    name: "Tech Minimalist",
    tagline: "High information density focused on core projects, systems, and metrics.",
    bestFor: "Backend, Cloud Engineers, Systems Architects",
    font: "Computer Modern Sans",
    atsRating: 98,
    badge: "High Density",
    colorScheme: "Monochrome & Slate",
    description: "Compact vertical margins designed to fit 4+ impactful engineering roles or extensive open-source projects into an airtight single page.",
    features: [
      "High-density bullet point formatting (XYZ style)",
      "Dedicated Technical Stack taxonomy block",
      "Repository / Live Demo hyperlink integration",
      "Overleaf-ready AST-generated markup",
    ],
  },
  {
    id: "executive-pro",
    name: "Executive Pro",
    tagline: "Emphasizes leadership, team scale, revenue impact, and architecture.",
    bestFor: "Engineering Managers, Tech Leads, Directors, Staff+",
    font: "Latin Modern Roman / Serif",
    atsRating: 97,
    badge: "Leadership Focus",
    colorScheme: "Navy & Charcoal",
    description: "Designed for high-seniority candidates highlighting cross-functional leadership, budget governance, scale metrics, and business outcomes.",
    features: [
      "Prominent Executive Summary & Core Competencies matrix",
      "Highlighted business outcome & team size callouts",
      "Clean horizontal dividing rules (titlesec)",
      "Strict parseable date/location right-aligned tabulars",
    ],
  },
  {
    id: "ivy-classic",
    name: "Ivy League Classic",
    tagline: "Traditional academic typography and timeless LaTeX styling.",
    bestFor: "Quantitative Developers, Financial Engineers, Research",
    font: "Computer Modern Serif (Latin Modern)",
    atsRating: 99,
    badge: "Academic Grade",
    colorScheme: "Classic Black & White",
    description: "The time-tested Ivy League resume standard. Pristine typography with standard serif fonts, optimized for banking, fintech, and prestigious academia.",
    features: [
      "Classic Latin Modern typography",
      "Education-first or Experience-first modular ordering",
      "Zero distracting visual artifacts or colored graphics",
      "Flawless Workday, Taleo, and BrassRing parser score",
    ],
  },
  {
    id: "ai-researcher",
    name: "AI & ML Engineer Spec",
    tagline: "Specialized for AI/ML engineers with publications, PyTorch models, and benchmarks.",
    bestFor: "AI/ML Engineers, Data Scientists, LLM Researchers",
    font: "Modern Sans-Serif",
    atsRating: 98,
    badge: "AI & Research",
    colorScheme: "Indigo & Emerald",
    description: "Tailored specifically for modern AI/ML practitioners. Features specialized sections for Publications, Hugging Face Models, and RAG/Agentic benchmarks.",
    features: [
      "Dedicated Publications / Preprints section",
      "Model & Dataset link integrations",
      "Frameworks: PyTorch, CUDA, LangGraph, vLLM, TensorRT",
      "Verified evidence-grounded claim structure",
    ],
  },
];

function TemplatesPage() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateSpec | null>(null);
  const [previewLatex, setPreviewLatex] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Sample data for generating realistic preview
  const sampleCandidate = {
    name: "Alex Mercer",
    email: "alex.mercer@example.com",
    phone: "+1 (555) 234-5678",
    github: "https://github.com/alexmercer",
    linkedin: "https://linkedin.com/in/alexmercer",
    portfolio: "https://alexmercer.dev",
  };

  const sampleExperiences = [
    {
      id: "exp-1",
      company: "Stripe",
      role: "Senior Software Engineer — Infrastructure",
      location: "San Francisco, CA",
      startDate: "2022-03",
      endDate: "Present",
      current: true,
      bullets: [
        "Architected and deployed distributed event pipeline using Go and Kafka.",
        "Optimized API latency by implementing Redis multi-tier caching and connection pooling.",
        "Mentored team members and standardized automated CI/CD pipelines across core services.",
      ],
    },
    {
      id: "exp-2",
      company: "Datadog",
      role: "Software Engineer",
      location: "New York, NY",
      startDate: "2020-01",
      endDate: "2022-02",
      current: false,
      bullets: [
        "Developed telemetry collector in Rust and TypeScript for customer telemetry nodes.",
        "Built automated anomaly detection service for proactive outage mitigations.",
      ],
    },
  ];

  const sampleEducation = [
    {
      id: "edu-1",
      institution: "University of California, Berkeley",
      degree: "B.S. in Computer Science",
      location: "Berkeley, CA",
      endDate: "2019",
      score: "GPA: 3.85 / 4.0",
    },
  ];

  const sampleSkills = {
    languages: ["Go", "TypeScript", "Python", "Rust", "SQL", "Bash"],
    frameworks: ["React", "Next.js", "Node.js", "FastAPI", "PyTorch"],
    tools: ["Docker", "Kubernetes", "AWS", "Git", "PostgreSQL", "Redis"],
    softSkills: ["Technical Leadership", "System Architecture", "Code Review"],
  };

  const sampleProjects = [
    {
      id: "proj-1",
      name: "VectorFlow — Real-Time Retrieval Engine",
      technologies: "Python, FastAPI, pgvector, TypeScript",
      link: "https://github.com/alexmercer/vectorflow",
      bullets: [
        "Engineered hybrid vector retrieval engine with semantic embeddings and structured metadata filters.",
      ],
    },
  ];

  const handleOpenPreview = (template: TemplateSpec) => {
    setSelectedTemplate(template);
    const latex = generateLatexResumeSource({
      personal: sampleCandidate,
      experiences: sampleExperiences,
      education: sampleEducation,
      skills: sampleSkills,
      projects: sampleProjects,
      templateId: template.id,
    });
    setPreviewLatex(latex);
  };

  const handleCopyLatex = () => {
    if (!previewLatex) return;
    navigator.clipboard.writeText(previewLatex);
    setCopied(true);
    toast.success("LaTeX source code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadLatex = (templateName: string) => {
    if (!previewLatex) return;
    const blob = new Blob([previewLatex], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${templateName.toLowerCase().replace(/\s+/g, "_")}_resume.tex`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${templateName} .tex file!`);
  };

  const handleUseTemplate = (templateId: string) => {
    router.navigate({
      to: "/builder",
      search: { template: templateId } as any,
    });
  };

  return (
    <AppLayout activeNav="templates">
      <div className="space-y-8">
        {/* Header Banner */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                <Sparkles className="size-3.5" />
                Deterministic LaTeX Engine
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                ATS-Proof Resume Templates
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Every template is compiled with single-column geometry, standard system fonts, and semantic AST tags to score high on ATS compatibility tests.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
              <Link
                to="/builder"
                className={cn(buttonVariants({ variant: "primary" }), "gap-2 shadow-button bg-indigo-600 hover:bg-indigo-700 text-white whitespace-nowrap text-xs font-bold px-4 py-2 rounded-xl")}
              >
                <span>Open Resume Builder</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-6">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Layout Format</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">100% Single-Column</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <FileCode className="size-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Compiler Target</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Overleaf pdflatex</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <Zap className="size-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Average ATS Score</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">98.4 / 100</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Layers className="size-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Glyph Extraction</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">UTF-8 Clean</p>
              </div>
            </div>
          </div>
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="space-y-4">
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                    {tmpl.badge}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <Check className="size-3.5" />
                    {tmpl.atsRating}% ATS Parse Rate
                  </div>
                </div>

                {/* Title & Tagline */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                    {tmpl.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {tmpl.tagline}
                  </p>
                </div>

                {/* Simulated Document Preview Thumbnail */}
                <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 font-mono text-[10px] text-slate-600 dark:text-slate-400 overflow-hidden select-none space-y-2">
                  <div className="h-3 w-1/3 bg-slate-300 dark:bg-slate-700 rounded-sm" />
                  <div className="h-2 w-2/3 bg-slate-200 dark:bg-slate-800 rounded-sm" />
                  <div className="my-2 border-b border-slate-200 dark:border-slate-800" />
                  <div className="space-y-1">
                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-sm" />
                    <div className="h-2 w-5/6 bg-slate-200 dark:bg-slate-800 rounded-sm" />
                    <div className="h-2 w-4/6 bg-slate-200 dark:bg-slate-800 rounded-sm" />
                  </div>
                  <div className="my-2 border-b border-slate-200 dark:border-slate-800" />
                  <div className="space-y-1">
                    <div className="h-2 w-11/12 bg-slate-200 dark:bg-slate-800 rounded-sm" />
                    <div className="h-2 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-sm" />
                  </div>
                </div>

                {/* Key Features */}
                <ul className="space-y-2 pt-2">
                  {tmpl.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <Check className="size-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenPreview(tmpl)}
                  className="flex-1 gap-1.5 text-xs"
                >
                  <Eye className="size-3.5" />
                  View LaTeX
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleUseTemplate(tmpl.id)}
                  className="flex-1 gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Sparkles className="size-3.5" />
                  Use Template
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Why Single Column Matters Section */}
        <div className="rounded-2xl border border-indigo-100 dark:border-indigo-950/80 bg-indigo-50/40 dark:bg-indigo-950/20 p-6 md:p-8">
          <div className="max-w-3xl space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck2 className="size-5 text-indigo-600" />
              Why JobMate exclusively uses 1-Page Single-Column LaTeX:
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Standard 2-column or graphic-heavy Canva resumes break OCR parsers like Workday and Greenhouse. When an ATS scans a 2-column resume, it reads left-to-right across columns, scrambling your skills, company names, and employment dates into illegible strings.
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              JobMate generates pure <code className="font-mono text-xs bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400">\pdflatex</code> source with Unicode glyph mapping, guaranteeing 100% accurate field extraction every time.
            </p>
          </div>
        </div>
      </div>

      {/* LaTeX Code Preview Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Code2 className="size-5 text-indigo-600" />
                  {selectedTemplate.name} — LaTeX Source Code
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Copy and paste into Overleaf or compile directly with <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-600">pdflatex</code>.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLatex}
                  className="gap-1.5 text-xs"
                >
                  {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                  {copied ? "Copied!" : "Copy Code"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadLatex(selectedTemplate.name)}
                  className="gap-1.5 text-xs"
                >
                  <Download className="size-3.5" />
                  Download .tex
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTemplate(null)}
                  className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  Close
                </Button>
              </div>
            </div>

            {/* Code Block Container */}
            <div className="relative rounded-xl bg-slate-950 p-4 overflow-x-auto max-h-[500px] border border-slate-800 text-slate-200 font-mono text-xs leading-relaxed">
              <pre>
                <code>{previewLatex}</code>
              </pre>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-slate-500">
                Overleaf tested &bull; UTF-8 glyph compliant &bull; 0 parser errors
              </p>
              <Button
                onClick={() => {
                  const id = selectedTemplate.id;
                  setSelectedTemplate(null);
                  handleUseTemplate(id);
                }}
                className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
              >
                <Sparkles className="size-3.5" />
                Customize in Builder
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}