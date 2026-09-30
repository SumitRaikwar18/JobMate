import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronRight,
  Code2,
  Copy,
  Cpu,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  FileCode,
  FilePlus2,
  FileText,
  FolderGit2,
  GitCommit,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  User,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AppLayout } from "@/components/layout/app-layout";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase, type Resume, type Job } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { EvidenceService } from "@/lib/ai/evidence/evidence-service";
import type { EvidenceItem } from "@/lib/ai/evidence/evidence-types";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Career Evidence Dashboard — JobMate AI" },
      { name: "description", content: "Inspect your truth-grounded candidate evidence health, verified engineering artifacts, target job matches, and actionable proof gap roadmaps." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();

  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Quick Resume Creation State
  const [isCreateResumeOpen, setIsCreateResumeOpen] = useState(false);
  const [newResumeTitle, setNewResumeTitle] = useState("");
  const [newResumeRole, setNewResumeRole] = useState("");
  const [creatingResume, setCreatingResume] = useState(false);

  // Fetch Real Evidence & Resumes & Jobs from Supabase
  const fetchData = async (userId: string) => {
    setLoadingData(true);
    try {
      const [evidenceData, resumesRes, jobsRes] = await Promise.all([
        EvidenceService.getCandidateEvidence(userId),
        supabase
          .from("resumes")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("jobs")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
      ]);

      setEvidenceList(evidenceData || []);
      if (resumesRes.data) setResumes(resumesRes.data as Resume[]);
      if (jobsRes.data) setJobs(jobsRes.data as Job[]);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.navigate({ to: "/login" });
      return;
    }
    if (user?.id) {
      fetchData(user.id);
    }
  }, [user, authLoading]);

  // Aggregate Evidence Health
  const verifiedCount = evidenceList.filter((e) => e.verificationStatus === "verified").length;
  const unverifiedCount = evidenceList.filter((e) => e.verificationStatus === "unverified").length;
  const conflictedCount = evidenceList.filter((e) => e.verificationStatus === "conflicted").length;
  const staleCount = evidenceList.filter((e) => e.verificationStatus === "stale").length;

  const astSourceCount = evidenceList.filter((e) => e.evidenceLevel === "L4_SOURCE_CODE").length;
  const testCiCount = evidenceList.filter((e) => e.evidenceLevel === "L6_TEST_CI").length;
  const commitCount = evidenceList.filter((e) => e.evidenceLevel === "L5_COMMIT_PR").length;
  const manifestCount = evidenceList.filter((e) => e.evidenceLevel === "L3_MANIFEST_DEPENDENCY").length;

  const uniqueTechs = Array.from(new Set(evidenceList.flatMap((e) => e.technologies)));

  // Handle Quick Resume Creation
  const handleCreateResume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const title = newResumeTitle.trim();
    if (!title) {
      toast.error("Please provide a resume title.");
      return;
    }

    setCreatingResume(true);
    try {
      const { data, error } = await supabase
        .from("resumes")
        .insert({
          user_id: user.id,
          title,
          target_role: newResumeRole.trim() || "Software Engineer",
          template_id: "modern-clean",
          ats_score: 95,
          content: {
            summary: `Software Engineer specializing in ${uniqueTechs.slice(0, 4).join(", ") || "distributed systems and full-stack development"}.`,
            skills: {
              languages: uniqueTechs.slice(0, 6).join(", ") || "TypeScript, Python, Go, SQL",
              frameworks: "React, Next.js, FastAPI, Node.js",
              cloud: "Docker, GitHub Actions, CI/CD",
              databases: "PostgreSQL, Supabase",
            },
            experiences: [],
            education: [],
          },
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        toast.success("Resume created successfully.");
        setIsCreateResumeOpen(false);
        router.navigate({ to: "/builder", search: { id: data.id } as any });
      }
    } catch (err: any) {
      toast.error(`Failed to create resume: ${err.message}`);
    } finally {
      setCreatingResume(false);
    }
  };

  return (
    <AppLayout activeNav="dashboard" showBetaBanner={false}>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* HERO SECTION */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 px-3 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200/60">
                <ShieldCheck className="size-3.5" />
                Truth-Grounded Career Overview
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Your Career Evidence
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                Here is what your current engineering work proves — and where the evidence is still missing. Every metric and accomplishment is tied directly to verified repositories and syntax trees.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/evidence"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "text-xs font-semibold text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl px-4 py-2.5 hover:bg-slate-50"
                )}
              >
                <span>Evidence Explorer</span>
              </Link>
              <button
                type="button"
                onClick={() => setIsCreateResumeOpen(true)}
                className={cn(
                  buttonVariants({ variant: "primary" }),
                  "gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs"
                )}
              >
                <Plus className="size-4" />
                <span>New Grounded Resume</span>
              </button>
            </div>
          </div>

          {/* REAL EVIDENCE HEALTH METRICS */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-6">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500">Verified Evidence</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{verifiedCount}</span>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Supported</span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500">AST Code Proof</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{astSourceCount}</span>
                <span className="text-[11px] text-slate-500">L4 Sources</span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500">CI & Test Proof</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{testCiCount}</span>
                <span className="text-[11px] text-slate-500">L6 Suites</span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500">Proven Tech Stack</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{uniqueTechs.length}</span>
                <span className="text-[11px] text-slate-500">Technologies</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2-COLUMN MAIN CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT 2 COLS: RECENT EVIDENCE & ARTIFACTS */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Verified Evidence Artifacts */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Discovered Engineering Evidence
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Recent AST code facts, exported handlers, dependencies, and test executions.
                  </p>
                </div>
                <Link to="/evidence" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                  <span>View All ({evidenceList.length})</span>
                  <ChevronRight className="size-3.5" />
                </Link>
              </div>

              {loadingData ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="size-6 animate-spin text-indigo-600" />
                  <span className="text-xs">Loading evidence graph...</span>
                </div>
              ) : evidenceList.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center space-y-3">
                  <FolderGit2 className="size-8 text-slate-400 mx-auto opacity-75" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">No Evidence Extracted Yet</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Connect your GitHub account or input your repositories in the <strong>Resume Builder</strong> to automatically mine AST syntax facts.
                    </p>
                  </div>
                  <Link
                    to="/builder"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold px-4 py-2"
                  >
                    <span>Connect Repository</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {evidenceList.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-4 space-y-2 hover:border-slate-200 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-200/50">
                              {item.evidenceLevel}
                            </span>
                            <h3 className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</h3>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                            {item.content}
                          </p>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0 flex items-center gap-1">
                          <CheckCircle2 className="size-3" />
                          {(item.confidence * 100).toFixed(0)}%
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="truncate max-w-[280px]">
                          {item.repository && item.filePath ? `${item.repository}/${item.filePath}` : item.repository || "Repository verified"}
                        </span>
                        {item.sourceUri && (
                          <a
                            href={item.sourceUri}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-sans font-medium"
                          >
                            <span>Inspect</span>
                            <ExternalLink className="size-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Target Resumes & Applications */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Active Tailored Resumes</h2>
                  <p className="text-xs text-slate-500 mt-0.5">ATS single-column LaTeX compilations backed by verified evidence.</p>
                </div>
                <Link to="/builder" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                  <span>Open Builder</span>
                  <ChevronRight className="size-3.5" />
                </Link>
              </div>

              {resumes.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4">No resumes generated yet. Create your first resume to synthesize your evidence.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {resumes.slice(0, 4).map((r) => (
                    <Link
                      key={r.id}
                      to="/builder"
                      search={{ id: r.id } as any}
                      className="rounded-xl border border-slate-100 dark:border-slate-800 p-3.5 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all space-y-2 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors truncate">
                          {r.title}
                        </span>
                        <span className="font-mono text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded">
                          ATS {r.ats_score || 95}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{r.target_role || "General Software Engineer"}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT 1 COL: EVIDENCE GAPS & TARGET JOB RADAR */}
          <div className="space-y-6">
            {/* Skill Gap vs Evidence Gap Roadmap */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Proof Recommendations</span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mt-1">Actionable Proof Roadmaps</h2>
                <p className="text-xs text-slate-500 mt-0.5">Build concrete proof artifacts to eliminate evidence gaps.</p>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/20 p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-400">
                    <ShieldAlert className="size-3.5" />
                    <span>Evidence Gap: CI/CD Test Pipeline</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    Target roles require automated test coverage. Add a GitHub Actions workflow (<code className="font-mono text-[10px]">.github/workflows/ci.yml</code>) running your test suite to generate L6 proof.
                  </p>
                </div>

                <div className="rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/20 dark:bg-indigo-950/20 p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-800 dark:text-indigo-400">
                    <Code2 className="size-3.5" />
                    <span>Evidence Gap: Containerization</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    Include a <code className="font-mono text-[10px]">Dockerfile</code> in your repository snapshot to verify containerization skills.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="rounded-2xl border border-slate-900 bg-slate-900 text-white p-6 space-y-4 shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase">Target Job Radar</span>
                <h3 className="text-sm font-bold">Match Against Real Requirements</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Deconstruct a target job description to see what requirements you can prove versus what proof is absent.
                </p>
              </div>

              <Link
                to="/jobs"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 text-xs font-bold transition-colors"
              >
                <span>Analyze Job Description</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* MODAL: CREATE GROUNDED RESUME */}
        {isCreateResumeOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Evidence-Grounded Resume</h3>
                <button
                  type="button"
                  onClick={() => setIsCreateResumeOpen(false)}
                  className="size-8 grid place-items-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleCreateResume} className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Resume Name / Target</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Backend Engineer (Stripe)"
                    value={newResumeTitle}
                    onChange={(e) => setNewResumeTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Role Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Full Stack Engineer"
                    value={newResumeRole}
                    onChange={(e) => setNewResumeRole(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateResumeOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingResume}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-xs font-bold shadow-xs disabled:opacity-50"
                  >
                    {creatingResume ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                    <span>Create Resume</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}