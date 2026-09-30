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
  Code2,
  Terminal,
  Clock,
  ChevronRight,
  Database,
  X,
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
      { title: "Candidate Evidence Explorer & Code Provenance — JobMate AI" },
      { name: "description", content: "Explore verified candidate engineering evidence, AST syntax tree facts, timeline freshness, and code provenance across your repositories." },
    ],
  }),
  component: EvidenceExplorerPage,
});

function EvidenceExplorerPage() {
  const { user } = useAuth();
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [conflicts, setConflicts] = useState<EvidenceConflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "ast" | "dependencies" | "commits" | "ci" | "conflicts">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const items = await EvidenceService.getCandidateEvidence(user.id);
        setEvidenceList(items || []);
        if (items && items.length > 0) {
          setSelectedEvidence(items[0] || null);
        }
      } catch (err) {
        console.error("Failed to load evidence items:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user?.id]);

  const filteredItems = evidenceList.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.technologies.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeFilter === "ast") return item.evidenceLevel === "L4_SOURCE_CODE";
    if (activeFilter === "dependencies") return item.evidenceLevel === "L3_MANIFEST_DEPENDENCY";
    if (activeFilter === "commits") return item.evidenceLevel === "L5_COMMIT_PR";
    if (activeFilter === "ci") return item.evidenceLevel === "L6_TEST_CI";
    if (activeFilter === "conflicts") return item.verificationStatus === "conflicted";
    return true;
  });

  const verifiedCount = evidenceList.filter((e) => e.verificationStatus === "verified").length;
  const verifiedPct = evidenceList.length > 0 ? Math.round((verifiedCount / evidenceList.length) * 100) : 100;
  const uniqueTechs = Array.from(new Set(evidenceList.flatMap((e) => e.technologies)));

  return (
    <AppLayout activeNav="evidence" showBetaBanner={false}>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* HEADER OVERVIEW */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-3 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200/60">
                <ShieldCheck className="size-3.5" />
                Truth-Grounded Evidence Graph
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Candidate Evidence Explorer
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Inspect independent engineering signals mined from your connected GitHub repositories: AST syntax trees, exported API route handlers, manifest dependencies, CI test executions, and verified commit history.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/builder"
                className={cn(
                  buttonVariants({ variant: "primary" }),
                  "gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs"
                )}
              >
                <span>Open Resume Builder</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-5">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Signals</p>
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
              { id: "ast", label: "AST Code (L4)" },
              { id: "dependencies", label: "Dependencies (L3)" },
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
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
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
              className="w-full rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* 2-PANE EXPLORER & DETAIL INSPECTOR */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">Loading evidence graph...</div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
            <FolderGit2 className="mx-auto size-8 text-slate-400 mb-3 opacity-75" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">No Evidence Items Found</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
              Connect your GitHub repository or input projects in the <strong>Resume Builder</strong> to extract multi-signal evidence.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* LEFT 2 COLS: Evidence Card List */}
            <div className="lg:col-span-2 space-y-3">
              {filteredItems.map((item) => {
                const isSelected = selectedEvidence?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedEvidence(item)}
                    className={cn(
                      "rounded-2xl border bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs cursor-pointer transition-all space-y-3",
                      isSelected
                        ? "border-indigo-600 dark:border-indigo-500 ring-1 ring-indigo-600/20 shadow-xs"
                        : "border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-200/50">
                            {item.evidenceLevel}
                          </span>
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            {item.title}
                          </h3>
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

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span className="truncate max-w-[280px]">
                        {item.repository && item.filePath ? `${item.repository}/${item.filePath}` : item.repository || "Repository"}
                      </span>
                      <span className="text-indigo-600 font-sans font-semibold text-[11px] flex items-center gap-0.5">
                        Inspect <ChevronRight className="size-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* RIGHT 1 COL: Deep Provenance Inspector */}
            <div className="sticky top-20 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-5">
              {selectedEvidence ? (
                <>
                  <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        Evidence Inspector
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                        {selectedEvidence.title}
                      </h3>
                    </div>
                    <span className="font-mono text-[10px] bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 font-bold px-2 py-0.5 rounded">
                      {selectedEvidence.verificationStatus.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-500">What This Proves</p>
                      <p className="text-slate-800 dark:text-slate-200 mt-0.5 leading-relaxed">
                        {selectedEvidence.content}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold text-slate-500">Demonstrated Technologies</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {selectedEvidence.technologies.map((t) => (
                          <span
                            key={t}
                            className="font-mono text-[10px] bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 font-mono text-[11px]">
                      {selectedEvidence.repository && (
                        <div className="flex justify-between py-1">
                          <span className="text-slate-500">Repository:</span>
                          <span className="text-slate-900 dark:text-white truncate max-w-[180px]">{selectedEvidence.repository}</span>
                        </div>
                      )}
                      {selectedEvidence.filePath && (
                        <div className="flex justify-between py-1">
                          <span className="text-slate-500">File:</span>
                          <span className="text-slate-900 dark:text-white truncate max-w-[180px]">{selectedEvidence.filePath}</span>
                        </div>
                      )}
                      {selectedEvidence.commitSha && (
                        <div className="flex justify-between py-1">
                          <span className="text-slate-500">Commit SHA:</span>
                          <span className="text-slate-900 dark:text-white">{selectedEvidence.commitSha.slice(0, 8)}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Evidence Level:</span>
                        <span className="text-indigo-600 font-bold">{selectedEvidence.evidenceLevel}</span>
                      </div>
                    </div>

                    {selectedEvidence.sourceUri && (
                      <div className="pt-3">
                        <a
                          href={selectedEvidence.sourceUri}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 py-2.5 text-xs font-bold transition-colors font-sans"
                        >
                          <span>Open Source File</span>
                          <ExternalLink className="size-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Select an evidence item to view its complete code provenance.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
