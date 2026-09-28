import React, { useRef, useState, useEffect } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Printer,
  FileCode,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Copy,
  Check,
  Download,
  Eye,
  Sparkles,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { generateLatexResumeSource } from "@/lib/latex/latex-generator";
import { toast } from "sonner";
import type { ResumeDataState } from "@/routes/builder";

interface ResumePaperCanvasProps {
  resumeData: ResumeDataState;
  template: "modern" | "classic" | "minimal" | "technical";
  onTemplateChange: (template: "modern" | "classic" | "minimal" | "technical") => void;
  atsScore?: number;
}

export function ResumePaperCanvas({
  resumeData,
  template,
  onTemplateChange,
  atsScore,
}: ResumePaperCanvasProps) {
  const paperRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(100);
  const [isOverflowing, setIsOverflowing] = useState<boolean>(false);
  const [showLatexModal, setShowLatexModal] = useState<boolean>(false);
  const [copiedLatex, setCopiedLatex] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"canvas" | "latex">("canvas");

  // Standard A4 page height in pixels at 96 DPI is ~1123px (minus margins ~ 960px content)
  const A4_HEIGHT_THRESHOLD_PX = 1050;

  useEffect(() => {
    if (paperRef.current) {
      const height = paperRef.current.scrollHeight;
      setIsOverflowing(height > A4_HEIGHT_THRESHOLD_PX);
    }
  }, [resumeData, template]);

  const latexSource = React.useMemo(() => {
    return generateLatexResumeSource(resumeData as any, template === "classic" ? "classic" : "modern");
  }, [resumeData, template]);

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
    a.download = `${(resumeData.personal.name || "resume").toLowerCase().replace(/\s+/g, "_")}.tex`;
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
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-xs font-semibold text-muted-foreground mr-1 hidden sm:inline">
            Style:
          </span>
          {[
            { id: "modern", label: "Modern ATS" },
            { id: "classic", label: "Classic Serif" },
            { id: "technical", label: "Engineering" },
            { id: "minimal", label: "Minimalist" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onTemplateChange(t.id as any)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-medium transition-all whitespace-nowrap",
                template === t.id
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Action Controls & View Switcher */}
        <div className="flex items-center gap-2">
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

        {atsScore && (
          <span className="text-[11px] font-bold text-muted-foreground">
            ATS Score: <span className="text-primary">{atsScore}%</span>
          </span>
        )}
      </div>

      {/* Visual Canvas OR LaTeX Code View */}
      {viewMode === "latex" ? (
        <div className="relative rounded-2xl border border-border bg-slate-950 p-4 font-mono text-xs text-slate-200 shadow-xl overflow-hidden min-h-[700px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <FileCode className="size-4 text-primary" />
              <span className="font-semibold text-slate-300">Deterministic LaTeX Source (.tex)</span>
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
                className="h-7 text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 font-medium"
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
                "w-full bg-white text-slate-900 p-8 sm:p-12 rounded-xl shadow-2xl border border-slate-200 select-text transition-all",
                template === "classic" && "font-serif",
                template === "minimal" && "font-mono text-xs",
                template === "technical" && "font-sans",
                template === "modern" && "font-sans"
              )}
              style={{ minHeight: "1050px" }}
            >
              {/* Header Section */}
              <div
                className={cn(
                  "border-b pb-3.5",
                  template === "classic" ? "border-slate-800 text-center" : "border-slate-300",
                  template === "technical" && "border-slate-900 pb-2"
                )}
              >
                <div
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-baseline",
                    template === "classic" ? "justify-center" : "justify-between"
                  )}
                >
                  <h1
                    className={cn(
                      "text-2xl sm:text-3xl font-black tracking-tight text-slate-950",
                      template === "classic" && "tracking-normal font-bold uppercase text-2xl"
                    )}
                  >
                    {resumeData.personal.name || "Your Name"}
                  </h1>
                  {template !== "classic" && (
                    <span className="text-xs font-bold text-indigo-600 sm:text-sm">
                      {resumeData.personal.targetRole}
                    </span>
                  )}
                </div>

                {/* Subheader Contact Links */}
                <div
                  className={cn(
                    "mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-slate-600",
                    template === "classic" ? "justify-center" : "justify-start"
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
                <div className="mt-3.5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 border-b border-slate-200 pb-0.5 mb-1.5">
                    Professional Summary
                  </h2>
                  <p className="text-xs leading-relaxed text-slate-700">{resumeData.summary}</p>
                </div>
              )}

              {/* Experience Section */}
              {resumeData.experiences.length > 0 && (
                <div className="mt-4 space-y-3">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 border-b border-slate-200 pb-0.5">
                    Work Experience
                  </h2>

                  {resumeData.experiences.map((exp) => (
                    <div key={exp.id} className="space-y-1">
                      <div className="flex items-baseline justify-between text-xs font-bold text-slate-950">
                        <span>
                          {exp.role} <span className="font-normal text-slate-600">— {exp.company}</span>
                          {exp.location && <span className="font-normal text-slate-500"> ({exp.location})</span>}
                        </span>
                        <span className="text-[11px] font-normal text-slate-500 whitespace-nowrap">
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
                <div className="mt-4 space-y-2.5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 border-b border-slate-200 pb-0.5">
                    Key Projects & Technical Implementations
                  </h2>

                  {resumeData.projects.map((proj) => (
                    <div key={proj.id} className="space-y-0.5">
                      <div className="flex items-baseline justify-between text-xs font-bold text-slate-950">
                        <span>
                          {proj.name}{" "}
                          {proj.technologies && (
                            <span className="font-normal text-slate-600">| {proj.technologies}</span>
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

              {/* Skills Section */}
              <div className="mt-4 space-y-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 border-b border-slate-200 pb-0.5">
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

              {/* Education Section */}
              {resumeData.education.length > 0 && (
                <div className="mt-4 space-y-1.5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 border-b border-slate-200 pb-0.5">
                    Education
                  </h2>

                  {resumeData.education.map((edu) => (
                    <div key={edu.id} className="flex items-baseline justify-between text-xs text-slate-800">
                      <div>
                        <strong className="text-slate-950">{edu.degree}</strong> • {edu.institution}
                        {edu.location && <span className="text-slate-500"> ({edu.location})</span>}
                      </div>
                      <span className="text-[11px] text-slate-500">
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
