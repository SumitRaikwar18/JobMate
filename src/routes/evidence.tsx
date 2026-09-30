import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  FolderGit2,
  GitCommit,
  GitPullRequest,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Layers,
  Sparkles,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Search,
  Filter,
  Activity,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppLayout } from "@/components/layout/app-layout";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { EvidenceService } from "@/lib/ai/evidence/evidence-service";
import type { EvidenceItem, EvidenceConflict } from "@/lib/ai/evidence/evidence-types";

export const Route = createFileRoute("/evidence")({
  head: () => ({
    meta: [
      { title: "Candidate Evidence Graph & Proof Coverage — JobMate AI" },
      { name: "description", content: "Explore verified candidate evidence, multi-signal proof coverage, timeline freshness, and active conflict checks across your connected engineering artifacts." },
    ],
  }),
  component: EvidenceExplorerPage,
});

function EvidenceExplorerPage() {
  const { user, profile } = useAuth();
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [conflicts, setConflicts] = useState<EvidenceConflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "repos" | "dependencies" | "commits" | "ci" | "conflicts">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadData() {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const items = await EvidenceService.getCandidateEvidence(user.id);
      setEvidenceList(items);
      setLoading(false);
    }
    loadData();
  }, [user?.id]);

  const filteredItems = evidenceList.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.technologies.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeFilter === "repos") return item.evidenceLevel === "L2_README_CLAIM" || item.evidenceLevel === "L4_SOURCE_CODE";
    if (activeFilter === "dependencies") return item.evidenceLevel === "L3_MANIFEST_DEPENDENCY";
    if (activeFilter === "commits") return item.evidenceLevel === "L5_COMMIT_PR";
    if (activeFilter === "ci") return item.evidenceLevel === "L6_TEST_CI";
    return true;
  });

  const verifiedCount = evidenceList.filter((e) => e.verificationStatus === "verified").length;
  const verifiedPct = evidenceList.length > 0 ? Math.round((verifiedCount / evidenceList.length) * 100) : 100;
  const uniqueTechs = Array.from(new Set(evidenceList.flatMap((e) => e.technologies)));

  return (
    <AppLayout activeNav="evidence" showBetaBanner={false}>
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-3 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200/60">
                <ShieldCheck className="size-3.5" />
                Truth-Grounded Evidence Graph
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Candidate Evidence Explorer
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Inspect independent engineering signals mined from your connected GitHub repositories, manifests, tests, CI pipelines, and verified commits.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/builder"
                className={cn(buttonVariants({ variant: "primary" }), "gap-2 shadow-button bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl")}
              >
                <span>Open Resume Builder</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-100 dark:border-slate-800 pt-5">
            <div>
              <p className="text-xs font-medium text-slate-500">Verified Evidence Items</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{evidenceList.length}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Truth & Grounding Rate</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{verifiedPct}%</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Demonstrated Technologies</p>
              <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{uniqueTechs.length}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Active Conflicts</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{conflicts.length}</p>
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: "all", label: "All Signals" },
              { id: "dependencies", label: "Dependencies (L3)" },
              { id: "repos", label: "Source & Repos (L4)" },
              { id: "commits", label: "Commits & PRs (L5)" },
              { id: "ci", label: "CI & Tests (L6)" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id as any)}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap",
                  activeFilter === tab.id
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200/80 dark:border-slate-800"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 size-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search evidence & skills..."
              className="w-full rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
            />
          </div>
        </div>

        {/* Evidence List */}
        {filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-12 text-center">
            <FolderGit2 className="mx-auto size-9 text-slate-400 mb-3 opacity-80" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">No Evidence Items Found</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
              Connect your GitHub account or paste projects in the <strong>Resume Builder</strong> to extract multi-signal evidence.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-sm transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-400 border border-indigo-200/50 font-mono">
                      {item.evidenceLevel}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="size-3" />
                      {(item.confidence * 100).toFixed(0)}% Confidence
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{item.content}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5 truncate">
                    {item.repository && <span className="font-mono">{item.repository}</span>}
                    {item.filePath && <span className="text-slate-400">• {item.filePath}</span>}
                  </div>
                  {item.sourceUri && (
                    <a
                      href={item.sourceUri}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 shrink-0 font-medium"
                    >
                      Source <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
