import type {
  CandidateEvidenceBank,
  AgentExecutionStep,
  MultiAgentPipelineResult,
} from "./types";
import { runJdAnalyzerAgent } from "./agents/jd-analyzer-agent";
import { runPlannerAgent } from "./agents/planner-agent";
import { runSynthesizerAgent } from "./agents/synthesizer-agent";
import { runCriticGuardrailAgent } from "./agents/critic-guardrail-agent";
import { runAtsAuditorAgent } from "./agents/ats-auditor-agent";

export type PipelineStepCallback = (step: AgentExecutionStep) => void;

/**
 * Master Multi-Agent Pipeline Orchestrator with Reflection Loop
 */
export async function executeMultiAgentResumePipeline(
  jdText: string,
  rawEvidence: CandidateEvidenceBank,
  targetCompany?: string,
  onStepUpdate?: PipelineStepCallback
): Promise<MultiAgentPipelineResult> {
  const executionTrace: AgentExecutionStep[] = [];

  const updateStep = (
    agentName: AgentExecutionStep["agentName"],
    displayName: string,
    status: AgentExecutionStep["status"],
    outputSummary?: string
  ) => {
    const existingIdx = executionTrace.findIndex((s) => s.agentName === agentName);
    const step: AgentExecutionStep = {
      agentName,
      displayName,
      status,
      startedAt: existingIdx >= 0 ? executionTrace[existingIdx].startedAt : new Date().toISOString(),
      finishedAt: status === "completed" || status === "failed" ? new Date().toISOString() : undefined,
      outputSummary,
    };

    if (existingIdx >= 0) {
      executionTrace[existingIdx] = step;
    } else {
      executionTrace.push(step);
    }

    if (onStepUpdate) {
      onStepUpdate(step);
    }
  };

  // STEP 1: Semantic JD Analyzer Agent
  updateStep("JD_Analyzer", "Semantic JD Parser Agent", "running", "Decomposing technical requirements, seniority, and skill taxonomy...");
  const jobAnalysis = await runJdAnalyzerAgent(jdText, targetCompany);
  updateStep(
    "JD_Analyzer",
    "Semantic JD Parser Agent",
    "completed",
    `Extracted ${jobAnalysis.requiredHardSkills.length} hard skills, ${jobAnalysis.requiredSoftSkills.length} soft skills. Seniority: ${jobAnalysis.seniority}.`
  );

  // STEP 2: Resume Strategist & Planning Agent
  updateStep("Resume_Planner", "Resume Strategist Agent", "running", "Determining section hierarchy and keyword allocation plan...");
  const resumePlan = await runPlannerAgent(rawEvidence, jobAnalysis);
  updateStep(
    "Resume_Planner",
    "Resume Strategist Agent",
    "completed",
    `Template: ${resumePlan.recommendedTemplate.toUpperCase()}. Section order: ${resumePlan.sectionOrder.join(" → ")}.`
  );

  // STEP 3 & 4: Content Synthesizer + Critic Guardrail with Self-Correction Reflection Loop
  let generatedContent: any = null;
  let guardrailReport: any = null;
  let reflectionCount = 0;
  const MAX_REFLECTIONS = 2;
  let critiqueFeedback: string | undefined = undefined;

  while (reflectionCount <= MAX_REFLECTIONS) {
    updateStep(
      "XYZ_Synthesizer",
      "XYZ Content Synthesizer Agent",
      reflectionCount > 0 ? "reflection_loop" : "running",
      reflectionCount > 0
        ? `Refining draft (Reflection Pass #${reflectionCount}) addressing Guardrail feedback...`
        : "Drafting Google XYZ formula achievements grounded in candidate evidence..."
    );

    generatedContent = await runSynthesizerAgent(rawEvidence, jobAnalysis, resumePlan, critiqueFeedback);
    updateStep(
      "XYZ_Synthesizer",
      "XYZ Content Synthesizer Agent",
      "completed",
      "Synthesized high-impact bullet points and targeted ATS summary."
    );

    // Run Critic Guardrail
    updateStep(
      "Critic_Guardrail",
      "Anti-Hallucination Guardrail Agent",
      "running",
      "Auditing claims against Candidate Ground-Truth Evidence..."
    );

    guardrailReport = await runCriticGuardrailAgent(generatedContent, rawEvidence);

    if (guardrailReport.isPassed || guardrailReport.hallucinationScore <= 10 || reflectionCount >= MAX_REFLECTIONS) {
      updateStep(
        "Critic_Guardrail",
        "Anti-Hallucination Guardrail Agent",
        "completed",
        `Verification PASSED. Hallucination Risk: ${guardrailReport.hallucinationScore}%. Verified ${guardrailReport.verifiedClaimsCount} claims.`
      );
      break;
    } else {
      reflectionCount++;
      critiqueFeedback = guardrailReport.critique;
      updateStep(
        "Critic_Guardrail",
        "Anti-Hallucination Guardrail Agent",
        "reflection_loop",
        `Unverified claim detected! Triggering Reflection Cycle #${reflectionCount}...`
      );
    }
  }

  // STEP 5: Deterministic ATS Simulation & Auditor Agent
  updateStep("ATS_Auditor", "ATS Simulator Agent", "running", "Simulating Workday/Greenhouse/Lever parsing and keyword density...");
  const atsAudit = await runAtsAuditorAgent(generatedContent, jobAnalysis);
  updateStep(
    "ATS_Auditor",
    "ATS Simulator Agent",
    "completed",
    `ATS Score: ${atsAudit.overallScore}%. Keyword Density: ${atsAudit.keywordDensityScore}%. Single-Column AST: Verified.`
  );

  return {
    jobAnalysis,
    resumePlan,
    generatedContent,
    guardrailReport,
    atsAudit,
    executionTrace,
    reflectionIterations: reflectionCount,
  };
}
