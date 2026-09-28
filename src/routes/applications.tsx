import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  DollarSign,
  ExternalLink,
  Filter,
  Loader2,
  Mail,
  MessageSquare,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppLayout } from "@/components/layout/app-layout";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase, type Job } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import {
  generateOutreachPackage,
  type OutreachGenerationResult,
} from "@/lib/ai/agents/outreach-agent";

export const Route = createFileRoute("/applications")({
  head: () => ({
    meta: [
      { title: "Application Pipeline Tracker — JobMate" },
      { name: "description", content: "Track your job applications, interview stages, and offers with real-time status updates and AI cold outreach." },
      { property: "og:title", content: "Application Pipeline Tracker — JobMate" },
      { property: "og:description", content: "Manage your active job pipeline from Saved to Offer with Cold Outreach AI." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ApplicationsPage,
});

type ApplicationStatus = "saved" | "applied" | "interviewing" | "offer" | "rejected";

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; bg: string; border: string }> = {
  saved: {
    label: "Saved",
    color: "text-slate-700 dark:text-slate-300",
    bg: "bg-slate-100 dark:bg-slate-800",
    border: "border-slate-200 dark:border-slate-700",
  },
  applied: {
    label: "Applied",
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/60",
    border: "border-blue-200 dark:border-blue-800",
  },
  interviewing: {
    label: "Interviewing",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/60",
    border: "border-amber-200 dark:border-amber-800",
  },
  offer: {
    label: "Offer Received",
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/60",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  rejected: {
    label: "Archived / Rejected",
    color: "text-rose-700 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/60",
    border: "border-rose-200 dark:border-rose-800",
  },
};

function ApplicationsPage() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // New Application Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newSalary, setNewSalary] = useState("");
  const [newStatus, setNewStatus] = useState<ApplicationStatus>("applied");
  const [newNotes, setNewNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Cold Outreach Modal State
  const [isOutreachModalOpen, setIsOutreachModalOpen] = useState(false);
  const [activeOutreachJob, setActiveOutreachJob] = useState<Job | null>(null);
  const [hiringManagerName, setHiringManagerName] = useState("");
  const [isGeneratingOutreach, setIsGeneratingOutreach] = useState(false);
  const [outreachResult, setOutreachResult] = useState<OutreachGenerationResult | null>(null);
  const [outreachTab, setOutreachTab] = useState<"email" | "linkedin" | "followup">("email");
  const [copiedState, setCopiedState] = useState<string | null>(null);

  // Fetch Applications from Supabase
  const fetchApplications = async () => {
    if (!user) return;
    setLoading(true);
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
      console.error("Error fetching applications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchApplications();
    }
  }, [user]);

  // Update Status
  const handleUpdateStatus = async (jobId: string, status: ApplicationStatus) => {
    try {
      const { error } = await supabase
        .from("jobs")
        .update({ status })
        .eq("id", jobId);

      if (error) throw error;

      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status } : j))
      );
      toast.success(`Application updated to ${STATUS_CONFIG[status].label}`);
    } catch (err) {
      toast.error("Failed to update status.");
    }
  };

  // Delete Application
  const handleDelete = async (jobId: string) => {
    try {
      await supabase.from("jobs").delete().eq("id", jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      toast.success("Application removed from pipeline.");
    } catch (err) {
      toast.error("Failed to delete application.");
    }
  };

  // Create Application
  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTitle.trim() || !newCompany.trim()) {
      toast.error("Please provide both job title and company.");
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("jobs")
        .insert({
          user_id: user.id,
          title: newTitle.trim(),
          company: newCompany.trim(),
          url: newUrl.trim() || null,
          salary_range: newSalary.trim() || null,
          status: newStatus,
          notes: newNotes.trim() || null,
          ats_match_score: 90,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setJobs((prev) => [data as Job, ...prev]);
        toast.success("Application successfully added!");
        setIsAddModalOpen(false);
        setNewTitle("");
        setNewCompany("");
        setNewUrl("");
        setNewSalary("");
        setNewNotes("");
      }
    } catch (err) {
      toast.error("Failed to create application.");
    } finally {
      setSaving(false);
    }
  };

  // Open Cold Outreach Modal
  const handleOpenOutreach = (job: Job) => {
    setActiveOutreachJob(job);
    setHiringManagerName("");
    setOutreachResult(null);
    setIsOutreachModalOpen(true);
  };

  const handleGenerateOutreach = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeOutreachJob) return;

    setIsGeneratingOutreach(true);
    try {
      const result = await generateOutreachPackage({
        jobTitle: activeOutreachJob.title,
        company: activeOutreachJob.company || "the company",
        jobDescription: activeOutreachJob.description || undefined,
        candidateName: profile?.full_name || "Applicant",
        candidateHeadline: profile?.headline || profile?.target_role || "Senior Software Engineer",
        candidateTopProjects: ["Autonomous Agent Workflow Engine", "High-throughput Distributed Pipeline"],
        hiringManagerName: hiringManagerName.trim() || undefined,
      });

      setOutreachResult(result);
      toast.success("Outreach messages generated with high-conversion frameworks!");
    } catch (err: any) {
      toast.error("Failed to generate outreach: " + err.message);
    } finally {
      setIsGeneratingOutreach(false);
    }
  };

  const handleCopyText = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedState(type);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedState(null), 2000);
  };

  // Filtered List
  const filteredJobs = jobs.filter((j) => {
    const matchesFilter = statusFilter === "all" || j.status === statusFilter;
    const matchesSearch =
      searchQuery.trim() === "" ||
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (j.company && j.company.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // Pipeline Counts
  const totalCount = jobs.length;
  const appliedCount = jobs.filter((j) => j.status === "applied").length;
  const interviewCount = jobs.filter((j) => j.status === "interviewing").length;
  const offerCount = jobs.filter((j) => j.status === "offer").length;

  return (
    <AppLayout activeNav="applications">
      <div className="space-y-8">
        {/* Header */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                <TrendingUp className="size-3.5" />
                Live Application Pipeline & Outreach Agent
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Application Tracker
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Track your active job pipeline and generate AI cold emails & hiring manager DMs in 1 click.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-button text-xs"
              >
                <Plus className="size-4" />
                Add Application
              </Button>
            </div>
          </div>

          {/* Pipeline Stats Bar */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-6">
            <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
              <p className="text-xs font-medium text-slate-500">Total Tracked</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalCount}</p>
            </div>
            <div className="rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 p-4">
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Applied</p>
              <p className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-1">{appliedCount}</p>
            </div>
            <div className="rounded-xl border border-amber-100 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 p-4">
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Interviewing</p>
              <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">{interviewCount}</p>
            </div>
            <div className="rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 p-4">
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Offers</p>
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{offerCount}</p>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: "all", label: "All Roles" },
              { id: "saved", label: "Saved" },
              { id: "applied", label: "Applied" },
              { id: "interviewing", label: "Interviewing" },
              { id: "offer", label: "Offers" },
              { id: "rejected", label: "Archived" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                  statusFilter === tab.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 size-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by role or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Application Cards / Table */}
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="size-8 animate-spin text-indigo-600 mx-auto" />
            <p className="text-xs text-slate-500 mt-2">Loading pipeline...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-12 text-center shadow-sm space-y-4">
            <div className="grid size-12 place-items-center rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 mx-auto">
              <Briefcase className="size-6" />
            </div>
            <div className="max-w-sm mx-auto space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No Applications Found
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {searchQuery || statusFilter !== "all"
                  ? "No applications matched your filter criteria."
                  : "Track your job hunt pipeline by adding your target roles and applications."}
              </p>
            </div>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
            >
              <Plus className="size-3.5" />
              Add First Application
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredJobs.map((job) => {
              const currentStatus = (job.status as ApplicationStatus) || "applied";
              const cfg = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.applied;

              return (
                <div
                  key={job.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all group"
                >
                  {/* Role & Company Details */}
                  <div className="space-y-1 min-w-0 max-w-lg">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {job.title}
                      </h3>
                      {job.ats_match_score && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50">
                          {job.ats_match_score}% ATS
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                        <Building2 className="size-3.5 text-slate-400" />
                        {job.company || "Target Company"}
                      </span>
                      {job.salary_range && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <DollarSign className="size-3.5 text-slate-400" />
                          {job.salary_range}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-slate-400">
                        <Calendar className="size-3.5" />
                        {job.created_at ? new Date(job.created_at).toLocaleDateString() : "Recent"}
                      </span>
                    </div>
                    {job.notes && (
                      <p className="text-xs text-slate-500 line-clamp-1 italic mt-1">
                        "{job.notes}"
                      </p>
                    )}
                  </div>

                  {/* Right Actions & Status Selector */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    {/* Cold Outreach AI Button */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenOutreach(job)}
                      className="gap-1.5 text-xs border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 font-semibold"
                      title="Generate Cold Email & LinkedIn InMail with AI"
                    >
                      <Mail className="size-3.5" />
                      <span>Cold Outreach</span>
                    </Button>

                    {/* Status Dropdown */}
                    <select
                      value={job.status || "applied"}
                      onChange={(e) => handleUpdateStatus(job.id, e.target.value as ApplicationStatus)}
                      className={cn(
                        "rounded-xl border px-3 py-1.5 text-xs font-semibold focus:outline-none cursor-pointer",
                        cfg.bg,
                        cfg.color,
                        cfg.border
                      )}
                    >
                      <option value="saved">Saved</option>
                      <option value="applied">Applied</option>
                      <option value="interviewing">Interviewing</option>
                      <option value="offer">Offer Received</option>
                      <option value="rejected">Archived / Rejected</option>
                    </select>

                    {/* Tailor Resume Action */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        sessionStorage.setItem(
                          "jobmate_target_jd",
                          JSON.stringify({ title: job.title, company: job.company, description: job.description })
                        );
                        router.navigate({ to: "/builder" });
                      }}
                      className="gap-1.5 text-xs"
                    >
                      <Sparkles className="size-3.5 text-indigo-600" />
                      Tailor
                    </Button>

                    {/* Delete */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(job.id)}
                      className="size-8 p-0 text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cold Outreach Modal */}
      {isOutreachModalOpen && activeOutreachJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-background p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-white shadow-button">
                  <Mail className="size-5" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-foreground">
                    Cold Outreach & Hiring Manager DM Generator
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Generate high-converting cold emails (&lt;120 words), LinkedIn notes (&lt;300 chars), and follow-ups.
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOutreachModalOpen(false)}
                className="size-8 p-0 text-muted-foreground"
              >
                ✕
              </Button>
            </div>

            {/* Target Job Info & Hiring Manager Name Input */}
            <div className="rounded-xl border border-border bg-muted/40 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <strong className="text-foreground">{activeOutreachJob.title}</strong>
                <span className="text-muted-foreground"> at {activeOutreachJob.company || "Target Company"}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={hiringManagerName}
                  onChange={(e) => setHiringManagerName(e.target.value)}
                  placeholder="Hiring Manager Name (Optional)"
                  className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none w-48"
                />
                <Button
                  size="sm"
                  onClick={() => handleGenerateOutreach()}
                  disabled={isGeneratingOutreach}
                  className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  {isGeneratingOutreach ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="size-3.5" />
                  )}
                  <span>{isGeneratingOutreach ? "Generating..." : "Generate AI Outreach"}</span>
                </Button>
              </div>
            </div>

            {/* Outreach Output Tabs */}
            {outreachResult && (
              <div className="space-y-4 pt-1 animate-in fade-in-50">
                <div className="flex rounded-xl bg-muted/50 p-1 border border-border text-xs">
                  {[
                    { id: "email", label: "Cold Email (<120w)", icon: Mail },
                    { id: "linkedin", label: "LinkedIn DM (<300ch)", icon: MessageSquare },
                    { id: "followup", label: "Interview Follow-Up", icon: Send },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = outreachTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setOutreachTab(tab.id as any)}
                        className={cn(
                          "flex flex-1 items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold transition-all",
                          isActive
                            ? "bg-background text-foreground shadow-xs font-extrabold border border-border"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Icon className="size-3.5 text-primary" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Tab 1: Cold Email */}
                {outreachTab === "email" && (
                  <div className="space-y-3 rounded-xl border border-border bg-card p-4 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">Subject:</span>
                        <span className="font-semibold text-primary">{outreachResult.coldEmail.subject}</span>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {outreachResult.coldEmail.wordCount} words
                      </span>
                    </div>

                    <textarea
                      rows={6}
                      value={outreachResult.coldEmail.body}
                      onChange={(e) =>
                        setOutreachResult({
                          ...outreachResult,
                          coldEmail: { ...outreachResult.coldEmail, body: e.target.value },
                        })
                      }
                      className="w-full rounded-lg border border-border bg-background p-3 text-xs leading-relaxed text-foreground focus:outline-none resize-none font-sans"
                    />

                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={() =>
                          handleCopyText(
                            `Subject: ${outreachResult.coldEmail.subject}\n\n${outreachResult.coldEmail.body}`,
                            "email"
                          )
                        }
                        className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        {copiedState === "email" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                        <span>{copiedState === "email" ? "Copied" : "Copy Subject & Body"}</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Tab 2: LinkedIn Note */}
                {outreachTab === "linkedin" && (
                  <div className="space-y-3 rounded-xl border border-border bg-card p-4 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                      <span className="font-bold text-foreground">LinkedIn Connection Invitation Note</span>
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {outreachResult.linkedinNote.charCount} / 300 chars
                      </span>
                    </div>

                    <textarea
                      rows={4}
                      value={outreachResult.linkedinNote.message}
                      onChange={(e) =>
                        setOutreachResult({
                          ...outreachResult,
                          linkedinNote: { ...outreachResult.linkedinNote, message: e.target.value },
                        })
                      }
                      className="w-full rounded-lg border border-border bg-background p-3 text-xs leading-relaxed text-foreground focus:outline-none resize-none font-sans"
                    />

                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => handleCopyText(outreachResult.linkedinNote.message, "linkedin")}
                        className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        {copiedState === "linkedin" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                        <span>{copiedState === "linkedin" ? "Copied" : "Copy LinkedIn Note"}</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Tab 3: Follow-Up */}
                {outreachTab === "followup" && (
                  <div className="space-y-3 rounded-xl border border-border bg-card p-4 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">Subject:</span>
                        <span className="font-semibold text-primary">{outreachResult.interviewFollowUp.subject}</span>
                      </div>
                    </div>

                    <textarea
                      rows={6}
                      value={outreachResult.interviewFollowUp.body}
                      onChange={(e) =>
                        setOutreachResult({
                          ...outreachResult,
                          interviewFollowUp: { ...outreachResult.interviewFollowUp, body: e.target.value },
                        })
                      }
                      className="w-full rounded-lg border border-border bg-background p-3 text-xs leading-relaxed text-foreground focus:outline-none resize-none font-sans"
                    />

                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={() =>
                          handleCopyText(
                            `Subject: ${outreachResult.interviewFollowUp.subject}\n\n${outreachResult.interviewFollowUp.body}`,
                            "followup"
                          )
                        }
                        className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        {copiedState === "followup" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                        <span>{copiedState === "followup" ? "Copied" : "Copy Follow-Up"}</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Application Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="size-5 text-indigo-600" />
              Add Job Application
            </h3>

            <form onSubmit={handleCreateApplication} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Role Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lead Systems Engineer"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Company Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stripe"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Salary / Compensation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. $160,000 - $190,000"
                    value={newSalary}
                    onChange={(e) => setNewSalary(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Initial Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as ApplicationStatus)}
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="saved">Saved</option>
                    <option value="applied">Applied</option>
                    <option value="interviewing">Interviewing</option>
                    <option value="offer">Offer Received</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Job Posting URL
                </label>
                <input
                  type="url"
                  placeholder="https://jobs.lever.co/..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Notes & Interview Intel
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Recruiter screened on Monday. System design interview scheduled for Friday."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                >
                  {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                  Save Application
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
