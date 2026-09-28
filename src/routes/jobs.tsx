import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Code2,
  Cpu,
  FileCheck2,
  FileText,
  Globe,
  Link as LinkIcon,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  Trash2,
  XCircle,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppLayout } from "@/components/layout/app-layout";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase, type Job } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { analyzeJobDescriptionWithAI, type JobDecomposition } from "@/lib/ai/resume-agent";
import { scrapeJobUrlServerFn } from "@/lib/ai/job-scraper-server";

export const Route = createFileRoute("/jobs")({
  head: () => ({
    meta: [
      { title: "Job Matcher & Gap Analysis — JobMate" },
      { name: "description", content: "Deconstruct job postings with AI to extract required skills, keywords, and semantic gap radar." },
      { property: "og:title", content: "Job Matcher & Gap Analysis — JobMate" },
      { property: "og:description", content: "Real-time semantic JD deconstruction and candidate gap analysis." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: JobsPage,
});

function JobsPage() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  // Tab mode for input
  const [inputMode, setInputMode] = useState<"url" | "text">("url");
  const [jobUrlInput, setJobUrlInput] = useState("");
  const [isScrapingUrl, setIsScrapingUrl] = useState(false);

  // Form State
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Active Analysis Result
  const [selectedAnalysis, setSelectedAnalysis] = useState<{
    job: Partial<Job>;
    decomposition: JobDecomposition;
    matchScore: number;
    matchedSkills: string[];
    missingSkills: string[];
  } | null>(null);

  // Fetch Saved Jobs from Supabase
  const fetchJobs = async () => {
    if (!user) return;
    setLoadingJobs(true);
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setJobs(data as Job[]);
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchJobs();
    }
  }, [user]);

  // Compute Gap Analysis against candidate profile
  const computeMatchAndGaps = (decomposition: JobDecomposition) => {
    const candidateSkillsString = [
      profile?.headline || "",
      profile?.target_role || "",
      "TypeScript", "React", "Node.js", "Python", "SQL", "Git", "REST APIs", "Docker", "AWS", "PostgreSQL",
    ].join(" ").toLowerCase();

    const mustHaves = decomposition.mustHaveSkills || [];
    const matched: string[] = [];
    const missing: string[] = [];

    mustHaves.forEach((skill) => {
      const cleanSkill = skill.toLowerCase().trim();
      if (candidateSkillsString.includes(cleanSkill) || cleanSkill.split(" ").some((w) => candidateSkillsString.includes(w) && w.length > 2)) {
        matched.push(skill);
      } else {
        missing.push(skill);
      }
    });

    const totalSkills = Math.max(1, mustHaves.length);
    const score = Math.round((matched.length / totalSkills) * 40 + 55);
    return { score: Math.min(98, score), matched, missing };
  };

  const handleScrapeAndAnalyzeUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobUrlInput.trim()) {
      toast.error("Please enter a valid job URL.");
      return;
    }

    setIsScrapingUrl(true);
    try {
      const scraped = await scrapeJobUrlServerFn({ data: { jobUrl: jobUrlInput.trim() } });
      setJobTitle(scraped.title);
      setCompany(scraped.company);
      setJobDescription(scraped.description);
      toast.success(`Successfully fetched posting from ${scraped.company}!`);

      // Automatically run analysis
      setIsAnalyzing(true);
      const decomposition = await analyzeJobDescriptionWithAI(scraped.description, scraped.title, scraped.company);
      const { score, matched, missing } = computeMatchAndGaps(decomposition);

      // Save to Supabase
      if (user) {
        const { data: savedJob } = await supabase
          .from("jobs")
          .insert({
            user_id: user.id,
            title: scraped.title,
            company: scraped.company,
            description: scraped.description,
            url: scraped.url,
            ats_match_score: score,
            required_skills: decomposition.mustHaveSkills,
            status: "saved",
            notes: `Source: ${scraped.source.toUpperCase()}. Seniority: ${decomposition.seniorityLevel}.`,
          })
          .select()
          .single();

        if (savedJob) {
          setJobs((prev) => [savedJob as Job, ...prev]);
        }
      }

      setSelectedAnalysis({
        job: { title: scraped.title, company: scraped.company, description: scraped.description, url: scraped.url },
        decomposition,
        matchScore: score,
        matchedSkills: matched,
        missingSkills: missing,
      });
      toast.success("Job posting analyzed and gap radar generated!");
    } catch (err: any) {
      toast.error("Scraper Error: " + (err.message || "Failed to fetch job URL"));
    } finally {
      setIsScrapingUrl(false);
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeJob = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!jobDescription.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    try {
      const title = jobTitle.trim() || "Software Engineer";
      const comp = company.trim() || "Target Company";

      // 1. Invoke Semantic JD Decomposer Agent
      const decomposition = await analyzeJobDescriptionWithAI(jobDescription, title, comp);

      // 2. Compute Candidate Gap Radar
      const { score, matched, missing } = computeMatchAndGaps(decomposition);

      // 3. Save to Supabase
      if (user) {
        const { data: savedJob, error } = await supabase
          .from("jobs")
          .insert({
            user_id: user.id,
            title,
            company: comp,
            description: jobDescription,
            ats_match_score: score,
            required_skills: decomposition.mustHaveSkills,
            status: "saved",
            notes: `Seniority: ${decomposition.seniorityLevel}. Focus: ${decomposition.coreResponsibilities.slice(0, 2).join("; ")}`,
          })
          .select()
          .single();

        if (savedJob) {
          setJobs((prev) => [savedJob as Job, ...prev]);
        }
      }

      setSelectedAnalysis({
        job: { title, company: comp, description: jobDescription },
        decomposition,
        matchScore: score,
        matchedSkills: matched,
        missingSkills: missing,
      });

      toast.success("Job description successfully deconstructed!");
    } catch (err: any) {
      console.error("Job analysis error:", err);
      toast.error("Failed to analyze job description. Please check your network and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      await supabase.from("jobs").delete().eq("id", jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      if (selectedAnalysis?.job?.id === jobId) {
        setSelectedAnalysis(null);
      }
      toast.success("Job posting removed.");
    } catch (err) {
      toast.error("Failed to delete job.");
    }
  };

  const handleTailorInBuilder = (jobData: { title?: string; company?: string; description?: string }) => {
    sessionStorage.setItem("jobmate_target_jd", JSON.stringify(jobData));
    router.navigate({ to: "/builder" });
  };

  return (
    <AppLayout activeNav="jobs">
      <div className="space-y-8">
        {/* Header */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                <Cpu className="size-3.5" />
                Semantic JD Decomposer & 1-Click Scraper
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Job Matcher & Gap Analysis
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Paste a public job link or text to extract hard requirements, keywords, and benchmark your candidate evidence.
              </p>
            </div>
          </div>
        </div>

        {/* Two-Column Grid: Left Input / Right Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form & History (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Input Card */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Target className="size-4 text-indigo-600" />
                  Target Job Input
                </h2>

                {/* Mode Selector */}
                <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setInputMode("url")}
                    className={cn(
                      "px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1",
                      inputMode === "url"
                        ? "bg-white dark:bg-slate-950 text-indigo-600 shadow-xs font-bold"
                        : "text-slate-600 dark:text-slate-400"
                    )}
                  >
                    <Globe className="size-3" /> 1-Click URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode("text")}
                    className={cn(
                      "px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1",
                      inputMode === "text"
                        ? "bg-white dark:bg-slate-950 text-indigo-600 shadow-xs font-bold"
                        : "text-slate-600 dark:text-slate-400"
                    )}
                  >
                    <FileText className="size-3" /> Manual Text
                  </button>
                </div>
              </div>

              {inputMode === "url" ? (
                /* 1-Click Scraper Form */
                <form onSubmit={handleScrapeAndAnalyzeUrl} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Public Job Posting URL
                    </label>
                    <div className="relative">
                      <LinkIcon className="size-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="url"
                        required
                        value={jobUrlInput}
                        onChange={(e) => setJobUrlInput(e.target.value)}
                        placeholder="https://boards.greenhouse.io/... or lever.co, linkedin.com, ashbyhq.com"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Supported:</span>
                    {["Greenhouse", "Lever", "LinkedIn", "Indeed", "Ashby", "Workday"].map((portal) => (
                      <span
                        key={portal}
                        className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 border border-slate-200 dark:border-slate-700"
                      >
                        {portal}
                      </span>
                    ))}
                  </div>

                  <Button
                    type="submit"
                    disabled={isScrapingUrl || isAnalyzing || !jobUrlInput.trim()}
                    className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-button text-xs py-2.5"
                  >
                    {isScrapingUrl || isAnalyzing ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Scraping & Running Multi-Agent Gap Radar...
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-4" />
                        Fetch & Deconstruct Job
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                /* Manual Text Form */
                <form onSubmit={handleAnalyzeJob} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Job Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Senior AI Engineer"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Company</label>
                      <input
                        type="text"
                        placeholder="e.g. Stripe, OpenAI"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Full Job Description <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={7}
                      required
                      placeholder="Paste the full job posting requirements, responsibilities, and qualifications here..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none resize-none leading-relaxed"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isAnalyzing || !jobDescription.trim()}
                    className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-button text-xs py-2.5"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Deconstructing JD with Multi-Agent DAG...
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-4" />
                        Deconstruct & Run Gap Radar
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>

            {/* Saved Jobs List */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Briefcase className="size-4 text-indigo-600" />
                  Saved Target Roles ({jobs.length})
                </h3>
                <Button variant="ghost" size="sm" onClick={fetchJobs} className="size-7 p-0">
                  <RefreshCw className="size-3.5 text-slate-500" />
                </Button>
              </div>

              {loadingJobs ? (
                <div className="py-8 text-center">
                  <Loader2 className="size-6 animate-spin text-indigo-600 mx-auto" />
                </div>
              ) : jobs.length === 0 ? (
                <div className="py-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-4">
                  <FileText className="size-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No analyzed jobs saved yet. Paste a JD above to begin.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                  {jobs.map((j) => (
                    <div
                      key={j.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950 p-3 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all cursor-pointer group"
                      onClick={() => {
                        setJobTitle(j.title);
                        setCompany(j.company || "");
                        setJobDescription(j.description || "");
                      }}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                            {j.title}
                          </p>
                          {j.ats_match_score && (
                            <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50">
                              {j.ats_match_score}%
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{j.company || "Company"}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteJob(j.id);
                          }}
                          className="size-7 p-0 text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Deep Decomposition & Gap Radar (7 cols) */}
          <div className="lg:col-span-7">
            {selectedAnalysis ? (
              <div className="space-y-6">
                {/* Score & Summary Banner */}
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {selectedAnalysis.job.title}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <Building2 className="size-3.5" />
                        {selectedAnalysis.job.company} &bull; Seniority: {selectedAnalysis.decomposition.seniorityLevel}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-[10px] font-semibold uppercase text-slate-400">Match Potential</p>
                        <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                          {selectedAnalysis.matchScore}%
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleTailorInBuilder(selectedAnalysis.job)}
                        className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs shadow-button"
                      >
                        <Sparkles className="size-3.5" />
                        Tailor Resume
                      </Button>
                    </div>
                  </div>

                  {/* Skills Gap Matrix */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {/* Matched Skills */}
                    <div className="rounded-xl border border-emerald-100 dark:border-emerald-950/80 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="size-4" />
                        Matched Candidate Skills ({selectedAnalysis.matchedSkills.length})
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedAnalysis.matchedSkills.length > 0 ? (
                          selectedAnalysis.matchedSkills.map((s, i) => (
                            <span
                              key={i}
                              className="text-[11px] font-medium bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800"
                            >
                              {s}
                            </span>
                          ))
                        ) : (
                          <p className="text-xs text-emerald-600/70">No direct keyword overlap found.</p>
                        )}
                      </div>
                    </div>

                    {/* Missing Skills */}
                    <div className="rounded-xl border border-amber-100 dark:border-amber-950/80 bg-amber-50/40 dark:bg-amber-950/20 p-4 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                        <XCircle className="size-4" />
                        Identified Skill Gaps ({selectedAnalysis.missingSkills.length})
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedAnalysis.missingSkills.length > 0 ? (
                          selectedAnalysis.missingSkills.map((s, i) => (
                            <span
                              key={i}
                              className="text-[11px] font-medium bg-white dark:bg-slate-900 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800"
                            >
                              {s}
                            </span>
                          ))
                        ) : (
                          <p className="text-xs text-amber-600/70">No critical skill gaps detected!</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Core Responsibilities & Impact Keyphrases */}
                <div className="grid grid-cols-1 gap-6">
                  {/* Responsibilities */}
                  <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-3">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileCheck2 className="size-4 text-indigo-600" />
                      Key Responsibilities & Scope
                    </h3>
                    <ul className="space-y-2">
                      {selectedAnalysis.decomposition.coreResponsibilities.map((resp, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          <span className="size-1.5 rounded-full bg-indigo-600 shrink-0 mt-1.5" />
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Impact Action Verbs */}
                  <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-3">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Zap className="size-4 text-indigo-600" />
                      High-Yield ATS Keywords & Action Verbs
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedAnalysis.decomposition.impactKeywords.map((kw, i) => (
                        <span
                          key={i}
                          className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-12 text-center shadow-sm space-y-4">
                <div className="grid size-14 place-items-center rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 mx-auto">
                  <Target className="size-7" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    No Job Analyzed Yet
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Paste a job posting URL or text on the left to extract skill taxonomies, ATS keywords, and candidate alignment.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
