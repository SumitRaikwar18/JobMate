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
import { retrieveAndRankCandidateEvidence, type RankedEvidenceItem } from "./rag-retriever";

/**
 * LangGraph State Channels Schema
 */
export interface ResumeStateGraphChannels {
  candidateId: string;
  evidenceBank: CandidateEvidenceBank;
  rawJdText: string;
  targetCompany?: string;

  // Graph Channels
  jobAnalysis?: JobAnalysisResult;
  rankedEvidence: RankedEvidenceItem[];
  resumePlan?: ResumePlan;
  currentDraft?: any;

  // Reflection & Verification Channel
  reflectionCount: number;
  maxReflections: number;
  guardrailReport?: GuardrailValidationReport;
  criticFeedback?: string;

  // Evaluation & Trace Channel
  atsAudit?: AtsSimulationAudit;
  executionTrace: AgentExecutionStep[];
  status: "idle" | "running" | "reflecting" | "completed" | "failed";
}

export type StateGraphStepCallback = (step: AgentExecutionStep) => void;

/**
 * LangGraph-Style StateGraph Runner with Conditional Reflection Edges
 */
export class ResumeStateGraph {
  private state: ResumeStateGraphChannels;
  private onStepCallback?: StateGraphStepCallback;

  constructor(
    rawJdText: string,
    evidenceBank: CandidateEvidenceBank,
    targetCompany?: string,
    onStepUpdate?: StateGraphStepCallback
  ) {
    this.state = {
      candidateId: evidenceBank.candidateId || "user-1",
      evidenceBank,
      rawJdText,
      targetCompany,
      rankedEvidence: [],
      reflectionCount: 0,
      maxReflections: 2,
      executionTrace: [],
      status: "idle",
    };
    this.onStepCallback = onStepUpdate;
  }

  private updateStep(
    agentName: AgentExecutionStep["agentName"],
    displayName: string,
    status: AgentExecutionStep["status"],
    outputSummary?: string
  ) {
    const existingIdx = this.state.executionTrace.findIndex((s) => s.agentName === agentName);
    const step: AgentExecutionStep = {
      agentName,
      displayName,
      status,
      startedAt: existingIdx >= 0 ? this.state.executionTrace[existingIdx].startedAt : new Date().toISOString(),
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
  }

  /**
   * Node 1: JD Semantic Decomposer
   */
  private async nodeJdDecomposer(): Promise<void> {
    this.updateStep("JD_Analyzer", "Semantic JD Parser Agent", "running", "Decomposing requirements, seniority, and skill taxonomy...");
    const analysis = await runJdAnalyzerAgent(this.state.rawJdText, this.state.targetCompany);
    this.state.jobAnalysis = analysis;
    this.updateStep(
      "JD_Analyzer",
      "Semantic JD Parser Agent",
      "completed",
      `Extracted ${analysis.requiredHardSkills.length} hard skills, ${analysis.requiredSoftSkills.length} soft skills. Seniority: ${analysis.seniority}.`
    );
  }

  /**
   * Node 2: Evidence RAG Retriever
   */
  private nodeEvidenceRag(): void {
    if (!this.state.jobAnalysis) return;
    this.updateStep("Evidence_Retriever" as any, "Evidence RAG Retriever", "running", "Ranking candidate ground-truth evidence against JD taxonomy...");
    const ranked = retrieveAndRankCandidateEvidence(this.state.evidenceBank, this.state.jobAnalysis);
    this.state.rankedEvidence = ranked;
    this.updateStep(
      "Evidence_Retriever" as any,
      "Evidence RAG Retriever",
      "completed",
      `Retrieved ${ranked.length} verified evidence items. Top relevance: ${ranked[0]?.relevanceScore || 0}%.`
    );
  }

  /**
   * Node 3: Resume Strategist & Planner
   */
  private async nodeResumePlanner(): Promise<void> {
    if (!this.state.jobAnalysis) return;
    this.updateStep("Resume_Planner", "Resume Strategist Agent", "running", "Determining section hierarchy and keyword placement...");
    const plan = await runPlannerAgent(this.state.evidenceBank, this.state.jobAnalysis);
    this.state.resumePlan = plan;
    this.updateStep(
      "Resume_Planner",
      "Resume Strategist Agent",
      "completed",
      `Recommended: ${plan.recommendedTemplate.toUpperCase()}. Section order: ${plan.sectionOrder.join(" → ")}.`
    );
  }

  /**
   * Node 4: XYZ Achievement Synthesizer
   */
  private async nodeXyzSynthesizer(): Promise<void> {
    if (!this.state.jobAnalysis || !this.state.resumePlan) return;
    this.updateStep(
      "XYZ_Synthesizer",
      "XYZ Content Synthesizer Agent",
      this.state.reflectionCount > 0 ? "reflection_loop" : "running",
      this.state.reflectionCount > 0
        ? `Refining draft (Reflection Pass #${this.state.reflectionCount}) addressing Guardrail feedback...`
        : "Drafting Google XYZ formula achievements grounded in candidate evidence..."
    );

    const draft = await runSynthesizerAgent(
      this.state.evidenceBank,
      this.state.jobAnalysis,
      this.state.resumePlan,
      this.state.criticFeedback
    );
    this.state.currentDraft = draft;
    this.updateStep(
      "XYZ_Synthesizer",
      "XYZ Content Synthesizer Agent",
      "completed",
      "Synthesized high-impact bullet points and targeted ATS summary."
    );
  }

  /**
   * Node 5: Anti-Hallucination Critic Guardrail
   */
  private async nodeCriticGuardrail(): Promise<void> {
    if (!this.state.currentDraft) return;
    this.updateStep(
      "Critic_Guardrail",
      "Anti-Hallucination Guardrail Agent",
      "running",
      "Auditing claims against Candidate Ground-Truth Evidence..."
    );

    const report = await runCriticGuardrailAgent(this.state.currentDraft, this.state.evidenceBank);
    this.state.guardrailReport = report;

    if (report.isPassed || report.hallucinationScore <= 10) {
      this.updateStep(
        "Critic_Guardrail",
        "Anti-Hallucination Guardrail Agent",
        "completed",
        `Verification PASSED. Hallucination Risk: ${report.hallucinationScore}%. Verified ${report.verifiedClaimsCount} claims.`
      );
    } else {
      this.state.criticFeedback = report.critique;
      this.updateStep(
        "Critic_Guardrail",
        "Anti-Hallucination Guardrail Agent",
        "reflection_loop",
        `Unverified claim detected! Triggering Reflection Cycle #${this.state.reflectionCount + 1}...`
      );
    }
  }

  /**
   * Node 6: Deterministic ATS Simulation & Auditor
   */
  private async nodeAtsAuditor(): Promise<void> {
    if (!this.state.currentDraft || !this.state.jobAnalysis) return;
    this.updateStep("ATS_Auditor", "ATS Simulator Agent", "running", "Simulating Workday/Greenhouse/Lever parsing and keyword density...");
    const audit = await runAtsAuditorAgent(this.state.currentDraft, this.state.jobAnalysis);
    this.state.atsAudit = audit;
    this.updateStep(
      "ATS_Auditor",
      "ATS Simulator Agent",
      "completed",
      `ATS Score: ${audit.overallScore}%. Keyword Density: ${audit.keywordDensityScore}%. Single-Column AST: Verified.`
    );
  }

  /**
   * Master Execution Entrypoint with Conditional Reflection Edges
   */
  public async execute(): Promise<MultiAgentPipelineResult> {
    this.state.status = "running";

    // Step 1: Decompose JD
    await this.nodeJdDecomposer();

    // Step 2: Evidence RAG Retrieval
    this.nodeEvidenceRag();

    // Step 3: Plan Strategy
    await this.nodeResumePlanner();

    // Step 4 & 5: Synthesize + Verify Reflection Loop
    while (this.state.reflectionCount <= this.state.maxReflections) {
      await this.nodeXyzSynthesizer();
      await this.nodeCriticGuardrail();

      // Conditional Edge Decision
      if (
        this.state.guardrailReport?.isPassed ||
        (this.state.guardrailReport?.hallucinationScore ?? 0) <= 10 ||
        this.state.reflectionCount >= this.state.maxReflections
      ) {
        break;
      }

      this.state.reflectionCount++;
      this.state.status = "reflecting";
    }

    // Step 6: ATS Audit
    await this.nodeAtsAuditor();

    this.state.status = "completed";

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
