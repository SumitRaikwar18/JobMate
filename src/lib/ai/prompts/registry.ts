export interface PromptDefinition {
  agentName: string;
  version: string;
  recommendedModel: string;
  temperature: number;
  schemaVersion: string;
  description: string;
  systemPrompt: string;
  userPromptTemplate: (vars: Record<string, string>) => string;
}

export const PROMPT_REGISTRY: Record<string, PromptDefinition> = {
  "jd_analyzer:v1.2": {
    agentName: "jd_analyzer",
    version: "v1.2",
    recommendedModel: "openai/gpt-4o-mini",
    temperature: 0.1,
    schemaVersion: "1.0.0",
    description: "Decomposes unstructured job descriptions into structured requirement graphs.",
    systemPrompt: `You are the Lead JD Analyzer AI Agent in JobMate.
Analyze the target job description objectively and extract required hard skills, soft skills, seniority level, core responsibilities, and domain keywords.
Do NOT invent requirements not mentioned in the text. Return structured JSON matching the JobDescriptionAnalysis schema.`,
    userPromptTemplate: ({ jdText, company }) =>
      `Analyze the following Job Posting${company ? ` for ${company}` : ""}:\n\n${jdText}`,
  },

  "planner:v1.1": {
    agentName: "planner",
    version: "v1.1",
    recommendedModel: "openai/gpt-4o-mini",
    temperature: 0.2,
    schemaVersion: "1.0.0",
    description: "Constructs tailored resume layout strategy and evidence prioritization.",
    systemPrompt: `You are the Executive Resume Strategy Planner AI in JobMate.
Formulate an ATS-optimized, high-impact resume blueprint mapping candidate evidence to target job requirements.
Prioritize verified technical evidence. Do NOT invent achievements.`,
    userPromptTemplate: ({ jobAnalysisJson, evidenceSummaryJson }) =>
      `Job Requirements Graph:\n${jobAnalysisJson}\n\nCandidate Evidence Pool:\n${evidenceSummaryJson}\n\nProduce the optimal Resume Blueprint with template, section ordering, and keyword distribution.`,
  },

  "synthesizer:v2.0": {
    agentName: "synthesizer",
    version: "v2.0",
    recommendedModel: "openai/gpt-4o-mini",
    temperature: 0.2,
    schemaVersion: "2.0.0",
    description: "Synthesizes evidence-grounded Google XYZ bullet points without hallucinations.",
    systemPrompt: `You are the Grounded Resume Synthesizer AI Agent in JobMate.
Generate ATS-first resume content STRICTLY derived from candidate evidence.
CRITICAL MANDATE:
1. Every accomplishment bullet MUST follow the Google XYZ formula: "Accomplished [X], as measured by [Y], by doing [Z]".
2. You MUST NEVER invent fake metrics, percentages, or companies not present in the evidence.
3. If no quantitative metric exists in the evidence, state the technical action clearly without hallucinating numbers.
4. Link every generated claim to its source evidence IDs.`,
    userPromptTemplate: ({ blueprintJson, evidenceBankJson }) =>
      `Resume Strategy Blueprint:\n${blueprintJson}\n\nCandidate Evidence Bank:\n${evidenceBankJson}\n\nGenerate the complete structured resume draft.`,
  },

  "critic_guardrail:v1.3": {
    agentName: "critic_guardrail",
    version: "v1.3",
    recommendedModel: "openai/gpt-4o-mini",
    temperature: 0.0,
    schemaVersion: "1.0.0",
    description: "Deterministic adversarial verifier checking every resume claim against evidence.",
    systemPrompt: `You are the Adversarial Grounding Critic & Guardrail Agent in JobMate.
Your mission is ZERO TOLERANCE for hallucinations.
Verify every claim in the generated resume against candidate evidence.
Flag any claim that exaggerates, invents metrics (e.g. 99.99% uptime, 10x speedup), or cites tools not in evidence.
If hallucinated metrics or unsupported claims exist, set isPassed: false, list flagged claims with exact reasons, and provide constructive correction feedback.`,
    userPromptTemplate: ({ draftJson, evidenceBankJson }) =>
      `Candidate Evidence Bank:\n${evidenceBankJson}\n\nGenerated Resume Draft:\n${draftJson}\n\nPerform exhaustive adversarial verification.`,
  },

  "ats_auditor:v1.1": {
    agentName: "ats_auditor",
    version: "v1.1",
    recommendedModel: "openai/gpt-4o-mini",
    temperature: 0.1,
    schemaVersion: "1.0.0",
    description: "Objective ATS compatibility and heuristic keyword matching auditor.",
    systemPrompt: `You are the ATS Compatibility & Resume Heuristic Analyzer for JobMate.
Perform an objective analysis of how well the candidate's resume matches the job description.
Score keyword coverage, action verb strength, quantifiable impact density, and single-column ATS format compatibility.
Provide realistic scores and explain missing high-priority keywords.`,
    userPromptTemplate: ({ draftJson, jobAnalysisJson }) =>
      `Target Job Requirements:\n${jobAnalysisJson}\n\nResume Draft:\n${draftJson}\n\nEvaluate ATS compatibility and keyword alignment.`,
  },

  "reranker:v1.0": {
    agentName: "reranker",
    version: "v1.0",
    recommendedModel: "openai/gpt-4o-mini",
    temperature: 0.1,
    schemaVersion: "1.0.0",
    description: "Cross-encoder structured reranker scoring evidence relevance to job requirements.",
    systemPrompt: `You are an expert technical recruiter and AI evaluation reranker.
Score candidate evidence snippets from 0.0 to 1.0 against target job requirements. Provide concise reasoning.`,
    userPromptTemplate: ({ requirement, evidenceSnippetsJson }) =>
      `Job Requirement: "${requirement}"\n\nEvidence Items:\n${evidenceSnippetsJson}\n\nScore and explain relevance for each item.`,
  },
};

/**
 * Get prompt definition from registry with fallback to latest version
 */
export function getPromptDefinition(agentName: string, version?: string): PromptDefinition {
  const key = version ? `${agentName}:${version}` : Object.keys(PROMPT_REGISTRY).find((k) => k.startsWith(`${agentName}:`));
  const prompt = key ? PROMPT_REGISTRY[key] : undefined;

  if (!prompt) {
    throw new Error(`Prompt definition not found for agent: "${agentName}", version: "${version || "latest"}"`);
  }

  return prompt;
}
