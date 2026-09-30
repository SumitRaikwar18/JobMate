import { supabase } from "@/lib/supabase";

export interface ExecutionTraceRecord {
  runId: string;
  traceId: string;
  candidateId: string;
  nodeName: string;
  attempt?: number;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  status: "running" | "success" | "failed" | "retrying";
  model?: string;
  provider?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalCostUsd?: number;
  errorMessage?: string;
  toolCalls?: unknown[];
  evidenceIds?: string[];
}

/**
 * Production AI Execution Tracer
 * Records structured telemetry per StateGraph node execution directly to Supabase.
 */
export class AITracer {
  public static async recordNodeTrace(trace: ExecutionTraceRecord): Promise<void> {
    try {
      const payload = {
        run_id: trace.runId,
        trace_id: trace.traceId,
        candidate_id: trace.candidateId,
        node_name: trace.nodeName,
        attempt: trace.attempt || 1,
        started_at: trace.startedAt,
        finished_at: trace.finishedAt || new Date().toISOString(),
        duration_ms: trace.durationMs || 0,
        status: trace.status,
        model: trace.model || null,
        provider: trace.provider || null,
        input_tokens: trace.inputTokens || 0,
        output_tokens: trace.outputTokens || 0,
        total_cost_usd: trace.totalCostUsd || 0.0,
        error_message: trace.errorMessage || null,
        tool_calls: trace.toolCalls || [],
        evidence_ids: trace.evidenceIds || [],
        created_at: new Date().toISOString(),
      };

      await supabase.from("ai_execution_traces").insert(payload as any);
    } catch (err) {
      // Telemetry should never crash the main generation pipeline
      console.warn("[AITracer] Failed to persist trace to DB:", err);
    }
  }

  public static async getRunTraces(runId: string): Promise<ExecutionTraceRecord[]> {
    try {
      const { data, error } = await supabase
        .from("ai_execution_traces")
        .select("*")
        .eq("run_id", runId)
        .order("created_at", { ascending: true });

      if (error || !data) return [];

      return data.map((row: any) => ({
        runId: row.run_id,
        traceId: row.trace_id,
        candidateId: row.candidate_id,
        nodeName: row.node_name,
        attempt: row.attempt,
        startedAt: row.started_at,
        finishedAt: row.finished_at,
        durationMs: row.duration_ms,
        status: row.status,
        model: row.model,
        provider: row.provider,
        inputTokens: row.input_tokens,
        outputTokens: row.output_tokens,
        totalCostUsd: row.total_cost_usd,
        errorMessage: row.error_message,
        toolCalls: row.tool_calls,
        evidenceIds: row.evidence_ids,
      }));
    } catch {
      return [];
    }
  }
}
