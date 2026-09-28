import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Briefcase,
  Check,
  CheckCircle2,
  Code,
  Copy,
  Cpu,
  Download,
  Eye,
  FileCheck2,
  FileCode,
  FolderGit2,
  GitBranch,
  GitCompare,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Loader2,
  Play,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trash2,
  User,
  Wand2,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase, type Resume } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import {
  enhanceBulletPointWithAI,
  generateSummaryWithAI,
  auditResumeAtsWithAI,
  generateRoleBulletPointsWithAI,
  suggestTechnicalSkillsWithAI,
  type AtsAuditResult,
} from "@/lib/ai/resume-agent";
import {
  executeMultiAgentResumePipeline,
} from "@/lib/ai/orchestrator";
import type {
  CandidateEvidenceBank,
  AgentExecutionStep,
  MultiAgentPipelineResult,
} from "@/lib/ai/types";
import { generateLatexResumeSource } from "@/lib/latex/latex-generator";
import { ResumePaperCanvas } from "@/components/builder/resume-paper-canvas";
import {
  analyzeGitHubRepository,
  type GitHubProjectAnalysis,
} from "@/lib/ai/agents/github-agent";
import {
  branchCandidatePersonas,
  type BranchedPersonaResume,
  type PersonaType,
} from "@/lib/ai/persona-brancher";

export const Route = createFileRoute("/builder")({
  head: () => ({
    meta: [
      { title: "Live ATS Resume Builder — JobMate AI" },
      { name: "description", content: "Build and tailor your ATS-optimized resume with AI in real time." },
      { property: "og:title", content: "Live ATS Resume Builder — JobMate AI" },
      { property: "og:description", content: "Interactive AI Resume Builder with multi-agent pipeline and ATS audits." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResumeBuilderPage,
});

export interface ResumeDataState {
  personal: {
    name: string;
    email: string;
    phone: string;
    location: string;
    targetRole: string;
    linkedin: string;
    github: string;
    portfolio: string;
  };
  summary: string;
  experiences: Array<{
    id: string;
    role: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    bullets: string[];
  }>;
  projects: Array<{
    id: string;
    name: string;
    technologies: string;
    link: string;
    bullets: string[];
  }>;
  education: Array<{
    id: string;
    degree: string;
    institution: string;
    location: string;
    startDate: string;
    endDate: string;
    score: string;
  }>;
  skills: {
    languages: string[];
    frameworks: string[];
    tools: string[];
    softSkills: string[];
  };
}

const initialResumeData: ResumeDataState = {
  personal: {
    name: "Alex Jordan",
    email: "alex.jordan@example.com",
    phone: "+1 (555) 234-5678",
    location: "San Francisco, CA",
    targetRole: "Senior Frontend Engineer",
    linkedin: "https://linkedin.com/in/alexjordan",
    github: "https://github.com/alexjordan",
    portfolio: "https://alexjordan.dev",
  },
  summary:
    "Results-driven Senior Frontend Engineer with 5+ years of experience building high-performance, accessible web applications with React, TypeScript, and modern state architectures. Proven track record in boosting conversion rates and cutting web latency.",
  experiences: [
    {
      id: "1",
      role: "Senior Frontend Engineer",
      company: "Stripe",
      location: "San Francisco, CA",
      startDate: "2023",
      endDate: "Present",
      current: true,
      bullets: [
        "Architected core checkout modules processing over 1.2M daily transactions with 99.99% uptime.",
        "Reduced Largest Contentful Paint (LCP) by 38% via proactive asset preloading and code splitting.",
        "Spearheaded design system adoption across 14 product squads, slashing UI defect rates by 25%.",
      ],
    },
    {
      id: "2",
      role: "Software Engineer",
      company: "Vercel",
      location: "Remote",
      startDate: "2021",
      endDate: "2023",
      current: false,
      bullets: [
        "Developed high-throughput analytics dashboards using Next.js and TypeScript, reducing query latency by 45%.",
        "Implemented automated CI/CD unit testing suites that boosted code test coverage from 64% to 92%.",
      ],
    },
  ],
  projects: [
    {
      id: "p1",
      name: "Autonomous Agent Workflow Engine",
      technologies: "TypeScript, React, Node.js, TailwindCSS",
      link: "https://github.com/alexjordan/agent-flow",
      bullets: [
        "Engineered an open-source visual workflow engine with 12k+ GitHub stars and 45k monthly downloads.",
        "Optimized client-side rendering pipeline to support 500+ live node graphs with 60 FPS responsiveness.",
      ],
    },
  ],
  education: [
    {
      id: "e1",
      degree: "B.S. in Computer Science",
      institution: "University of California, Berkeley",
      location: "Berkeley, CA",
      startDate: "2017",
      endDate: "2021",
      score: "GPA: 3.9 / 4.0 (Honors)",
    },
  ],
  skills: {
    languages: ["TypeScript", "JavaScript", "Python", "SQL", "HTML/CSS"],
    frameworks: ["React 19", "Next.js", "TailwindCSS", "Node.js", "Express", "GraphQL"],
    tools: ["Git", "Docker", "AWS", "PostgreSQL", "Supabase", "Jest", "Vite"],
    softSkills: ["Technical Leadership", "Agile/Scrum", "System Architecture", "Mentorship"],
  },
};

function ResumeBuilderPage() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [resumeData, setResumeData] = useState<ResumeDataState>(() => {
    if (profile) {
      return {
        ...initialResumeData,
        personal: {
          ...initialResumeData.personal,
          name: profile.full_name || initialResumeData.personal.name,
          email: profile.email || initialResumeData.personal.email,
          targetRole: profile.target_role || initialResumeData.personal.targetRole,
          github: profile.github_url || initialResumeData.personal.github,
          linkedin: profile.linkedin_url || initialResumeData.personal.linkedin,
        },
      };
    }
    return initialResumeData;
  });

  const [activeResumeId, setActiveResumeId] = useState<string | null>(null);
  const [loadingResume, setLoadingResume] = useState(false);
  const [template, setTemplate] = useState<"modern" | "classic" | "minimal" | "technical">("modern");
  const [activeFormTab, setActiveFormTab] = useState<"personal" | "summary" | "experience" | "projects" | "education" | "skills">("personal");
  const [atsAudit, setAtsAudit] = useState<AtsAuditResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [enhancingBulletId, setEnhancingBulletId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Multi-Agent Pipeline Modal State
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [targetJdText, setTargetJdText] = useState("");
  const [targetCompanyName, setTargetCompanyName] = useState("");
  const [isExecutingPipeline, setIsExecutingPipeline] = useState(false);
  const [pipelineSteps, setPipelineSteps] = useState<AgentExecutionStep[]>([]);
  const [pipelineResult, setPipelineResult] = useState<MultiAgentPipelineResult | null>(null);

  // LaTeX ATS Export Modal State
  const [isLatexModalOpen, setIsLatexModalOpen] = useState(false);
  const [latexSource, setLatexSource] = useState("");

  // GitHub Project Parser State
  const [isGithubModalOpen, setIsGithubModalOpen] = useState(false);
  const [githubRepoUrl, setGithubRepoUrl] = useState("");
  const [isAnalyzingGithub, setIsAnalyzingGithub] = useState(false);
  const [githubAnalysis, setGithubAnalysis] = useState<GitHubProjectAnalysis | null>(null);

  // Multi-Persona Branching State
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [isBranchingPersonas, setIsBranchingPersonas] = useState(false);
  const [branchedPersonas, setBranchedPersonas] = useState<Record<PersonaType, BranchedPersonaResume> | null>(null);
  const [selectedPersonaTab, setSelectedPersonaTab] = useState<PersonaType>("fullstack");

  const handleOpenLatexModal = () => {
    const generated = generateLatexResumeSource(resumeData as any, template === "classic" ? "classic" : "modern");
    setLatexSource(generated);
    setIsLatexModalOpen(true);
  };

  const handleCopyLatex = () => {
    navigator.clipboard.writeText(latexSource);
    toast.success("LaTeX ATS source code copied to clipboard!");
  };

  const handleDownloadLatex = () => {
    const blob = new Blob([latexSource], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(resumeData.personal.name || "resume").toLowerCase().replace(/\s+/g, "_")}_ats.tex`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("LaTeX .tex file downloaded!");
  };

  // Load specific resume if resumeId query param exists or fallback to profile
  useEffect(() => {
    let resumeIdParam: string | null = null;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      resumeIdParam = params.get("resumeId");
    }

    if (resumeIdParam && user?.id) {
      setLoadingResume(true);
      supabase
        .from("resumes")
        .select("*")
        .eq("id", resumeIdParam)
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data, error }) => {
          setLoadingResume(false);
          if (data && data.resume_data) {
            setActiveResumeId(data.id);
            setResumeData(data.resume_data as ResumeDataState);
            if (data.template_id) {
              setTemplate(
                data.template_id.includes("classic")
                  ? "classic"
                  : data.template_id.includes("minimal")
                  ? "minimal"
                  : data.template_id.includes("technical")
                  ? "technical"
                  : "modern"
              );
            }
            if (data.ats_feedback) {
              setAtsAudit(data.ats_feedback as AtsAuditResult);
            }
            toast.success(`Loaded "${data.title}" from Supabase!`);
          }
        })
        .catch(() => setLoadingResume(false));
    } else if (profile) {
      setResumeData((prev) => ({
        ...prev,
        personal: {
          ...prev.personal,
          name: profile.full_name || prev.personal.name,
          email: profile.email || prev.personal.email,
          targetRole: profile.target_role || prev.personal.targetRole,
          github: profile.github_url || prev.personal.github,
          linkedin: profile.linkedin_url || prev.personal.linkedin,
        },
      }));
    }
  }, [user, profile]);

  // Execute Multi-Agent Pipeline
  const handleRunMultiAgentPipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetJdText.trim()) {
      toast.error("Please paste a target job description to run the multi-agent pipeline.");
      return;
    }

    setIsExecutingPipeline(true);
    setPipelineSteps([]);
    setPipelineResult(null);

    // Formulate Candidate Ground-Truth Evidence Bank
    const evidenceBank: CandidateEvidenceBank = {
      candidateId: user?.id || "local-user",
      fullName: resumeData.personal.name,
      targetRole: resumeData.personal.targetRole,
      evidenceItems: [
        ...resumeData.experiences.map((exp) => ({
          id: exp.id,
          category: "experience" as const,
          title: exp.role,
          organization: exp.company,
          startDate: exp.startDate,
          endDate: exp.endDate,
          verifiedClaims: exp.bullets,
          metrics: exp.bullets.filter((b) => b.includes("%") || /\d+/.test(b)),
          technologiesUsed: resumeData.skills.languages.concat(resumeData.skills.frameworks),
        })),
        ...resumeData.projects.map((proj) => ({
          id: proj.id,
          category: "project" as const,
          title: proj.name,
          verifiedClaims: proj.bullets,
          metrics: [],
          technologiesUsed: proj.technologies.split(",").map((s) => s.trim()),
        })),
      ],
    };

    try {
      const result = await executeMultiAgentResumePipeline(
        targetJdText,
        evidenceBank,
        targetCompanyName || undefined,
        (updatedStep) => {
          setPipelineSteps((prev) => {
            const next = [...prev];
            const idx = next.findIndex((s) => s.agentName === updatedStep.agentName);
            if (idx >= 0) {
              next[idx] = updatedStep;
            } else {
              next.push(updatedStep);
            }
            return next;
          });
        }
      );

      setPipelineResult(result);
      toast.success("Multi-Agent Pipeline finished successfully!");
    } catch (err: any) {
      toast.error("Multi-Agent Pipeline failed: " + err.message);
    } finally {
      setIsExecutingPipeline(false);
    }
  };

  const handleApplyPipelineResult = () => {
    if (!pipelineResult) return;
    setResumeData(pipelineResult.generatedContent);
    if (pipelineResult.resumePlan.recommendedTemplate) {
      setTemplate(pipelineResult.resumePlan.recommendedTemplate as any);
    }
    setAtsAudit({
      overallScore: pipelineResult.atsAudit.overallScore,
      keywordScore: pipelineResult.atsAudit.keywordDensityScore,
      impactScore: pipelineResult.atsAudit.quantifiableImpactScore,
      formatScore: pipelineResult.atsAudit.formatComplianceScore,
      passedChecks: pipelineResult.atsAudit.parserChecklist.filter((c) => c.passed).map((c) => c.rule),
      suggestions: pipelineResult.atsAudit.parserChecklist.filter((c) => !c.passed).map((c) => c.explanation),
      missingKeywords: pipelineResult.atsAudit.missingKeywords,
    });
    setIsAgentModalOpen(false);
    toast.success("Tailored resume and ATS verification applied to canvas!");
  };

  // GitHub Analysis Handler
  const handleAnalyzeGithubRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubRepoUrl.trim()) {
      toast.error("Please enter a GitHub URL or slug (e.g. facebook/react or https://github.com/user/repo)");
      return;
    }
    setIsAnalyzingGithub(true);
    setGithubAnalysis(null);
    try {
      const result = await analyzeGitHubRepository(githubRepoUrl.trim());
      setGithubAnalysis(result);
      toast.success("GitHub repository analyzed with 3 Google XYZ bullet points!");
    } catch (err: any) {
      toast.error("GitHub Analysis failed: " + err.message);
    } finally {
      setIsAnalyzingGithub(false);
    }
  };

  const handleAddGithubProjectToResume = () => {
    if (!githubAnalysis) return;
    const newProject = {
      id: Date.now().toString(),
      name: githubAnalysis.projectTitle,
      technologies: githubAnalysis.primaryTechnologies.join(", "),
      link: githubAnalysis.repoUrl,
      bullets: githubAnalysis.xyzBullets,
    };
    setResumeData((prev) => ({
      ...prev,
      projects: [newProject, ...prev.projects],
    }));
    setIsGithubModalOpen(false);
    setGithubAnalysis(null);
    setGithubRepoUrl("");
    toast.success(`Added "${newProject.name}" with 3 Google XYZ bullets to your resume!`);
  };

  // Multi-Persona Branching Handler
  const handleRunPersonaBranching = async () => {
    setIsBranchingPersonas(true);
    try {
      const evidenceBank: CandidateEvidenceBank = {
        candidateId: user?.id || "local-user",
        fullName: resumeData.personal.name,
        targetRole: resumeData.personal.targetRole,
        evidenceItems: [
          ...resumeData.experiences.map((exp) => ({
            id: exp.id,
            category: "experience" as const,
            title: exp.role,
            organization: exp.company,
            startDate: exp.startDate,
            endDate: exp.endDate,
            verifiedClaims: exp.bullets,
            metrics: exp.bullets.filter((b) => b.includes("%") || /\d+/.test(b)),
            technologiesUsed: resumeData.skills.languages.concat(resumeData.skills.frameworks),
          })),
          ...resumeData.projects.map((proj) => ({
            id: proj.id,
            category: "project" as const,
            title: proj.name,
            verifiedClaims: proj.bullets,
            metrics: [],
            technologiesUsed: proj.technologies.split(",").map((s) => s.trim()),
          })),
        ],
      };

      const personas = await branchCandidatePersonas(evidenceBank, resumeData.personal.name);
      setBranchedPersonas(personas);
      setIsPersonaModalOpen(true);
      toast.success("Synthesized 3 specialized career personas from your evidence bank!");
    } catch (err: any) {
      toast.error("Persona branching failed: " + err.message);
    } finally {
      setIsBranchingPersonas(false);
    }
  };

  const handleApplyPersona = (persona: BranchedPersonaResume) => {
    setResumeData((prev) => ({
      ...prev,
      personal: {
        ...prev.personal,
        targetRole: persona.targetRole,
      },
      summary: persona.tailoredSummary,
      skills: {
        ...prev.skills,
        languages: persona.skillsTaxonomy.languages.split(",").map((s) => s.trim()).filter(Boolean),
        frameworks: persona.skillsTaxonomy.frameworks.split(",").map((s) => s.trim()).filter(Boolean),
        tools: (persona.skillsTaxonomy.cloud + ", " + persona.skillsTaxonomy.databases).split(",").map((s) => s.trim()).filter(Boolean),
      },
    }));
    setIsPersonaModalOpen(false);
    toast.success(`Applied "${persona.displayName}" to your active resume!`);
  };

  // AI Summary Generation
  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const summary = await generateSummaryWithAI(
        resumeData.personal.name,
        resumeData.personal.targetRole,
        [...resumeData.skills.languages, ...resumeData.skills.frameworks],
        4
      );
      setResumeData((prev) => ({ ...prev, summary }));
      toast.success("AI Professional Summary generated with GPT-4o-mini!");
    } catch (err: any) {
      toast.error("Failed to generate summary: " + err.message);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // AI Bullet Point Enhancement
  const handleEnhanceBullet = async (expId: string, bulletIdx: number, currentBullet: string) => {
    const actionKey = `${expId}-${bulletIdx}`;
    setEnhancingBulletId(actionKey);
    try {
      const variations = await enhanceBulletPointWithAI(currentBullet, resumeData.personal.targetRole);
      if (variations && variations.length > 0) {
        const bestVariation = variations[0];
        setResumeData((prev) => {
          const nextExps = prev.experiences.map((exp) => {
            if (exp.id === expId) {
              const nextBullets = [...exp.bullets];
              nextBullets[bulletIdx] = bestVariation;
              return { ...exp, bullets: nextBullets };
            }
            return exp;
          });
          return { ...prev, experiences: nextExps };
        });
        toast.success("Bullet point enhanced with quantifiable XYZ formula!");
      }
    } catch (err: any) {
      toast.error("Failed to enhance bullet: " + err.message);
    } finally {
      setEnhancingBulletId(null);
    }
  };

  const [generatingRoleBulletsId, setGeneratingRoleBulletsId] = useState<string | null>(null);
  const [isSuggestingSkills, setIsSuggestingSkills] = useState(false);

  // AI Generate 3 New Role Bullets
  const handleGenerateRoleBullets = async (expId: string, role: string, company: string) => {
    setGeneratingRoleBulletsId(expId);
    try {
      const bullets = await generateRoleBulletPointsWithAI(
        role || resumeData.personal.targetRole || "Software Engineer",
        company || "Tech Company",
        resumeData.skills.languages.concat(resumeData.skills.frameworks)
      );
      setResumeData((prev) => {
        const nextExps = prev.experiences.map((exp) => {
          if (exp.id === expId) {
            return { ...exp, bullets: [...exp.bullets, ...bullets] };
          }
          return exp;
        });
        return { ...prev, experiences: nextExps };
      });
      toast.success("AI generated 3 new high-impact XYZ bullet points!");
    } catch (err: any) {
      toast.error("Failed to generate role bullets: " + err.message);
    } finally {
      setGeneratingRoleBulletsId(null);
    }
  };

  // AI Suggest Technical Skills
  const handleSuggestSkills = async () => {
    setIsSuggestingSkills(true);
    try {
      const suggested = await suggestTechnicalSkillsWithAI(
        resumeData.personal.targetRole || "Software Engineer",
        resumeData.skills.languages.concat(resumeData.skills.frameworks)
      );
      setResumeData((prev) => ({
        ...prev,
        skills: {
          languages: Array.from(new Set([...prev.skills.languages, ...suggested.languages])),
          frameworks: Array.from(new Set([...prev.skills.frameworks, ...suggested.frameworks])),
          tools: Array.from(new Set([...prev.skills.tools, ...suggested.tools])),
          softSkills: Array.from(new Set([...prev.skills.softSkills, ...suggested.softSkills])),
        },
      }));
      toast.success("AI suggested high-demand technical skills added!");
    } catch (err: any) {
      toast.error("Failed to suggest skills: " + err.message);
    } finally {
      setIsSuggestingSkills(false);
    }
  };

  // Run ATS Audit
  const handleRunAtsAudit = async () => {
    setIsAuditing(true);
    try {
      const audit = await auditResumeAtsWithAI(resumeData);
      setAtsAudit(audit);
      toast.success(`ATS Audit Complete! Score: ${audit.overallScore}%`);
    } catch (err: any) {
      toast.error("Audit failed: " + err.message);
    } finally {
      setIsAuditing(false);
    }
  };

  // Save Resume to Supabase
  const handleSaveToSupabase = async () => {
    if (!user) {
      toast.error("Please sign in to save your resume to Supabase.");
      return;
    }

    setIsSaving(true);
    try {
      if (activeResumeId) {
        const { error } = await supabase
          .from("resumes")
          .update({
            title: `${resumeData.personal.targetRole || "Software Engineer"} — ${new Date().toLocaleDateString()}`,
            target_role: resumeData.personal.targetRole,
            template_id: template,
            ats_score: atsAudit?.overallScore || 92,
            ats_feedback: atsAudit,
            resume_data: resumeData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", activeResumeId)
          .eq("user_id", user.id);

        if (error) {
          toast.error("Failed to update resume: " + error.message);
          return;
        }

        toast.success("Resume changes updated in Supabase database!");
      } else {
        const { data, error } = await supabase
          .from("resumes")
          .insert({
            user_id: user.id,
            title: `${resumeData.personal.targetRole || "Software Engineer"} — ${new Date().toLocaleDateString()}`,
            target_role: resumeData.personal.targetRole,
            template_id: template,
            ats_score: atsAudit?.overallScore || 92,
            ats_feedback: atsAudit,
            resume_data: resumeData,
            is_primary: true,
          })
          .select()
          .single();

        if (error) {
          toast.error("Failed to save resume: " + error.message);
          return;
        }

        if (data) {
          setActiveResumeId(data.id);
        }

        toast.success("Resume saved successfully to Supabase database!");
      }
    } catch (err: any) {
      toast.error("Error saving resume: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 dark:bg-slate-950">
      {/* Top Builder Navbar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur-md print:hidden">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            <span>Dashboard</span>
          </Link>

          <span className="h-4 w-px bg-border" />

          <div className="flex items-center gap-1.5">
            <span className="grid size-6 place-items-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
              <FileCheck2 className="size-3.5" />
            </span>
            <span className="text-xs font-bold text-foreground truncate max-w-[180px] sm:max-w-xs">
              {resumeData.personal.targetRole || "ATS Resume Builder"}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Persona Branching Trigger */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunPersonaBranching}
            disabled={isBranchingPersonas}
            className="h-8 gap-1.5 rounded-lg text-xs font-semibold border-border hover:bg-accent"
            title="Branch evidence into 3 role personas (Full-Stack, Backend, AI/ML)"
          >
            {isBranchingPersonas ? (
              <Loader2 className="size-3.5 animate-spin text-primary" />
            ) : (
              <GitBranch className="size-3.5 text-primary" />
            )}
            <span className="hidden sm:inline">{isBranchingPersonas ? "Branching..." : "Branch Personas"}</span>
          </Button>

          {/* Multi-Agent Orchestrator Trigger */}
          <Button
            size="sm"
            onClick={() => setIsAgentModalOpen(true)}
            className="h-8 gap-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-button"
          >
            <Cpu className="size-3.5" />
            <span className="hidden sm:inline">Multi-Agent Tailor</span>
            <span className="sm:hidden">Agent</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRunAtsAudit}
            disabled={isAuditing}
            className="h-8 gap-1.5 rounded-lg text-xs font-semibold border-primary/30 text-primary hover:bg-primary/5"
          >
            <ShieldCheck className="size-3.5" />
            <span>{isAuditing ? "Auditing..." : "Audit ATS"}</span>
            {atsAudit && (
              <span className="rounded bg-emerald-500/15 px-1 py-0.2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                {atsAudit.overallScore}%
              </span>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenLatexModal}
            className="h-8 gap-1.5 rounded-lg text-xs font-semibold border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10"
            title="Export ATS-First LaTeX Source (.tex)"
          >
            <FileCode className="size-3.5" />
            <span className="hidden sm:inline">LaTeX (.tex)</span>
          </Button>

          <Button
            size="sm"
            onClick={handleSaveToSupabase}
            disabled={isSaving}
            className="h-8 gap-1.5 rounded-lg text-xs font-bold shadow-button"
          >
            <Save className="size-3.5" />
            <span>{isSaving ? "Saving..." : "Save Resume"}</span>
          </Button>
        </div>
      </header>

      {/* GitHub Repo Intelligence Modal */}
      {isGithubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm print:hidden">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-background p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-slate-900 text-white dark:bg-slate-800 shadow-button">
                  <FolderGit2 className="size-5 text-indigo-400" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-foreground">
                    GitHub Code Intelligence & Project Parser
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Analyzes dependencies, AST manifests & synthesis of Google XYZ quantified bullets.
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsGithubModalOpen(false);
                  setGithubAnalysis(null);
                }}
                className="size-8 p-0 text-muted-foreground"
              >
                ✕
              </Button>
            </div>

            <form onSubmit={handleAnalyzeGithubRepo} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  GitHub Repository URL or Slug
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={githubRepoUrl}
                    onChange={(e) => setGithubRepoUrl(e.target.value)}
                    placeholder="e.g. https://github.com/facebook/react or username/project"
                    className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none font-mono"
                  />
                  <Button
                    type="submit"
                    disabled={isAnalyzingGithub}
                    size="sm"
                    className="gap-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {isAnalyzingGithub ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        <span>Parsing AST...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-3.5" />
                        <span>Parse Repo</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>

            {/* Analysis Result Output */}
            {githubAnalysis && (
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3 animate-in fade-in-50">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      {githubAnalysis.projectTitle}
                      <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {githubAnalysis.complexityLevel}
                      </span>
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {githubAnalysis.architectureSummary}
                    </p>
                  </div>
                  {githubAnalysis.stars > 0 && (
                    <div className="flex items-center gap-1 text-xs font-semibold text-amber-500">
                      <Star className="size-3.5 fill-amber-500" />
                      <span>{githubAnalysis.stars}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {githubAnalysis.primaryTechnologies.map((tech, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-medium bg-background border border-border px-2 py-0.5 rounded-md text-foreground"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                <div className="space-y-1.5 pt-2 border-t border-border/60">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1">
                    <CheckCircle2 className="size-3.5 text-emerald-500" /> Synthesized Google XYZ Bullets:
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-muted-foreground leading-snug">
                    {githubAnalysis.xyzBullets.map((bullet, idx) => (
                      <li key={idx} className="text-foreground">{bullet}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    size="sm"
                    onClick={handleAddGithubProjectToResume}
                    className="gap-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-button"
                  >
                    <Check className="size-3.5" /> Add to Resume Projects
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Multi-Persona Branching Modal */}
      {isPersonaModalOpen && branchedPersonas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm print:hidden">
          <div className="w-full max-w-3xl rounded-2xl border border-border bg-background p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-white shadow-button">
                  <GitBranch className="size-5" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-foreground">
                    Multi-Persona Specialized Resumes
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Truth-grounded evidence branched into 3 specialized high-impact target personas.
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPersonaModalOpen(false)}
                className="size-8 p-0 text-muted-foreground"
              >
                ✕
              </Button>
            </div>

            {/* Persona Switcher Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-muted/40 rounded-xl border border-border">
              {(
                [
                  { id: "fullstack", label: "Full-Stack Engineer", icon: Code },
                  { id: "backend", label: "Backend / Distributed", icon: Cpu },
                  { id: "ai_ml", label: "AI & ML Systems", icon: Sparkles },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const isActive = selectedPersonaTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedPersonaTab(tab.id)}
                    className={cn(
                      "flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all",
                      isActive
                        ? "bg-background text-foreground shadow-xs font-extrabold border border-border"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="size-3.5 text-primary" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Selected Persona Spec Sheet */}
            {branchedPersonas[selectedPersonaTab] && (
              <div className="space-y-4 rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-extrabold text-foreground">
                      {branchedPersonas[selectedPersonaTab].displayName}
                    </h4>
                    <p className="text-xs font-semibold text-primary mt-0.5">
                      {branchedPersonas[selectedPersonaTab].targetRole}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleApplyPersona(branchedPersonas[selectedPersonaTab])}
                    className="gap-1.5 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-button"
                  >
                    <Check className="size-3.5" /> Apply to Canvas
                  </Button>
                </div>

                <div className="rounded-lg bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground border border-border/60">
                  <strong className="text-foreground">Tailored Executive Summary: </strong>
                  {branchedPersonas[selectedPersonaTab].tailoredSummary}
                </div>

                <div className="space-y-2 text-xs">
                  <h5 className="font-bold text-foreground">Reweighted Skill Taxonomy:</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground">
                    <div className="p-2 rounded-lg bg-background border border-border">
                      <strong className="text-foreground">Languages: </strong>
                      {branchedPersonas[selectedPersonaTab].skillsTaxonomy.languages}
                    </div>
                    <div className="p-2 rounded-lg bg-background border border-border">
                      <strong className="text-foreground">Frameworks: </strong>
                      {branchedPersonas[selectedPersonaTab].skillsTaxonomy.frameworks}
                    </div>
                    <div className="p-2 rounded-lg bg-background border border-border">
                      <strong className="text-foreground">Cloud / Infra: </strong>
                      {branchedPersonas[selectedPersonaTab].skillsTaxonomy.cloud}
                    </div>
                    <div className="p-2 rounded-lg bg-background border border-border">
                      <strong className="text-foreground">Databases: </strong>
                      {branchedPersonas[selectedPersonaTab].skillsTaxonomy.databases}
                    </div>
                  </div>
                </div>

                {branchedPersonas[selectedPersonaTab].highlightedBullets.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-border/60 text-xs">
                    <h5 className="font-bold text-foreground">Specialized Highlight Bullets:</h5>
                    <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                      {branchedPersonas[selectedPersonaTab].highlightedBullets.map((b, i) => (
                        <li key={i} className="text-foreground">{b}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* LaTeX ATS Export Modal */}
      {isLatexModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm print:hidden">
          <div className="w-full max-w-4xl rounded-2xl border border-border bg-background p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-white shadow-button">
                  <FileCode className="size-5" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-foreground">
                    ATS-First LaTeX Resume Source Code
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Deterministic single-column format optimized for Workday, Greenhouse, and Overleaf.
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsLatexModalOpen(false)}
                className="size-8 p-0 text-muted-foreground"
              >
                ✕
              </Button>
            </div>

            <div className="flex items-center justify-between bg-muted/50 rounded-xl p-3 border border-border text-xs">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span className="font-semibold text-foreground">1-Page Single-Column Template (`glyphtounicode` + `titlesec` Safe)</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyLatex}
                  className="h-7 text-xs gap-1.5"
                >
                  <Copy className="size-3.5" />
                  <span>Copy LaTeX</span>
                </Button>
                <Button
                  size="sm"
                  onClick={handleDownloadLatex}
                  className="h-7 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Download className="size-3.5" />
                  <span>Download .tex</span>
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-auto rounded-xl border border-border bg-slate-950 p-4">
              <pre className="text-[11px] font-mono text-emerald-400 whitespace-pre leading-relaxed select-all">
                {latexSource}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-muted-foreground">
              <span>Tip: You can paste this code directly into <strong className="text-foreground">Overleaf</strong> or compile with <code className="text-primary font-mono">pdflatex</code>.</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsLatexModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Agent Pipeline Modal */}
      {isAgentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm print:hidden">
          <div className="w-full max-w-3xl rounded-2xl border border-border bg-background p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-white shadow-button">
                  <Cpu className="size-5" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-foreground">
                    Multi-Agent Resume Tailoring Pipeline
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    StateGraph DAG: JD Decomposer → Planner → RAG Synthesizer → Critic Loop → Deterministic LaTeX
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAgentModalOpen(false)}
                className="size-8 p-0 text-muted-foreground"
              >
                ✕
              </Button>
            </div>

            {/* Input Form */}
            {!pipelineResult && (
              <form onSubmit={handleRunMultiAgentPipeline} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground">
                    Target Company Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={targetCompanyName}
                    onChange={(e) => setTargetCompanyName(e.target.value)}
                    placeholder="e.g. Stripe, Linear, Vercel, OpenAI"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground">
                    Target Job Description (Paste JD Text)
                  </label>
                  <textarea
                    rows={6}
                    value={targetJdText}
                    onChange={(e) => setTargetJdText(e.target.value)}
                    placeholder="Paste the full job description text here..."
                    className="mt-1 w-full rounded-xl border border-border bg-background p-3 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAgentModalOpen(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isExecutingPipeline}
                    size="sm"
                    className="gap-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-button"
                  >
                    {isExecutingPipeline ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        <span>Running Agent Pipeline...</span>
                      </>
                    ) : (
                      <>
                        <Play className="size-3.5" />
                        <span>Execute Multi-Agent DAG</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}

            {/* Live Pipeline Execution Graph */}
            {pipelineSteps.length > 0 && (
              <div className="space-y-3 rounded-xl border border-border bg-section p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Agent Execution Graph & Trace
                </h4>

                <div className="space-y-2">
                  {pipelineSteps.map((step) => (
                    <div
                      key={step.agentName}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border p-3 text-xs transition-all",
                        step.status === "completed"
                          ? "border-emerald-500/30 bg-emerald-500/5 text-foreground"
                          : step.status === "running"
                          ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-900 dark:text-indigo-200"
                          : step.status === "reflection_loop"
                          ? "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200 animate-pulse"
                          : "border-border bg-background text-muted-foreground"
                      )}
                    >
                      <span className="mt-0.5">
                        {step.status === "completed" ? (
                          <CheckCircle2 className="size-4 text-emerald-500" />
                        ) : step.status === "running" ? (
                          <Loader2 className="size-4 animate-spin text-indigo-600" />
                        ) : step.status === "reflection_loop" ? (
                          <RotateCcw className="size-4 text-amber-500" />
                        ) : (
                          <span className="size-2 rounded-full bg-muted-foreground" />
                        )}
                      </span>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold">{step.displayName}</span>
                          <span className="text-[10px] uppercase tracking-wider opacity-75 font-mono">
                            {step.status}
                          </span>
                        </div>
                        {step.outputSummary && (
                          <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                            {step.outputSummary}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Results Actions */}
            {pipelineResult && (
              <div className="pt-3 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-5 text-emerald-500" />
                  <span className="text-xs font-semibold text-foreground">
                    ATS Score: <strong className="text-emerald-600">{pipelineResult.atsAudit.overallScore}%</strong> • Reflection passes: {pipelineResult.reflectionIterations}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPipelineResult(null);
                      setPipelineSteps([]);
                    }}
                    className="text-xs"
                  >
                    Run Again
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleApplyPipelineResult}
                    className="gap-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-button"
                  >
                    <Check className="size-4" /> Apply to Resume Canvas
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Split-Screen Workspace */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6 max-w-[1600px] mx-auto w-full">
        {/* Left Column: Form & AI Assistant (5 Cols on desktop) */}
        <section className="lg:col-span-5 flex flex-col gap-4 print:hidden">
          {/* Form Tabs Bar */}
          <div className="flex overflow-x-auto rounded-xl border border-border bg-background p-1 shadow-xs gap-1">
            {[
              { id: "personal", label: "Contact", icon: User },
              { id: "summary", label: "Summary", icon: Wand2 },
              { id: "experience", label: "Experience", icon: Briefcase },
              { id: "projects", label: "Projects", icon: FolderGit2 },
              { id: "education", label: "Education", icon: GraduationCap },
              { id: "skills", label: "Skills", icon: Zap },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeFormTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFormTab(tab.id as any)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 px-2.5 text-xs font-semibold transition-all whitespace-nowrap",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon className="size-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form Card Container */}
          <div className="rounded-2xl border border-border bg-background p-5 sm:p-6 shadow-xs flex-1">
            {/* 1. Contact Form */}
            {activeFormTab === "personal" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <h3 className="text-sm font-bold text-foreground">Personal & Contact Info</h3>
                  <span className="text-[10px] text-muted-foreground">ATS Header Section</span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-foreground">Full Name</label>
                    <input
                      type="text"
                      value={resumeData.personal.name}
                      onChange={(e) =>
                        setResumeData({
                          ...resumeData,
                          personal: { ...resumeData.personal, name: e.target.value },
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-foreground">Target Role Title</label>
                    <input
                      type="text"
                      value={resumeData.personal.targetRole}
                      onChange={(e) =>
                        setResumeData({
                          ...resumeData,
                          personal: { ...resumeData.personal, targetRole: e.target.value },
                        })
                      }
                      placeholder="e.g. Senior Frontend Engineer"
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground">Email Address</label>
                    <input
                      type="email"
                      value={resumeData.personal.email}
                      onChange={(e) =>
                        setResumeData({
                          ...resumeData,
                          personal: { ...resumeData.personal, email: e.target.value },
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground">Phone Number</label>
                    <input
                      type="text"
                      value={resumeData.personal.phone}
                      onChange={(e) =>
                        setResumeData({
                          ...resumeData,
                          personal: { ...resumeData.personal, phone: e.target.value },
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground">Location (City, State)</label>
                    <input
                      type="text"
                      value={resumeData.personal.location}
                      onChange={(e) =>
                        setResumeData({
                          ...resumeData,
                          personal: { ...resumeData.personal, location: e.target.value },
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground">GitHub URL</label>
                    <input
                      type="text"
                      value={resumeData.personal.github}
                      onChange={(e) =>
                        setResumeData({
                          ...resumeData,
                          personal: { ...resumeData.personal, github: e.target.value },
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-foreground">LinkedIn URL</label>
                    <input
                      type="text"
                      value={resumeData.personal.linkedin}
                      onChange={(e) =>
                        setResumeData({
                          ...resumeData,
                          personal: { ...resumeData.personal, linkedin: e.target.value },
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. Professional Summary Form */}
            {activeFormTab === "summary" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Professional Summary</h3>
                    <p className="text-[11px] text-muted-foreground">Concise 2-3 lines highlighting key metrics and competencies.</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleGenerateSummary}
                    disabled={isGeneratingSummary}
                    className="gap-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Sparkles className="size-3.5" />
                    <span>{isGeneratingSummary ? "Generating..." : "✨ AI Generate"}</span>
                  </Button>
                </div>

                <textarea
                  rows={5}
                  value={resumeData.summary}
                  onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })}
                  placeholder="Summarize your years of experience, core technical achievements, and target focus..."
                  className="w-full rounded-xl border border-border bg-background p-3 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
            )}

            {/* 3. Work Experience Form */}
            {activeFormTab === "experience" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <h3 className="text-sm font-bold text-foreground">Work Experience</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newExp = {
                        id: Date.now().toString(),
                        role: "Software Engineer",
                        company: "Company Name",
                        location: "City, State",
                        startDate: "2023",
                        endDate: "Present",
                        current: true,
                        bullets: [
                          "Accomplished [X] as measured by [Y], by doing [Z].",
                        ],
                      };
                      setResumeData({
                        ...resumeData,
                        experiences: [newExp, ...resumeData.experiences],
                      });
                    }}
                    className="gap-1 text-xs"
                  >
                    <Plus className="size-3.5" /> Add Experience
                  </Button>
                </div>

                {resumeData.experiences.map((exp, expIdx) => (
                  <div key={exp.id} className="rounded-xl border border-border bg-section/60 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <input
                        type="text"
                        value={exp.role}
                        onChange={(e) => {
                          const updated = [...resumeData.experiences];
                          updated[expIdx].role = e.target.value;
                          setResumeData({ ...resumeData, experiences: updated });
                        }}
                        placeholder="Job Title / Role"
                        className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setResumeData({
                            ...resumeData,
                            experiences: resumeData.experiences.filter((item) => item.id !== exp.id),
                          });
                        }}
                        className="text-muted-foreground hover:text-destructive p-1"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => {
                          const updated = [...resumeData.experiences];
                          updated[expIdx].company = e.target.value;
                          setResumeData({ ...resumeData, experiences: updated });
                        }}
                        placeholder="Company"
                        className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none"
                      />
                      <input
                        type="text"
                        value={exp.location}
                        onChange={(e) => {
                          const updated = [...resumeData.experiences];
                          updated[expIdx].location = e.target.value;
                          setResumeData({ ...resumeData, experiences: updated });
                        }}
                        placeholder="Location"
                        className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={exp.startDate}
                        onChange={(e) => {
                          const updated = [...resumeData.experiences];
                          updated[expIdx].startDate = e.target.value;
                          setResumeData({ ...resumeData, experiences: updated });
                        }}
                        placeholder="Start Date (e.g. 2022)"
                        className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none"
                      />
                      <input
                        type="text"
                        value={exp.endDate}
                        onChange={(e) => {
                          const updated = [...resumeData.experiences];
                          updated[expIdx].endDate = e.target.value;
                          setResumeData({ ...resumeData, experiences: updated });
                        }}
                        placeholder="End Date (or Present)"
                        className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none"
                      />
                    </div>

                    {/* Bullets */}
                    <div className="space-y-2 pt-2 border-t border-border">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-muted-foreground">
                          Accomplishment Bullets (Google XYZ Formula)
                        </label>
                      </div>

                      {exp.bullets.map((bullet, bIdx) => (
                        <div key={bIdx} className="flex items-start gap-1.5">
                          <textarea
                            rows={2}
                            value={bullet}
                            onChange={(e) => {
                              const updated = [...resumeData.experiences];
                              updated[expIdx].bullets[bIdx] = e.target.value;
                              setResumeData({ ...resumeData, experiences: updated });
                            }}
                            className="flex-1 rounded-lg border border-border bg-background p-2 text-xs text-foreground focus:outline-none"
                          />
                          <div className="flex flex-col gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEnhanceBullet(exp.id, bIdx, bullet)}
                              disabled={enhancingBulletId === `${exp.id}-${bIdx}`}
                              className="size-7 p-0 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                              title="✨ AI Enhance with Metrics & XYZ Formula"
                            >
                              {enhancingBulletId === `${exp.id}-${bIdx}` ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Sparkles className="size-3.5" />
                              )}
                            </Button>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...resumeData.experiences];
                                updated[expIdx].bullets = updated[expIdx].bullets.filter((_, i) => i !== bIdx);
                                setResumeData({ ...resumeData, experiences: updated });
                              }}
                              className="size-7 p-0 text-muted-foreground hover:text-destructive flex items-center justify-center"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}

                      <div className="flex items-center justify-between pt-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updated = [...resumeData.experiences];
                            updated[expIdx].bullets.push("Engineered and delivered core feature, accelerating workflow by 20%.");
                            setResumeData({ ...resumeData, experiences: updated });
                          }}
                          className="h-6 text-[10px] text-primary"
                        >
                          + Add Bullet Point
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleGenerateRoleBullets(exp.id, exp.role, exp.company)}
                          disabled={generatingRoleBulletsId === exp.id}
                          className="h-6 gap-1 px-2 text-[10px] font-bold text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                        >
                          <Sparkles className="size-3" />
                          <span>{generatingRoleBulletsId === exp.id ? "Generating..." : "✨ AI Generate Bullets"}</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 4. Projects Form */}
            {activeFormTab === "projects" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Featured Projects</h3>
                    <p className="text-[11px] text-muted-foreground">Highlight open-source, full-stack, and technical architecture.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsGithubModalOpen(true)}
                      className="gap-1 text-xs border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 font-semibold"
                    >
                      <FolderGit2 className="size-3.5" />
                      <span>Import from GitHub</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const newProj = {
                          id: Date.now().toString(),
                          name: "Full Stack Application",
                          technologies: "React, Node.js, PostgreSQL",
                          link: "https://github.com/username/project",
                          bullets: ["Built end-to-end full stack application with authentication and data persistence."],
                        };
                        setResumeData({
                          ...resumeData,
                          projects: [newProj, ...resumeData.projects],
                        });
                      }}
                      className="gap-1 text-xs"
                    >
                      <Plus className="size-3.5" /> Add Project
                    </Button>
                  </div>
                </div>

                {resumeData.projects.map((proj, pIdx) => (
                  <div key={proj.id} className="rounded-xl border border-border bg-section/60 p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <input
                        type="text"
                        value={proj.name}
                        onChange={(e) => {
                          const updated = [...resumeData.projects];
                          updated[pIdx].name = e.target.value;
                          setResumeData({ ...resumeData, projects: updated });
                        }}
                        placeholder="Project Name"
                        className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setResumeData({
                            ...resumeData,
                            projects: resumeData.projects.filter((item) => item.id !== proj.id),
                          });
                        }}
                        className="text-muted-foreground hover:text-destructive p-1"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={proj.technologies}
                      onChange={(e) => {
                        const updated = [...resumeData.projects];
                        updated[pIdx].technologies = e.target.value;
                        setResumeData({ ...resumeData, projects: updated });
                      }}
                      placeholder="Technologies (e.g. React, TypeScript, Node.js)"
                      className="w-full rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] text-foreground focus:outline-none"
                    />

                    <input
                      type="text"
                      value={proj.link}
                      onChange={(e) => {
                        const updated = [...resumeData.projects];
                        updated[pIdx].link = e.target.value;
                        setResumeData({ ...resumeData, projects: updated });
                      }}
                      placeholder="Project URL / GitHub"
                      className="w-full rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] text-foreground focus:outline-none"
                    />

                    {/* Project Bullets */}
                    <div className="space-y-1.5 pt-2 border-t border-border">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-semibold text-muted-foreground">
                          Project Achievements / Architecture Bullets
                        </label>
                      </div>

                      {proj.bullets.map((b, bIdx) => (
                        <div key={bIdx} className="flex items-start gap-1.5">
                          <textarea
                            rows={2}
                            value={b}
                            onChange={(e) => {
                              const updated = [...resumeData.projects];
                              updated[pIdx].bullets[bIdx] = e.target.value;
                              setResumeData({ ...resumeData, projects: updated });
                            }}
                            className="flex-1 rounded-lg border border-border bg-background p-2 text-xs text-foreground focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...resumeData.projects];
                              updated[pIdx].bullets = updated[pIdx].bullets.filter((_, i) => i !== bIdx);
                              setResumeData({ ...resumeData, projects: updated });
                            }}
                            className="size-7 p-0 text-muted-foreground hover:text-destructive flex items-center justify-center"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const updated = [...resumeData.projects];
                          updated[pIdx].bullets.push("Architected and deployed application with high reliability and performance.");
                          setResumeData({ ...resumeData, projects: updated });
                        }}
                        className="h-6 text-[10px] text-primary"
                      >
                        + Add Bullet Point
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 5. Education Form */}
            {activeFormTab === "education" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <h3 className="text-sm font-bold text-foreground">Education</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newEdu = {
                        id: Date.now().toString(),
                        degree: "B.S. in Computer Science",
                        institution: "University",
                        location: "City, Country",
                        startDate: "2020",
                        endDate: "2024",
                        score: "GPA: 3.8 / 4.0",
                      };
                      setResumeData({
                        ...resumeData,
                        education: [newEdu, ...resumeData.education],
                      });
                    }}
                    className="gap-1 text-xs"
                  >
                    <Plus className="size-3.5" /> Add Degree
                  </Button>
                </div>

                {resumeData.education.map((edu, eIdx) => (
                  <div key={edu.id} className="rounded-xl border border-border bg-section/60 p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => {
                          const updated = [...resumeData.education];
                          updated[eIdx].degree = e.target.value;
                          setResumeData({ ...resumeData, education: updated });
                        }}
                        placeholder="Degree / Major"
                        className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setResumeData({
                            ...resumeData,
                            education: resumeData.education.filter((item) => item.id !== edu.id),
                          });
                        }}
                        className="text-muted-foreground hover:text-destructive p-1"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => {
                          const updated = [...resumeData.education];
                          updated[eIdx].institution = e.target.value;
                          setResumeData({ ...resumeData, education: updated });
                        }}
                        placeholder="Institution / University"
                        className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none"
                      />
                      <input
                        type="text"
                        value={edu.location}
                        onChange={(e) => {
                          const updated = [...resumeData.education];
                          updated[eIdx].location = e.target.value;
                          setResumeData({ ...resumeData, education: updated });
                        }}
                        placeholder="Location"
                        className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={edu.startDate}
                        onChange={(e) => {
                          const updated = [...resumeData.education];
                          updated[eIdx].startDate = e.target.value;
                          setResumeData({ ...resumeData, education: updated });
                        }}
                        placeholder="Start Date"
                        className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none"
                      />
                      <input
                        type="text"
                        value={edu.endDate}
                        onChange={(e) => {
                          const updated = [...resumeData.education];
                          updated[eIdx].endDate = e.target.value;
                          setResumeData({ ...resumeData, education: updated });
                        }}
                        placeholder="End Date"
                        className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none"
                      />
                      <input
                        type="text"
                        value={edu.score}
                        onChange={(e) => {
                          const updated = [...resumeData.education];
                          updated[eIdx].score = e.target.value;
                          setResumeData({ ...resumeData, education: updated });
                        }}
                        placeholder="GPA / Honors"
                        className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 6. Skills Form */}
            {activeFormTab === "skills" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Technical Skills</h3>
                    <p className="text-[11px] text-muted-foreground">Categorized taxonomy for optimal ATS semantic parsing.</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleSuggestSkills}
                    disabled={isSuggestingSkills}
                    className="gap-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Sparkles className="size-3.5" />
                    <span>{isSuggestingSkills ? "Suggesting..." : "✨ AI Suggest Skills"}</span>
                  </Button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground">Programming Languages</label>
                  <input
                    type="text"
                    value={resumeData.skills.languages.join(", ")}
                    onChange={(e) =>
                      setResumeData({
                        ...resumeData,
                        skills: {
                          ...resumeData.skills,
                          languages: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                        },
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground">Frameworks & Libraries</label>
                  <input
                    type="text"
                    value={resumeData.skills.frameworks.join(", ")}
                    onChange={(e) =>
                      setResumeData({
                        ...resumeData,
                        skills: {
                          ...resumeData.skills,
                          frameworks: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                        },
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground">Developer Tools & Databases</label>
                  <input
                    type="text"
                    value={resumeData.skills.tools.join(", ")}
                    onChange={(e) =>
                      setResumeData({
                        ...resumeData,
                        skills: {
                          ...resumeData.skills,
                          tools: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                        },
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Live ATS Resume Canvas (7 Cols on desktop) */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          <ResumePaperCanvas
            resumeData={resumeData}
            template={template}
            onTemplateChange={setTemplate}
            atsScore={atsAudit?.overallScore}
          />
        </section>
      </main>
    </div>
  );
}
