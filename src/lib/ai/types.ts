/**
 * JobMate AI Engineering Type Definitions
 * Multi-Agent System, Guardrails, and Evidence Graph
 */

export interface CandidateEvidenceItem {
  id: string;
  category: "experience" | "project" | "education" | "skill" | "certification";
  title: string;
  organization?: string | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
  dateRange?: string | undefined;
  verifiedClaims: string[];
  metrics: string[];
  technologiesUsed: string[];
  sourceUrl?: string | undefined;
}

export interface CandidateEvidenceBank {
  candidateId: string;
  fullName: string;
  targetRole: string;
  evidenceItems: CandidateEvidenceItem[];
}

export interface JobAnalysisResult {
  roleTitle: string;
  company: string;
  seniority: "Intern" | "Junior" | "Mid-Level" | "Senior" | "Lead" | "Staff";
  requiredHardSkills: string[];
  requiredSoftSkills: string[];
  domainKeywords: string[];
  responsibilities: string[];
  keyChallenges: string[];
  overallMatchScore: number;
}

export interface ResumePlan {
  strategySummary: string;
  recommendedTemplate: "modern" | "classic" | "minimal" | "executive";
  sectionOrder: string[];
  selectedEvidenceIds: string[];
  keywordTargetingMap: Record<string, string[]>; // Section -> Keywords to embed
}

export interface GeneratedResumeSection {
  sectionTitle: string;
  items: Array<{
    title: string;
    subtitle?: string | undefined;
    dateRange?: string | undefined;
    location?: string | undefined;
    bullets: string[];
    evidenceSourceId?: string | undefined;
  }>;
}

export interface GuardrailValidationReport {
  isPassed: boolean;
  hallucinationScore: number; // 0 (no hallucination) to 100 (severe hallucination)
  verifiedClaimsCount: number;
  flaggedClaims: Array<{
    claimText: string;
    reason: string;
    suggestedFix: string;
  }>;
  critique: string;
}

export interface AtsSimulationAudit {
  overallScore: number;
  keywordDensityScore: number;
  actionVerbScore: number;
  quantifiableImpactScore: number;
  formatComplianceScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  strongActionVerbs: string[];
  weakActionVerbsDetected: string[];
  parserChecklist: Array<{
    rule: string;
    passed: boolean;
    explanation: string;
  }>;
}

export type AgentPipelineStepStatus = "pending" | "running" | "completed" | "failed" | "reflection_loop";

export interface AgentExecutionStep {
  agentName: "JD_Analyzer" | "Evidence_Retriever" | "Resume_Planner" | "XYZ_Synthesizer" | "Critic_Guardrail" | "ATS_Auditor";
  displayName: string;
  status: AgentPipelineStepStatus;
  startedAt?: string | undefined;
  finishedAt?: string | undefined;
  outputSummary?: string | undefined;
  reflectionCount?: number | undefined;
}

export interface MultiAgentPipelineResult {
  jobAnalysis: JobAnalysisResult;
  resumePlan: ResumePlan;
  generatedContent: any;
  guardrailReport: GuardrailValidationReport;
  atsAudit: AtsSimulationAudit;
  executionTrace: AgentExecutionStep[];
  reflectionIterations: number;
}
