/**
 * JobMate Evidence Domain Specification & Models
 * Defines the formal hierarchy of evidence, claims, conflicts, and verification states.
 */

export type EvidenceLevel =
  | "L0_USER_ASSERTION"
  | "L1_RESUME_CLAIM"
  | "L2_README_CLAIM"
  | "L3_MANIFEST_DEPENDENCY"
  | "L4_SOURCE_CODE"
  | "L5_COMMIT_PR"
  | "L6_TEST_CI"
  | "L7_EXTERNAL";

export type VerificationStatus =
  | "unverified"
  | "partially_verified"
  | "verified"
  | "conflicted"
  | "stale"
  | "rejected";

export type MetricEvidence = {
  metricName: string;
  observedValue: string | number;
  unit?: string | undefined;
  sourceContext?: string | undefined;
  isQuantified: boolean;
};

export interface EvidenceItem {
  id: string;
  candidateId: string;
  sourceType: "github" | "resume" | "experience" | "project" | "education" | "external";
  evidenceLevel: EvidenceLevel;
  verificationStatus: VerificationStatus;
  title: string;
  content: string;
  sourceUri?: string | undefined;
  repository?: string | undefined;
  filePath?: string | undefined;
  lineStart?: number | undefined;
  lineEnd?: number | undefined;
  commitSha?: string | undefined;
  pullRequestNumber?: number | undefined;
  observedAt: string;
  technologies: string[];
  concepts: string[];
  metrics: MetricEvidence[];
  confidence: number;
  contentHash?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
  embedding?: number[] | undefined;
}

export type RelationshipType =
  | "SUPPORTS"
  | "DERIVED_FROM"
  | "EXTENDS"
  | "CONFLICTS_WITH"
  | "SUPERSEDES";

export interface EvidenceRelationship {
  id: string;
  candidateId: string;
  sourceEvidenceId: string;
  targetEvidenceId: string;
  relationshipType: RelationshipType;
  confidence: number;
  createdAt: string;
}

export type ConflictType =
  | "TIMELINE_MISMATCH"
  | "METRIC_UNSUPPORTED"
  | "TECH_UNVERIFIED"
  | "SOURCE_DISCREPANCY";

export interface EvidenceConflict {
  id: string;
  candidateId: string;
  conflictType: ConflictType;
  title: string;
  description: string;
  claimId?: string | undefined;
  evidenceIds: string[];
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "resolved" | "ignored";
  createdAt: string;
  resolvedAt?: string | undefined;
}

export interface JobRequirement {
  id: string;
  jobId?: string | undefined;
  candidateId: string;
  requirementText: string;
  category: "technical" | "responsibility" | "seniority" | "domain" | "education";
  normalizedSkills: string[];
  importance: "low" | "medium" | "high";
  evidenceNeeded: string[];
  confidence: number;
  createdAt: string;
}

export interface RequirementEvidenceDecision {
  requirementId: string;
  candidateId: string;
  matchedEvidenceIds: string[];
  status:
    | "supported"
    | "partially_supported"
    | "user_asserted"
    | "conflicted"
    | "stale"
    | "absent";
  proofScore: number;
  evidenceDiversity: number;
  explanation: string;
}

export interface AtomicFact {
  factText: string;
  category: "technology_usage" | "metric_claim" | "leadership_claim" | "timeline_claim";
  status: "verified" | "partially_verified" | "unsupported" | "conflicted";
  matchedEvidenceIds: string[];
  confidence: number;
}

export interface CandidateClaim {
  id: string;
  candidateId: string;
  claimText: string;
  atomicFacts: AtomicFact[];
  status: "verified" | "partially_verified" | "unsupported" | "conflicted" | "blocked";
  confidence: number;
  evidenceIds: string[];
  createdAt: string;
  verifiedAt?: string | undefined;
}

export interface EvidencePlan {
  id: string;
  candidateId: string;
  targetRole: string;
  targetJobId?: string | undefined;
  currentCoveragePct: number;
  targetCoveragePct: number;
  tasks: EvidenceTask[];
  status: "active" | "completed" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceTask {
  id: string;
  planId: string;
  candidateId: string;
  title: string;
  description: string;
  missingSkill: string;
  expectedArtifacts: string[];
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "verified" | "dismissed";
  createdAt: string;
  completedAt?: string | undefined;
}

export interface EvidenceAcquisitionPlan {
  requirementId: string;
  missingSkill: string;
  recommendedAction: "search_repositories" | "search_manifests" | "request_user_artifact" | "suggest_project_task";
  actionDetails: string;
  suggestedTask?: EvidenceTask | undefined;
}

/**
 * Weights assigned to each evidence tier
 */
export const EVIDENCE_LEVEL_WEIGHTS: Record<EvidenceLevel, number> = {
  L0_USER_ASSERTION: 0.15,
  L1_RESUME_CLAIM: 0.35,
  L2_README_CLAIM: 0.50,
  L3_MANIFEST_DEPENDENCY: 0.70,
  L4_SOURCE_CODE: 0.88,
  L5_COMMIT_PR: 0.92,
  L6_TEST_CI: 0.96,
  L7_EXTERNAL: 0.99,
};
