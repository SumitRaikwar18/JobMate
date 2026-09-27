import type {
  CandidateEvidenceBank,
  AgentExecutionStep,
  MultiAgentPipelineResult,
} from "./types";
import { ResumeStateGraph, type StateGraphStepCallback } from "./state-graph";

export type PipelineStepCallback = StateGraphStepCallback;

/**
 * Master Multi-Agent Pipeline Orchestrator powered by LangGraph-style ResumeStateGraph
 */
export async function executeMultiAgentResumePipeline(
  jdText: string,
  rawEvidence: CandidateEvidenceBank,
  targetCompany?: string,
  onStepUpdate?: PipelineStepCallback
): Promise<MultiAgentPipelineResult> {
  const stateGraph = new ResumeStateGraph(
    jdText,
    rawEvidence,
    targetCompany,
    onStepUpdate
  );

  return await stateGraph.execute();
}

export { ResumeStateGraph } from "./state-graph";
