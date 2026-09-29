import React from "react";
import { ShieldCheck, AlertTriangle, ExternalLink, Sparkles, Database, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ClaimProvenanceRecord } from "@/lib/ai/retrieval/provenance";

export interface ProvenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  claimRecord: ClaimProvenanceRecord | null;
}

export const ProvenanceModal: React.FC<ProvenanceModalProps> = ({
  isOpen,
  onClose,
  claimRecord,
}) => {
  if (!isOpen || !claimRecord) return null;

  const isGrounded = claimRecord.verificationStatus === "grounded";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm print:hidden">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-background p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <span
              className={`grid size-9 place-items-center rounded-xl shadow-button text-white ${
                isGrounded ? "bg-emerald-600" : "bg-amber-600"
              }`}
            >
              {isGrounded ? <ShieldCheck className="size-5" /> : <AlertTriangle className="size-5" />}
            </span>
            <div>
              <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                Why this claim?
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    isGrounded
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                  }`}
                >
                  {isGrounded ? "Verified Grounded" : "Partially Grounded"}
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Attribution & Evidence Provenance Graph
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="size-8 p-0 text-muted-foreground">
            ✕
          </Button>
        </div>

        {/* Claim Statement */}
        <div className="space-y-1.5 rounded-xl border border-border bg-muted/30 p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Generated Resume Bullet
          </span>
          <p className="text-xs font-semibold text-foreground leading-relaxed">
            "{claimRecord.claimText}"
          </p>
        </div>

        {/* Evidence Source Card */}
        <div className="space-y-3 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Database className="size-3.5 text-primary" /> Backing Candidate Evidence
            </span>
            <span className="text-[10px] font-mono font-bold bg-primary/10 text-primary px-2 py-0.5 rounded uppercase">
              {claimRecord.evidenceSourceType}
            </span>
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-bold text-foreground">{claimRecord.evidenceTitle}</h4>
            <p className="text-xs text-muted-foreground italic border-l-2 border-primary/40 pl-2.5 py-1">
              "{claimRecord.evidenceExcerpt}"
            </p>
          </div>

          {/* Matched Entities */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
            <div>
              <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                Verified Technologies:
              </span>
              <div className="flex flex-wrap gap-1">
                {claimRecord.matchedTechnologies.length > 0 ? (
                  claimRecord.matchedTechnologies.map((t, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-semibold bg-background border border-border px-1.5 py-0.5 rounded text-foreground"
                    >
                      {t}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-muted-foreground italic">None explicitly cited</span>
                )}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                Verified Metrics:
              </span>
              <div className="flex flex-wrap gap-1">
                {claimRecord.matchedMetrics.length > 0 ? (
                  claimRecord.matchedMetrics.map((m, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded"
                    >
                      {m}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-muted-foreground italic">Qualitative description</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Verification Explanation */}
        <div className="rounded-xl border border-border/80 bg-slate-950 p-3.5 text-xs text-slate-300 font-mono space-y-1">
          <div className="flex items-center justify-between text-slate-400 font-sans text-[11px] font-bold">
            <span>Guardrail Evaluation</span>
            <span>Confidence: {(claimRecord.confidenceScore * 100).toFixed(0)}%</span>
          </div>
          <p className="leading-relaxed">{claimRecord.explanation}</p>
        </div>

        <div className="flex justify-end pt-2">
          <Button size="sm" onClick={onClose} className="text-xs font-semibold">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
