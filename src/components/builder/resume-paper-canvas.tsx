import React, { useRef, useState, useEffect } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Printer,
  FileCode,
  ZoomIn,
  ZoomOut,
  Copy,
  Check,
  Download,
  Eye,
  Sparkles,
  Layout,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { generateLatexResumeSource } from "@/lib/latex/latex-generator";
import { toast } from "sonner";
import type { ResumeDataState } from "@/routes/builder";

export type TemplateOptionId =
  | "modern-clean"
  | "tech-minimalist"
  | "executive-pro"
  | "ivy-classic"
  | "ai-researcher"
  | "modern"
  | "classic"
  | "minimal"
  | "technical";

interface ResumePaperCanvasProps {
  resumeData: ResumeDataState;
  template: string;
  onTemplateChange: (template: string) => void;
  atsScore?: number | undefined;
}

export const TEMPLATE_LIST = [
  { id: "modern-clean", label: "Modern Clean", badge: "ATS Standard" },
  { id: "tech-minimalist", label: "Tech Minimalist", badge: "High Density" },
  { id: "executive-pro", label: "Executive Pro", badge: "Leadership" },
  { id: "ivy-classic", label: "Ivy Classic", badge: "Academic Serif" },
  { id: "ai-researcher", label: "AI Researcher", badge: "ML / Systems" },
];

export function ResumePaperCanvas({
  resumeData,
  template,
  onTemplateChange,
  atsScore,
}: ResumePaperCanvasProps) {
  const paperRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(100);
  const [isOverflowing, setIsOverflowing] = useState<boolean>(false);
  const [copiedLatex, setCopiedLatex] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"canvas" | "latex">("canvas");

  // Normalize incoming template strings
  const activeTemplate =
    template === "modern" ? "modern-clean" :
    template === "classic" ? "ivy-classic" :
    template === "minimal" ? "tech-minimalist" :
    template === "technical" ? "ai-researcher" :
    template || "modern-clean";

  // Standard A4 page height in pixels at 96 DPI is ~1123px (minus margins ~ 960px content)
  const A4_HEIGHT_THRESHOLD_PX = 1050;

  useEffect(() => {
    if (paperRef.current) {
      const height = paperRef.current.scrollHeight;
      setIsOverflowing(height > A4_HEIGHT_THRESHOLD_PX);
    }
  }, [resumeData, activeTemplate]);

  const latexSource = React.useMemo(() => {
    return generateLatexResumeSource({
      ...resumeData,
      templateId: activeTemplate,
    } as any);
  }, [resumeData, activeTemplate]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLatex = () => {
    navigator.clipboard.writeText(latexSource);
    setCopiedLatex(true);
    toast.success("LaTeX code copied to clipboard!");
    setTimeout(() => setCopiedLatex(false), 2000);
  };

  const handleDownloadLatex = () => {
    const blob = new Blob([latexSource], { type: "text/x-tex;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(resumeData.personal.name || "resume").toLowerCase().replace(/\s+/g, "_")}_${activeTemplate}.tex`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Downloaded resume.tex file");
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card/80 p-2.5 backdrop-blur-sm shadow-xs print:hidden">
        {/* Template Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-xs font-semibold text-muted-foreground mr-1 hidden sm:inline flex items-center gap-1">
            <Layout className="size-3.5" /> Template:
          </span>
          {TEMPLATE_LIST.map((t) => {
            const isSelected = activeTemplate === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onTemplateChange(t.id);
                  toast.success(`Switched to ${t.label} layout`);
                }}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5",
                  isSelected
                    ? "bg-indigo-600 text-white font-bold shadow-xs scale-[1.02]"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <span>{t.label}</span>
                {isSelected && (
                  <span className="text-[9px] bg-white/20 px-1 py-0.2 rounded font-semibold">
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Action Controls & View Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center gap-1 bg-muted/40 rounded-lg p-0.5 border border-border/50 text-xs">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(70, z - 10))}
              className="p-1 text-muted-foreground hover:text-foreground rounded"
              title="Zoom out"
            >
              <ZoomOut className="size-3.5" />
            </button>
            <span className="px-1 text-[11px] font-mono text-muted-foreground">{zoom}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(130, z + 10))}
              className="p-1 text-muted-foreground hover:text-foreground rounded"
              title="Zoom in"
            >
              <ZoomIn className="size-3.5" />
            </button>
          </div>

          {/* Toggle View (Visual vs LaTeX) */}
          <div className="flex rounded-lg bg-muted/40 p-0.5 border border-border/50">
            <button
              type="button"
              onClick={() => setViewMode("canvas")}
              className={cn(
                "flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-all",
                viewMode === "canvas" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground"
              )}
            >
              <Eye className="size-3" /> Canvas
            </button>
            <button
              type="button"
              onClick={() => setViewMode("latex")}
              className={cn(
                "flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-all",
                viewMode === "latex" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground"
              )}
            >
              <FileCode className="size-3" /> LaTeX
            </button>
          </div>

          {/* Print / PDF Trigger */}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handlePrint}
            className="h-8 gap-1.5 text-xs font-semibold border-border"
          >
            <Printer className="size-3.5" /> Print / PDF
          </Button>
        </div>
      </div>

      {/* Page Length / ATS Guardrail Status Banner */}
      <div className="flex items-center justify-between gap-2 px-1 text-xs print:hidden">
        <div className="flex items-center gap-2">
          {isOverflowing ? (
            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium text-[11px] bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              <AlertTriangle className="size-3" /> Page 2 Overflow Warning (Trim ~2-3 bullets for 1-page ATS standard)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-[11px] bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="size-3" /> Perfect 1-Page ATS Standard Fit
            </span>
          )}
        </div>

        {atsScore ? (
          <span className="text-[11px] font-bold text-muted-foreground">
            ATS Score: <span className="text-primary">{atsScore}%</span>
          </span>
        ) : null}
      </div>

      {/* Visual Canvas OR LaTeX Code View */}
      {viewMode === "latex" ? (
        <div className="relative rounded-2xl border border-border bg-slate-950 p-4 font-mono text-xs text-slate-200 shadow-xl overflow-hidden min-h-[700px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <FileCode className="size-4 text-primary" />
              <span className="font-semibold text-slate-300">
                Deterministic LaTeX Source ({activeTemplate})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCopyLatex}
                className="h-7 text-xs bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 gap-1.5"
              >
                {copiedLatex ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                {copiedLatex ? "Copied" : "Copy Code"}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleDownloadLatex}
                className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 font-medium"
              >
                <Download className="size-3" /> Download .tex
              </Button>
            </div>
          </div>
          <pre className="overflow-x-auto p-2 text-[11px] leading-relaxed text-emerald-400/90 max-h-[750px] selection:bg-primary/30">
            {latexSource}
          </pre>
        </div>
      ) : (
        /* Paper Canvas Container with realistic shadow and zoom */
        <div className="w-full overflow-x-auto p-2 sm:p-4 rounded-2xl bg-muted/20 border border-border/40 flex justify-center items-start min-h-[920px]">
          <div
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top center",
              transition: "transform 0.15s ease-out",
            }}
            className="w-full max-w-[800px]"
          >
            {/* The Real Physical A4 Sheet */}
            <div
              ref={paperRef}
              id="resume-document"
              className={cn(
                "w-full bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 select-text transition-all",
                // 1. MODERN CLEAN
                activeTemplate === "modern-clean" && "p-8 sm:p-12 font-sans",
                // 2. TECH MINIMALIST (High density, tight margins, crisp typography)
                activeTemplate === "tech-minimalist" && "p-6 sm:p-8 font-sans text-xs tracking-tight",
                // 3. EXECUTIVE PRO (Rich formal serif, prominent header)
                activeTemplate === "executive-pro" && "p-8 sm:p-12 font-serif",
                // 4. IVY CLASSIC (Academic Computer Modern serif, centered header)
                activeTemplate === "ivy-classic" && "p-8 sm:p-12 font-serif",
                // 5. AI RESEARCHER (Tech-forward, highlighted taxonomy, code accents)
                activeTemplate === "ai-researcher" && "p-7 sm:p-10 font-sans"
              )}
              style={{ minHeight: "1050px" }}
            >
              {/* Header Section */}
              <div
                className={cn(
                  "pb-3.5",
                  activeTemplate === "modern-clean" && "border-b border-slate-300",
                  activeTemplate === "tech-minimalist" && "border-b-2 border-slate-900 pb-2 mb-2",
                  activeTemplate === "executive-pro" && "border-b-2 border-slate-900 text-center pb-4",
                  activeTemplate === "ivy-classic" && "border-b border-slate-400 text-center pb-3",
                  activeTemplate === "ai-researcher" && "border-b-2 border-indigo-600/60 pb-3"
                )}
              >
                <div
                  className={cn(
                    "flex flex-col",
                    (activeTemplate === "ivy-classic" || activeTemplate === "executive-pro")
                      ? "items-center justify-center text-center"
                      : "sm:flex-row sm:items-baseline sm:justify-between"
                  )}
                >
                  <h1
                    className={cn(
                      "text-slate-950",
                      activeTemplate === "modern-clean" && "text-2xl sm:text-3xl font-black tracking-tight",
                      activeTemplate === "tech-minimalist" && "text-xl sm:text-2xl font-black tracking-tighter uppercase font-mono",
                      activeTemplate === "executive-pro" && "text-2xl sm:text-3xl font-bold uppercase tracking-wider text-slate-950 font-serif",
                      activeTemplate === "ivy-classic" && "text-2xl sm:text-3xl font-normal uppercase tracking-widest text-slate-950 font-serif",
                      activeTemplate === "ai-researcher" && "text-2xl sm:text-3xl font-black tracking-tight text-indigo-950"
                    )}
                  >
                    {resumeData.personal.name || "Your Name"}
                  </h1>

                  {activeTemplate !== "ivy-classic" && activeTemplate !== "executive-pro" && (
                    <span className={cn(
                      "text-xs font-bold sm:text-sm",
                      activeTemplate === "ai-researcher" ? "text-indigo-600 font-mono" : "text-indigo-600"
                    )}>
                      {resumeData.personal.targetRole}
                    </span>
                  )}
                </div>

                {/* Subheader Title for Executive & Ivy */}
                {(activeTemplate === "executive-pro" || activeTemplate === "ivy-classic") && (
                  <p className="mt-0.5 text-xs font-semibold text-slate-700 tracking-wide">
                    {resumeData.personal.targetRole}
                  </p>
                )}

                {/* Subheader Contact Links */}
                <div
                  className={cn(
                    "mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-slate-600",
                    (activeTemplate === "ivy-classic" || activeTemplate === "executive-pro")
                      ? "justify-center"
                      : "justify-start",
                    activeTemplate === "tech-minimalist" && "font-mono text-[10px]"
                  )}
                >
                  {resumeData.personal.location && <span>{resumeData.personal.location}</span>}
                  {resumeData.personal.email && <span>• {resumeData.personal.email}</span>}
                  {resumeData.personal.phone && <span>• {resumeData.personal.phone}</span>}
                  {resumeData.personal.github && (
                    <span>• {resumeData.personal.github.replace(/^https?:\/\//, "")}</span>
                  )}
                  {resumeData.personal.linkedin && (
                    <span>• {resumeData.personal.linkedin.replace(/^https?:\/\//, "")}</span>
                  )}
                  {resumeData.personal.portfolio && (
                    <span>• {resumeData.personal.portfolio.replace(/^https?:\/\//, "")}</span>
                  )}
                </div>
              </div>

              {/* Professional Summary */}
              {resumeData.summary && (
                <div className={cn(
                  "mt-3.5",
                  activeTemplate === "executive-pro" && "rounded-lg bg-slate-50 border border-slate-200/80 p-3",
                  activeTemplate === "tech-minimalist" && "mt-2"
                )}>
                  <h2 className={cn(
                    "text-xs font-bold uppercase tracking-wider pb-0.5 mb-1.5",
                    activeTemplate === "executive-pro" ? "text-slate-900 border-b border-slate-300 font-serif" :
                    activeTemplate === "ivy-classic" ? "text-slate-950 border-b border-slate-300 font-serif text-center" :
                    activeTemplate === "tech-minimalist" ? "text-slate-950 border-b border-slate-900 font-mono text-[10px]" :
                    activeTemplate === "ai-researcher" ? "text-indigo-950 border-b border-indigo-200" :
                    "text-slate-950 border-b border-slate-200"
                  )}>
                    {activeTemplate === "executive-pro" ? "Executive Summary" : "Professional Summary"}
                  </h2>
                  <p className={cn(
                    "text-xs leading-relaxed text-slate-700",
                    activeTemplate === "executive-pro" && "font-serif text-slate-800 text-[11.5px]"
                  )}>
                    {resumeData.summary}
                  </p>
                </div>
              )}

              {/* Technical Skills Section (Rendered near top for Tech / AI templates) */}
              {(activeTemplate === "tech-minimalist" || activeTemplate === "ai-researcher") && (
                (resumeData.skills.languages.length > 0 ||
                  resumeData.skills.frameworks.length > 0 ||
                  resumeData.skills.tools.length > 0) && (
                  <div className="mt-3 space-y-1">
                    <h2 className={cn(
                      "text-xs font-bold uppercase tracking-wider pb-0.5",
                      activeTemplate === "tech-minimalist" ? "text-slate-950 border-b border-slate-900 font-mono text-[10px]" : "text-indigo-950 border-b border-indigo-200"
                    )}>
                      Technical Stack & Infrastructure
                    </h2>
                    <div className="text-xs text-slate-700 space-y-0.5">
                      {resumeData.skills.languages.length > 0 && (
                        <p>
                          <strong className="text-slate-900">Languages:</strong>{" "}
                          {resumeData.skills.languages.join(", ")}
                        </p>
                      )}
                      {resumeData.skills.frameworks.length > 0 && (
                        <p>
                          <strong className="text-slate-900">Frameworks:</strong>{" "}
                          {resumeData.skills.frameworks.join(", ")}
                        </p>
                      )}
                      {resumeData.skills.tools.length > 0 && (
                        <p>
                          <strong className="text-slate-900">Infrastructure & Tools:</strong>{" "}
                          {resumeData.skills.tools.join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                )
              )}

              {/* Experience Section */}
              {resumeData.experiences.length > 0 && (
                <div className={cn("mt-4 space-y-3", activeTemplate === "tech-minimalist" && "mt-2.5 space-y-2")}>
                  <h2 className={cn(
                    "text-xs font-bold uppercase tracking-wider pb-0.5",
                    activeTemplate === "executive-pro" ? "text-slate-900 border-b-2 border-slate-800 font-serif" :
                    activeTemplate === "ivy-classic" ? "text-slate-950 border-b border-slate-300 font-serif" :
                    activeTemplate === "tech-minimalist" ? "text-slate-950 border-b border-slate-900 font-mono text-[10px]" :
                    activeTemplate === "ai-researcher" ? "text-indigo-950 border-b border-indigo-200" :
                    "text-slate-950 border-b border-slate-200"
                  )}>
                    Work Experience
                  </h2>

                  {resumeData.experiences.map((exp) => (
                    <div key={exp.id} className="space-y-1">
                      <div className="flex items-baseline justify-between text-xs font-bold text-slate-950">
                        <span>
                          {exp.role} <span className="font-normal text-slate-600">— {exp.company}</span>
                          {exp.location && <span className="font-normal text-slate-500"> ({exp.location})</span>}
                        </span>
                        <span className={cn(
                          "text-[11px] font-normal text-slate-500 whitespace-nowrap",
                          activeTemplate === "tech-minimalist" && "font-mono text-[10px]"
                        )}>
                          {exp.startDate} – {exp.endDate}
                        </span>
                      </div>

                      <ul className="list-disc pl-4 space-y-0.5 text-xs text-slate-700 leading-snug">
                        {exp.bullets.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* Featured Projects */}
              {resumeData.projects.length > 0 && (
                <div className={cn("mt-4 space-y-2.5", activeTemplate === "tech-minimalist" && "mt-2.5 space-y-1.5")}>
                  <h2 className={cn(
                    "text-xs font-bold uppercase tracking-wider pb-0.5",
                    activeTemplate === "executive-pro" ? "text-slate-900 border-b-2 border-slate-800 font-serif" :
                    activeTemplate === "ivy-classic" ? "text-slate-950 border-b border-slate-300 font-serif" :
                    activeTemplate === "tech-minimalist" ? "text-slate-950 border-b border-slate-900 font-mono text-[10px]" :
                    activeTemplate === "ai-researcher" ? "text-indigo-950 border-b border-indigo-200" :
                    "text-slate-950 border-b border-slate-200"
                  )}>
                    {activeTemplate === "ai-researcher" ? "Key Systems & AI Implementations" : "Key Projects & Engineering"}
                  </h2>

                  {resumeData.projects.map((proj) => (
                    <div key={proj.id} className="space-y-0.5">
                      <div className="flex items-baseline justify-between text-xs font-bold text-slate-950">
                        <span>
                          {proj.name}{" "}
                          {proj.technologies && (
                            <span className={cn(
                              "font-normal text-slate-600",
                              activeTemplate === "tech-minimalist" && "font-mono text-[10px] text-slate-500"
                            )}>
                              | {proj.technologies}
                            </span>
                          )}
                        </span>
                        {proj.link && (
                          <span className="text-[10px] font-normal text-indigo-600">
                            {proj.link.replace(/^https?:\/\//, "")}
                          </span>
                        )}
                      </div>
                      {proj.bullets.length > 0 && (
                        <ul className="list-disc pl-4 text-xs text-slate-700 leading-snug space-y-0.5">
                          {proj.bullets.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Technical Skills Section (Rendered near bottom for Standard / Ivy / Executive) */}
              {activeTemplate !== "tech-minimalist" && activeTemplate !== "ai-researcher" && (
                (resumeData.skills.languages.length > 0 ||
                  resumeData.skills.frameworks.length > 0 ||
                  resumeData.skills.tools.length > 0) && (
                  <div className="mt-4 space-y-1">
                    <h2 className={cn(
                      "text-xs font-bold uppercase tracking-wider pb-0.5",
                      activeTemplate === "executive-pro" ? "text-slate-900 border-b-2 border-slate-800 font-serif" :
                      activeTemplate === "ivy-classic" ? "text-slate-950 border-b border-slate-300 font-serif" :
                      "text-slate-950 border-b border-slate-200"
                    )}>
                      Technical Skills & Competencies
                    </h2>
                    <div className="text-xs text-slate-700 space-y-0.5">
                      {resumeData.skills.languages.length > 0 && (
                        <p>
                          <strong className="text-slate-900">Languages:</strong>{" "}
                          {resumeData.skills.languages.join(", ")}
                        </p>
                      )}
                      {resumeData.skills.frameworks.length > 0 && (
                        <p>
                          <strong className="text-slate-900">Frameworks & Libraries:</strong>{" "}
                          {resumeData.skills.frameworks.join(", ")}
                        </p>
                      )}
                      {resumeData.skills.tools.length > 0 && (
                        <p>
                          <strong className="text-slate-900">Infrastructure, Databases & Tools:</strong>{" "}
                          {resumeData.skills.tools.join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                )
              )}

              {/* Empty Resume Guided Placeholder */}
              {!resumeData.summary &&
                resumeData.experiences.length === 0 &&
                resumeData.projects.length === 0 &&
                resumeData.skills.languages.length === 0 &&
                resumeData.skills.frameworks.length === 0 &&
                resumeData.skills.tools.length === 0 &&
                resumeData.education.length === 0 && (
                  <div className="my-10 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center">
                    <Sparkles className="mx-auto size-8 text-indigo-500 mb-2.5 opacity-80" />
                    <h3 className="text-sm font-bold text-slate-800">
                      Blank Resume Canvas ({TEMPLATE_LIST.find((t) => t.id === activeTemplate)?.label || "Modern Clean"})
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                      Use the <strong>AI Resume Copilot</strong> on the left or the <strong>Section Form Editor</strong> to add your work experience, projects, skills, and education.
                    </p>
                  </div>
                )}

              {/* Education Section */}
              {resumeData.education.length > 0 && (
                <div className={cn("mt-4 space-y-1.5", activeTemplate === "tech-minimalist" && "mt-2.5")}>
                  <h2 className={cn(
                    "text-xs font-bold uppercase tracking-wider pb-0.5",
                    activeTemplate === "executive-pro" ? "text-slate-900 border-b-2 border-slate-800 font-serif" :
                    activeTemplate === "ivy-classic" ? "text-slate-950 border-b border-slate-300 font-serif" :
                    activeTemplate === "tech-minimalist" ? "text-slate-950 border-b border-slate-900 font-mono text-[10px]" :
                    activeTemplate === "ai-researcher" ? "text-indigo-950 border-b border-indigo-200" :
                    "text-slate-950 border-b border-slate-200"
                  )}>
                    Education
                  </h2>

                  {resumeData.education.map((edu) => (
                    <div key={edu.id} className="flex items-baseline justify-between text-xs text-slate-800">
                      <div>
                        <strong className="text-slate-950">{edu.degree}</strong> • {edu.institution}
                        {edu.location && <span className="text-slate-500"> ({edu.location})</span>}
                      </div>
                      <span className={cn(
                        "text-[11px] text-slate-500",
                        activeTemplate === "tech-minimalist" && "font-mono text-[10px]"
                      )}>
                        {edu.score || `${edu.startDate} – ${edu.endDate}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
