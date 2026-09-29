import { createFileRoute } from "@tanstack/react-router";
import {
  Bot,
  Check,
  Code2,
  Copy,
  ExternalLink,
  KeyRound,
  Layers,
  Loader2,
  Lock,
  QrCode,
  Save,
  Send,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppLayout } from "@/components/layout/app-layout";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase, type UserProfile } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Account & Profile Settings — JobMate" },
      { name: "description", content: "Manage your candidate ground-truth profile, Telegram bot pairing, and AI settings." },
      { property: "og:title", content: "Account & Profile Settings — JobMate" },
      { property: "og:description", content: "Ground-truth candidate profile and integrations." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();

  // Profile Form State
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [yearsOfExp, setYearsOfExp] = useState<number | "">("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [telegramHandle, setTelegramHandle] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Sync profile when loaded
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setHeadline(profile.headline || "");
      setTargetRole(profile.target_role || "");
      setYearsOfExp(profile.years_of_experience ?? "");
      setGithubUrl(profile.github_url || "");
      setLinkedinUrl(profile.linkedin_url || "");
      setTelegramHandle(profile.telegram_handle || "");
    }
  }, [profile]);

  // Handle Save Profile to Supabase
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSavingProfile(true);
    try {
      const payload: Partial<UserProfile> = {
        id: user.id,
        full_name: fullName.trim(),
        headline: headline.trim() || null,
        target_role: targetRole.trim() || null,
        years_of_experience: yearsOfExp === "" ? null : Number(yearsOfExp),
        github_url: githubUrl.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
        telegram_handle: telegramHandle.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("profiles").upsert(payload);
      if (error) throw error;

      await refreshProfile();
      toast.success("Ground-truth candidate profile saved!");
    } catch (err: any) {
      console.error("Error updating profile:", err);
      toast.error(err?.message || "Failed to save profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const telegramPairingCode = user?.id ? `/link ${user.id.substring(0, 8)}` : "/link demo123";

  const handleCopyPairingCode = () => {
    navigator.clipboard.writeText(telegramPairingCode);
    setCopiedCode(true);
    toast.success("Pairing command copied!");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <AppLayout activeNav="settings">
      <div className="space-y-8 max-w-4xl">
        {/* Header */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-sm">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
              <ShieldCheck className="size-3.5" />
              Candidate Ground Truth
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Profile & Integration Settings
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Your candidate profile acts as the verified ground-truth evidence bank for all AI-generated resumes and ATS tailoring.
            </p>
          </div>
        </div>

        {/* Profile Information Card */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="size-4 text-indigo-600" />
              Ground-Truth Candidate Profile
            </h2>
            <span className="text-xs text-slate-500">
              Supabase RLS Protected
            </span>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Mercer"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Primary Email
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || "candidate@example.com"}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 px-3 py-2 text-xs text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Target Role
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Backend / Distributed Systems Engineer"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Years of Experience
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  placeholder="e.g. 5"
                  value={yearsOfExp}
                  onChange={(e) => setYearsOfExp(e.target.value ? Number(e.target.value) : "")}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Professional Headline / Executive Summary
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Senior Software Engineer specializing in high-throughput Go and Rust distributed systems with 6+ years delivering cloud infrastructure."
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Social & Portfolio Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  GitHub Profile URL
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/username"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  LinkedIn Profile URL
                </label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={savingProfile}
                className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-button text-xs"
              >
                {savingProfile ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                Save Ground Truth Profile
              </Button>
            </div>
          </form>
        </div>

        {/* Evidence Grounding & Provenance Configuration */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="size-4 text-indigo-600" />
              Evidence Grounding & Verification Configuration
            </h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
              <Sparkles className="size-3" />
              Strict Grounding Mode
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            JobMate strictly validates all generated resume bullets and metrics against your ground-truth candidate evidence and GitHub projects. Unsupported claims are rejected automatically.
          </p>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Candidate Evidence Scoping
              </p>
              <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400 mt-0.5 font-bold">
                {user?.id ? `candidate:${user.id.substring(0, 12)}...` : "candidate:local"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
              >
                <Shield className="size-3.5 text-indigo-600" />
                Evidence Scope Active
              </Button>
            </div>
          </div>
        </div>

        {/* AI Model & Pipeline Status */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bot className="size-4 text-indigo-600" />
              AI Multi-Agent Pipeline Status
            </h2>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              Operational
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3">
              <p className="font-semibold text-slate-800 dark:text-slate-200">StateGraph Engine</p>
              <p className="text-slate-500 mt-1">LangGraph-style DAG with anti-hallucination reflection</p>
            </div>
            <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3">
              <p className="font-semibold text-slate-800 dark:text-slate-200">Active LLM Router</p>
              <p className="text-slate-500 mt-1">OpenRouter / OpenAI gpt-4o-mini (Zero Hardcoding)</p>
            </div>
            <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3">
              <p className="font-semibold text-slate-800 dark:text-slate-200">LaTeX AST Compiler</p>
              <p className="text-slate-500 mt-1">Single-Column Overleaf pdflatex (0.75in margins)</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
