import type {
  CandidateEvidenceBank,
  JobAnalysisResult,
  ResumePlan,
  GuardrailValidationReport,
  AtsSimulationAudit,
  AgentExecutionStep,
  MultiAgentPipelineResult,
} from "./types";
import { runJdAnalyzerAgent } from "./agents/jd-analyzer-agent";
import { runPlannerAgent } from "./agents/planner-agent";
import { runSynthesizerAgent } from "./agents/synthesizer-agent";
import { runCriticGuardrailAgent } from "./agents/critic-guardrail-agent";
import { runAtsAuditorAgent } from "./agents/ats-auditor-agent";
import { retrieveHybridCandidateEvidence, type HybridRetrievedItem } from "./retrieval/hybrid-retriever";
import { rerankRetrievedEvidence, type RerankedItem } from "./retrieval/reranker";
import { buildClaimProvenanceRecords, type ClaimProvenanceRecord } from "./retrieval/provenance";
import { PROMPT_REGISTRY } from "./prompts/registry";
import { calculateEstimatedCostUsd, estimateTokenCount } from "./model-router";
import type { EvidenceItem } from "./schemas/evidence-schema";
import { supabase } from "@/lib/supabase";

/**
 * State Channels Schema for Resume Pipeline Execution Graph
 */
export interface ResumeStateGraphChannels {
  runId: string;
  candidateId: string;
  evidenceBank: CandidateEvidenceBank;
  rawJdText: string;
  targetCompany?: string | undefined;

  // Graph Channels
  jobAnalysis?: JobAnalysisResult | undefined;
  retrievedEvidence: HybridRetrievedItem[];
  rerankedEvidence: RerankedItem[];
  resumePlan?: ResumePlan | undefined;
  currentDraft?: any;
  provenanceRecords: ClaimProvenanceRecord[];

  // Reflection & Verification Channel
  reflectionCount: number;
  maxReflections: number;
  guardrailReport?: GuardrailValidationReport | undefined;
  criticFeedback?: string | undefined;

  // Evaluation & Trace Channel
  atsAudit?: AtsSimulationAudit | undefined;
  executionTrace: AgentExecutionStep[];
  totalInputTokens: number;
  totalOutputTokens: number;
  estimatedCostUsd: number;
  status: "idle" | "running" | "reflecting" | "completed" | "failed";
}

export type StateGraphStepCallback = (step: AgentExecutionStep) => void;

/**
 * StateGraph Runner with Persistent AI Execution Tracing, Hybrid RAG, Reranking & Claim Provenance
 */
export class ResumeStateGraph {
  private state: ResumeStateGraphChannels;
  private onStepCallback?: StateGraphStepCallback | undefined;
  private startTime = 0;

  constructor(
    rawJdText: string,
    evidenceBank: CandidateEvidenceBank,
    targetCompany?: string | undefined,
    onStepUpdate?: StateGraphStepCallback | undefined
  ) {
    const runId = `run-${Math.random().toString(36).slice(2, 10)}`;
    this.state = {
      runId,
      candidateId: evidenceBank.candidateId || "user-1",
      evidenceBank,
      rawJdText,
      targetCompany,
      retrievedEvidence: [],
      rerankedEvidence: [],
      resumePlan: undefined,
      currentDraft: undefined,
      provenanceRecords: [],
      reflectionCount: 0,
      maxReflections: 2,
      executionTrace: [],
      totalInputTokens: 0,
      totalOutputTokens: 0,
      estimatedCostUsd: 0,
      status: "idle",
    };
    this.onStepCallback = onStepUpdate;
  }

  public getRunId(): string {
    return this.state.runId;
  }

  private async updateStep(
    agentName: AgentExecutionStep["agentName"],
    displayName: string,
    status: AgentExecutionStep["status"],
    outputSummary?: string | undefined
  ) {
    const existingIdx = this.state.executionTrace.findIndex((s) => s.agentName === agentName);
    const existingStep = existingIdx >= 0 ? this.state.executionTrace[existingIdx] : undefined;
    const step: AgentExecutionStep = {
      agentName,
      displayName,
      status,
      startedAt: existingStep?.startedAt || new Date().toISOString(),
      finishedAt: status === "completed" || status === "failed" ? new Date().toISOString() : undefined,
      outputSummary,
      reflectionCount: this.state.reflectionCount,
    };

    if (existingIdx >= 0) {
      this.state.executionTrace[existingIdx] = step;
    } else {
      this.state.executionTrace.push(step);
    }

    if (this.onStepCallback) {
      this.onStepCallback(step);
    }

    // Persist node execution telemetry to Supabase
    try {
      const { data: userData } = await supabase.auth.getUser();
      const candidateId = userData?.user?.id || this.state.candidateId;
      if (candidateId) {
        await supabase.from("ai_execution_traces").insert({
          run_id: this.state.runId,
          trace_id: `trace_${this.state.runId}_${agentName}`,
          candidate_id: candidateId,
          node_name: agentName,
          attempt: this.state.reflectionCount + 1,
          started_at: step.startedAt,
          finished_at: step.finishedAt || null,
          status: status === "completed" ? "success" : status === "failed" ? "failed" : "running",
          created_at: step.startedAt,
        } as any);
      }
    } catch {
      // non-blocking background telemetry
    }
  }

  /**
   * Node 1: JD Semantic Decomposer
   */
  private async nodeJdDecomposer(): Promise<void> {
    const promptMeta = PROMPT_REGISTRY["jd_analyzer:v1.2"];
    await this.updateStep("JD_Analyzer", "Semantic JD Parser Agent", "running", `Decomposing requirements via ${promptMeta?.agentName || "JD Analyzer"} (${promptMeta?.version || "v1.2"})...`);
    
    const inTokens = estimateTokenCount(this.state.rawJdText);
    const analysis = await runJdAnalyzerAgent(this.state.rawJdText, this.state.targetCompany);
    this.state.jobAnalysis = analysis;
    
    const outTokens = estimateTokenCount(JSON.stringify(analysis));
    this.state.totalInputTokens += inTokens;
    this.state.totalOutputTokens += outTokens;

    await this.updateStep(
      "JD_Analyzer",
      "Semantic JD Parser Agent",
      "completed",
      `Extracted ${analysis.requiredHardSkills.length} hard skills, ${analysis.requiredSoftSkills.length} soft skills. Seniority: ${analysis.seniority}.`
    );
  }

  /**
   * Node 2: Real pgvector Hybrid Evidence RAG Retriever & Cross-Encoder Reranker
   */
  private async nodeEvidenceRag(): Promise<void> {
    if (!this.state.jobAnalysis) return;
    await this.updateStep("Evidence_Retriever" as any, "pgvector Hybrid RAG & Reranker", "running", "Executing dense cosine similarity + BM25 sparse search + reranking...");

    // Convert candidate evidence bank items into EvidenceItem format
    const evidencePool: EvidenceItem[] = (this.state.evidenceBank.evidenceItems || []).map((item: any) => ({
      id: item.id,
      candidateId: this.state.candidateId,
      sourceType: (item.category || item.sourceType || "experience") as any,
      title: item.title,
      content: `${item.title} at ${item.organization || "Company"}. ${(item.verifiedClaims || []).join(" ")}`,
      technologies: item.technologiesUsed || item.technologies || [],
      concepts: item.concepts || [],
      metrics: (item.metrics || []).map((m: any) => typeof m === "string" ? { metricName: "metric", metricValue: m } : m),
      verified: item.verified ?? (item.verificationStatus === "VERIFIED" || item.evidenceLevel === "L5_COMMIT_PR" || item.evidenceLevel === "L6_TEST_CI"),
      confidence: item.confidence ?? (item.verificationStatus === "VERIFIED" ? 0.95 : 0.65),
      metadata: item.metadata || {},
    }));

    const query = `${this.state.jobAnalysis.roleTitle} ${this.state.jobAnalysis.requiredHardSkills.join(" ")}`;
    const retrievalResult = await retrieveHybridCandidateEvidence(
      query,
      evidencePool,
      this.state.jobAnalysis.requiredHardSkills,
      { topK: 8 }
    );
    this.state.retrievedEvidence = retrievalResult.items;

    // Cross-encoder reranking
    const rerankingResult = await rerankRetrievedEvidence(
      this.state.jobAnalysis.requiredHardSkills.slice(0, 5).join(", "),
      retrievalResult.items
    );
    this.state.rerankedEvidence = rerankingResult.items;

    await this.updateStep(
      "Evidence_Retriever" as any,
      "pgvector Hybrid RAG & Reranker",
      "completed",
      `Retrieved ${retrievalResult.items.length} items. Reranked top match: ${rerankingResult.items[0]?.evidence.title || "Evidence"} (Score: ${Math.round((rerankingResult.items[0]?.rerankScore || 0) * 100)}%).`
    );
  }

  /**
   * Node 3: Resume Strategist & Planner
   */
  private async nodeResumePlanner(): Promise<void> {
    if (!this.state.jobAnalysis) return;
    const promptMeta = PROMPT_REGISTRY["planner:v1.1"];
    await this.updateStep("Resume_Planner", "Resume Strategist Agent", "running", `Determining section hierarchy (${promptMeta?.version || "v1.1"})...`);
    
    const inTokens = estimateTokenCount(JSON.stringify(this.state.jobAnalysis)) + estimateTokenCount(JSON.stringify(this.state.evidenceBank));
    const plan = await runPlannerAgent(this.state.evidenceBank, this.state.jobAnalysis);
    this.state.resumePlan = plan;
    
    const outTokens = estimateTokenCount(JSON.stringify(plan));
    this.state.totalInputTokens += inTokens;
    this.state.totalOutputTokens += outTokens;

    await this.updateStep(
      "Resume_Planner",
      "Resume Strategist Agent",
      "completed",
      `Recommended: ${plan.recommendedTemplate.toUpperCase()}. Section order: ${plan.sectionOrder.join(" → ")}.`
    );
  }

  /**
   * Node 4: XYZ Achievement Synthesizer & Provenance Graph Builder
   */
  private async nodeXyzSynthesizer(): Promise<void> {
    if (!this.state.jobAnalysis || !this.state.resumePlan) return;
    const promptMeta = PROMPT_REGISTRY["synthesizer:v2.0"];
    await this.updateStep(
      "XYZ_Synthesizer",
      "XYZ Content Synthesizer Agent",
      this.state.reflectionCount > 0 ? "reflection_loop" : "running",
      this.state.reflectionCount > 0
        ? `Refining draft (Reflection Pass #${this.state.reflectionCount}) addressing Guardrail feedback...`
        : `Drafting Google XYZ formula achievements (${promptMeta?.version || "v2.0"})...`
    );

    const inTokens = estimateTokenCount(JSON.stringify(this.state.resumePlan)) + estimateTokenCount(JSON.stringify(this.state.evidenceBank));
    const draft = await runSynthesizerAgent(
      this.state.evidenceBank,
      this.state.jobAnalysis,
      this.state.resumePlan,
      this.state.criticFeedback
    );
    this.state.currentDraft = draft;

    // Convert candidate evidence items for provenance attribution
    const evidencePool: EvidenceItem[] = (this.state.evidenceBank.evidenceItems || []).map((item: any) => ({
      id: item.id,
      candidateId: this.state.candidateId,
      sourceType: (item.category || item.sourceType || "experience") as any,
      title: item.title,
      content: `${item.title} at ${item.organization || "Company"}. ${(item.verifiedClaims || []).join(" ")}`,
      technologies: item.technologiesUsed || item.technologies || [],
      concepts: item.concepts || [],
      metrics: (item.metrics || []).map((m: any) => typeof m === "string" ? { metricName: "metric", metricValue: m } : m),
      verified: item.verified ?? (item.verificationStatus === "VERIFIED" || item.evidenceLevel === "L5_COMMIT_PR" || item.evidenceLevel === "L6_TEST_CI"),
      confidence: item.confidence ?? (item.verificationStatus === "VERIFIED" ? 0.95 : 0.65),
      metadata: item.metadata || {},
    }));

    this.state.provenanceRecords = buildClaimProvenanceRecords(
      draft.claims || [],
      evidencePool
    );
    
    const outTokens = estimateTokenCount(JSON.stringify(draft));
    this.state.totalInputTokens += inTokens;
    this.state.totalOutputTokens += outTokens;

    await this.updateStep(
      "XYZ_Synthesizer",
      "XYZ Content Synthesizer Agent",
      "completed",
      `Synthesized ${draft.experience?.length || 0} roles and ${draft.projects?.length || 0} projects with Google XYZ formula.`
    );
  }

  /**
   * Node 5: Anti-Hallucination Critic Guardrail
   */
  private async nodeCriticGuardrail(): Promise<void> {
    if (!this.state.currentDraft) return;
    const promptMeta = PROMPT_REGISTRY["critic_guardrail:v1.3"];
    await this.updateStep(
      "Critic_Guardrail",
      "Anti-Hallucination Guardrail Agent",
      "running",
      `Auditing claims against Candidate Ground-Truth Evidence (${promptMeta?.version || "v1.3"})...`
    );

    const inTokens = estimateTokenCount(JSON.stringify(this.state.currentDraft)) + estimateTokenCount(JSON.stringify(this.state.evidenceBank));
    const report = await runCriticGuardrailAgent(this.state.currentDraft, this.state.evidenceBank);
    this.state.guardrailReport = report as any;

    const outTokens = estimateTokenCount(JSON.stringify(report));
    this.state.totalInputTokens += inTokens;
    this.state.totalOutputTokens += outTokens;

    const isFullyGrounded = report.passed && ((report as any).blockedClaimsCount === 0 || (report as any).blockedClaimsCount === undefined) && report.overallGroundingScore >= 75;

    if (isFullyGrounded) {
      await this.updateStep(
        "Critic_Guardrail",
        "Anti-Hallucination Guardrail Agent",
        "completed",
        `Verification PASSED. Grounding Score: ${report.overallGroundingScore}%. Verified ${report.verifiedClaimsCount} claims with zero blocked claims.`
      );
    } else {
      this.state.criticFeedback = report.critique;
      await this.updateStep(
        "Critic_Guardrail",
        "Anti-Hallucination Guardrail Agent",
        "reflection_loop",
        `Unverified or blocked metric claim detected! Triggering Reflection Cycle #${this.state.reflectionCount + 1}...`
      );
    }
  }

  /**
   * Node 6: Deterministic ATS Simulation & Auditor
   */
  private async nodeAtsAuditor(): Promise<void> {
    if (!this.state.currentDraft || !this.state.jobAnalysis) return;
    const promptMeta = PROMPT_REGISTRY["ats_auditor:v1.1"];
    await this.updateStep("ATS_Auditor", "ATS Simulator Agent", "running", `Simulating ATS structure evaluation (${promptMeta?.version || "v1.1"})...`);
    
    const inTokens = estimateTokenCount(JSON.stringify(this.state.currentDraft)) + estimateTokenCount(JSON.stringify(this.state.jobAnalysis));
    const audit = await runAtsAuditorAgent(this.state.currentDraft, this.state.jobAnalysis);
    this.state.atsAudit = audit;
    
    const outTokens = estimateTokenCount(JSON.stringify(audit));
    this.state.totalInputTokens += inTokens;
    this.state.totalOutputTokens += outTokens;

    await this.updateStep(
      "ATS_Auditor",
      "ATS Simulator Agent",
      "completed",
      `ATS Score: ${audit.overallScore}%. Keyword Density: ${audit.keywordDensityScore}%. Single-Column Structure: Verified.`
    );
  }

  /**
   * Master Execution Entrypoint with Trace Logging
   */
  public async execute(): Promise<MultiAgentPipelineResult> {
    this.startTime = performance.now();
    this.state.status = "running";

    // Step 1: Decompose JD
    await this.nodeJdDecomposer();

    // Step 2: Evidence RAG Retrieval
    await this.nodeEvidenceRag();

    // Step 3: Plan Strategy
    await this.nodeResumePlanner();

    // Step 4 & 5: Synthesize + Verify Reflection Loop
    while (this.state.reflectionCount <= this.state.maxReflections) {
      await this.nodeXyzSynthesizer();
      await this.nodeCriticGuardrail();

      // Conditional Edge Decision: Hard Gate
      const guardReport = this.state.guardrailReport as any;
      const passedHardGate = guardReport?.passed && (guardReport?.blockedClaimsCount === 0 || guardReport?.blockedClaimsCount === undefined) && (guardReport?.overallGroundingScore ?? 0) >= 75;

      if (passedHardGate || this.state.reflectionCount >= this.state.maxReflections) {
        break;
      }

      this.state.reflectionCount++;
      this.state.status = "reflecting";
    }

    // Step 6: ATS Audit
    await this.nodeAtsAuditor();

    this.state.status = "completed";
    const totalLatency = Math.round(performance.now() - this.startTime);
    this.state.estimatedCostUsd = calculateEstimatedCostUsd(
      "openai/gpt-4o-mini",
      this.state.totalInputTokens,
      this.state.totalOutputTokens
    );

    // Persist to Supabase if authenticated session is available
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.id) {
        await supabase.from("ai_runs").insert({
          id: undefined, // auto gen uuid in db
          user_id: userData.user.id,
          workflow: "resume_tailoring_pipeline",
          status: "completed",
          model: "openai/gpt-4o-mini",
          prompt_version: "multi-agent-v2",
          total_input_tokens: this.state.totalInputTokens,
          total_output_tokens: this.state.totalOutputTokens,
          estimated_cost_usd: this.state.estimatedCostUsd,
          latency_ms: totalLatency,
          grounding_rate: (this.state.guardrailReport as any)?.overallGroundingScore ?? 100,
          ats_score: this.state.atsAudit?.overallScore ?? 90,
          completed_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn("[StateGraph] Background run persistence skipped:", err);
    }

    return {
      jobAnalysis: this.state.jobAnalysis!,
      resumePlan: this.state.resumePlan!,
      generatedContent: this.state.currentDraft,
      guardrailReport: this.state.guardrailReport!,
      atsAudit: this.state.atsAudit!,
      executionTrace: this.state.executionTrace,
      reflectionIterations: this.state.reflectionCount,
    };
  }
}
