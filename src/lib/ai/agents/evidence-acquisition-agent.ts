import { z } from "zod";
import { generateStructuredOutput } from "../structured-output";
import type {
  JobRequirement,
  EvidenceItem,
  EvidenceTask,
} from "../evidence/evidence-types";

export interface EvidenceAcquisitionPlan {
  requirementId: string;
  missingSkill: string;
  recommendedAction: "search_repositories" | "search_manifests" | "request_user_artifact" | "suggest_project_task";
  actionDetails: string;
  suggestedTask?: EvidenceTask | undefined;
}

const EvidenceAcquisitionSchema = z.object({
  plans: z.array(
    z.object({
      missingSkill: z.string(),
      recommendedAction: z.enum(["search_repositories", "search_manifests", "request_user_artifact", "suggest_project_task"]),
      actionDetails: z.string(),
      suggestedTaskTitle: z.string().optional(),
      suggestedTaskDescription: z.string().optional(),
      expectedArtifacts: z.array(z.string()).optional(),
    })
  ),
});

/**
 * Autonomous Evidence Acquisition Agent
 * Investigates connected sources or plans concrete artifact creation for uncovered job requirements.
 */
export class EvidenceAcquisitionAgent {
  public static async planMissingEvidenceAcquisition(
    candidateId: string,
    uncoveredRequirements: JobRequirement[],
    existingEvidence: EvidenceItem[]
  ): Promise<EvidenceAcquisitionPlan[]> {
    if (uncoveredRequirements.length === 0) return [];

    const systemPrompt = `You are the JobMate Evidence Acquisition Agent.
Your goal is to resolve missing candidate proof for critical job requirements without fabricating claims.
For each uncovered requirement, determine the optimal acquisition strategy:
1. 'search_repositories': query other connected GitHub repos
2. 'search_manifests': inspect package/dependency lockfiles
3. 'request_user_artifact': ask candidate to provide verification link or document
4. 'suggest_project_task': propose concrete engineering work (e.g. adding deployment manifest or benchmark test)`;

    const userPrompt = `Uncovered Job Requirements:
${JSON.stringify(
  uncoveredRequirements.map((r) => ({
    id: r.id,
    skill: r.normalizedSkills.join(", "),
    category: r.category,
    evidenceNeeded: r.evidenceNeeded,
  })),
  null,
  2
)}

Existing Candidate Tech Evidence Count: ${existingEvidence.length}

Generate structured acquisition plans for these requirements.`;

    try {
      const result = await generateStructuredOutput({
        schema: EvidenceAcquisitionSchema,
        schemaName: "EvidenceAcquisitionPlans",
        systemPrompt,
        userPrompt,
        temperature: 0.1,
        maxRetries: 1,
      });

      return result.data.plans.map((p, idx) => {
        const req = uncoveredRequirements[idx] || uncoveredRequirements[0];
        const task: EvidenceTask | undefined = p.suggestedTaskTitle
          ? {
              id: `task_${Date.now()}_${idx}`,
              planId: `plan_${Date.now()}`,
              candidateId,
              title: p.suggestedTaskTitle,
              description: p.suggestedTaskDescription || p.actionDetails,
              missingSkill: p.missingSkill,
              expectedArtifacts: p.expectedArtifacts || ["source code", "test file"],
              priority: "high",
              status: "pending",
              createdAt: new Date().toISOString(),
            }
          : undefined;

        return {
          requirementId: req?.id || `req_${Date.now()}`,
          missingSkill: p.missingSkill,
          recommendedAction: p.recommendedAction,
          actionDetails: p.actionDetails,
          suggestedTask: task,
        };
      });
    } catch {
      return uncoveredRequirements.map((req, idx) => ({
        requirementId: req.id,
        missingSkill: req.normalizedSkills[0] || req.requirementText,
        recommendedAction: "suggest_project_task",
        actionDetails: `Add concrete ${req.normalizedSkills[0] || "feature"} implementation to an existing GitHub repository to build verifiable evidence.`,
        suggestedTask: {
          id: `task_fallback_${Date.now()}_${idx}`,
          planId: `plan_${Date.now()}`,
          candidateId,
          title: `Implement ${req.normalizedSkills[0] || "Requirement"} Artifact`,
          description: `Create a dedicated module and unit tests demonstrating proficiency in ${req.normalizedSkills[0] || "this requirement"}.`,
          missingSkill: req.normalizedSkills[0] || req.requirementText,
          expectedArtifacts: ["implementation file", "test suite"],
          priority: "high",
          status: "pending",
          createdAt: new Date().toISOString(),
        },
      }));
    }
  }
}
