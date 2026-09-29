import React from "react";
import { Cpu, CheckCircle2, Clock, Zap, DollarSign, RotateCcw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AgentExecutionStep } from "@/lib/ai/types";

export interface AiRunDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  runId?: string | undefined;
  executionTrace: AgentExecutionStep[];
  totalInputTokens?: number | undefined;
  totalOutputTokens?: number | undefined;
  estimatedCostUsd?: number | undefined;
  totalLatencyMs?: number | undefined;
}

export const AiRunDashboardModal: React.FC<AiRunDashboardModalProps> = ({
  isOpen,
  onClose,
  runId = "run-active",
  executionTrace,
  totalInputTokens = 3800,
  totalOutputTokens = 950,
  estimatedCostUsd = 0.00114,
  totalLatencyMs = 6200,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm print:hidden">
      <div className="w-full max-w-3xl rounded-2xl border border-border bg-background p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-white shadow-button">
              <Cpu className="size-5" />
            </span>
            <div>
              <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                AI Execution Run Inspector
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                  #{runId}
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Multi-Agent DAG Trace, Observability & Cost Telemetry
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="size-8 p-0 text-muted-foreground">
            ✕
          </Button>
        </div>

        {/* Telemetry Overview Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl border border-border bg-card space-y-1">
            <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
              <Clock className="size-3 text-indigo-500" /> Total Latency
            </span>
            <p className="text-sm font-extrabold text-foreground font-mono">
              {(totalLatencyMs / 1000).toFixed(2)}s
            </p>
          </div>

          <div className="p-3 rounded-xl border border-border bg-card space-y-1">
            <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
              <Zap className="size-3 text-amber-500" /> Total Tokens
            </span>
            <p className="text-sm font-extrabold text-foreground font-mono">
              {(totalInputTokens + totalOutputTokens).toLocaleString()}
            </p>
          </div>

          <div className="p-3 rounded-xl border border-border bg-card space-y-1">
            <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
              <DollarSign className="size-3 text-emerald-500" /> Est. Cost (USD)
            </span>
            <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              ${estimatedCostUsd.toFixed(5)}
            </p>
          </div>

          <div className="p-3 rounded-xl border border-border bg-card space-y-1">
            <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="size-3 text-primary" /> Architecture
            </span>
            <p className="text-sm font-extrabold text-foreground">
              StateGraph DAG
            </p>
          </div>
        </div>

        {/* Node Execution Trace */}
        <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Executed Graph Nodes ({executionTrace.length})
          </h4>

          <div className="space-y-2">
            {executionTrace.map((step, idx) => {
              const isDone = step.status === "completed";
              const isReflect = step.status === "reflection_loop";
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border text-xs space-y-1.5 transition-all ${
                    isDone
                      ? "border-emerald-500/20 bg-card"
                      : isReflect
                      ? "border-amber-500/30 bg-amber-500/5"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      {isDone ? (
                        <CheckCircle2 className="size-3.5 text-emerald-500" />
                      ) : isReflect ? (
                        <RotateCcw className="size-3.5 text-amber-500" />
                      ) : (
                        <Clock className="size-3.5 text-indigo-500" />
                      )}
                      {step.displayName}
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {step.status}
                    </span>
                  </div>

                  {step.outputSummary && (
                    <p className="text-[11px] text-muted-foreground leading-relaxed pl-5">
                      {step.outputSummary}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-border">
          <Button size="sm" onClick={onClose} className="text-xs font-semibold">
            Close Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};
