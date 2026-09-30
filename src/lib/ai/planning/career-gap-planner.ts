import type {
  JobRequirement,
  EvidenceItem,
  EvidencePlan,
  EvidenceTask,
  RequirementEvidenceDecision,
} from "../evidence/evidence-types";
import { RequirementMatcher } from "../requirements/requirement-matcher";

/**
 * Counterfactual Career Gap Planner
 * Derives actionable evidence-building tasks and projects proof coverage improvements.
 */
export class CareerGapPlanner {
  /**
   * Generates a concrete Evidence Plan for a target role based on uncovered requirements.
   */
  public static generatePlan(
    candidateId: string,
    targetRole: string,
    targetJobId: string | undefined,
    requirements: JobRequirement[],
    evidencePool: EvidenceItem[]
  ): EvidencePlan {
    const { decisions, overallProofCoverage } = RequirementMatcher.matchAllRequirements(
      requirements,
      evidencePool
    );

    const missingDecisions = decisions.filter(
      (d) => d.status === "absent" || d.status === "user_asserted" || d.status === "partially_supported"
    );

    const planId = `plan_${Date.now()}`;
    const tasks: EvidenceTask[] = [];

    for (const [idx, decision] of missingDecisions.entries()) {
      const req = requirements.find((r) => r.id === decision.requirementId);
      const skillName = req?.normalizedSkills[0] || req?.requirementText || "Target Skill";

      tasks.push({
        id: `task_${planId}_${idx}`,
        planId,
        candidateId,
        title: `Build Verifiable ${skillName} Artifact`,
        description: `Implement and commit a production-grade ${skillName} module with automated tests to convert this requirement from ${decision.status.toUpperCase()} to SUPPORTED.`,
        missingSkill: skillName,
        expectedArtifacts: [
          `src/${skillName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_service.ts`,
          `tests/${skillName.toLowerCase().replace(/[^a-z0-9]/g, "_")}.test.ts`,
          `GitHub Actions CI Workflow`,
        ],
        priority: req?.importance === "high" ? "high" : "medium",
        status: "pending",
        createdAt: new Date().toISOString(),
      });
    }

    // Projected coverage if high-priority tasks are completed
    const projectedGain = Math.min(100 - overallProofCoverage, tasks.length * 12);
    const targetCoveragePct = Math.min(100, overallProofCoverage + projectedGain);

    return {
      id: planId,
      candidateId,
      targetRole,
      targetJobId,
      currentCoveragePct: overallProofCoverage,
      targetCoveragePct,
      tasks,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Simulates counterfactual coverage after completing a specific evidence task.
   */
  public static simulateTaskCompletion(
    currentPlan: EvidencePlan,
    completedTaskId: string
  ): EvidencePlan {
    const updatedTasks = currentPlan.tasks.map((t) =>
      t.id === completedTaskId
        ? { ...t, status: "verified" as const, completedAt: new Date().toISOString() }
        : t
    );

    const completedCount = updatedTasks.filter((t) => t.status === "verified").length;
    const progressGain = (completedCount / Math.max(1, updatedTasks.length)) * (currentPlan.targetCoveragePct - currentPlan.currentCoveragePct);
    const newCoverage = Math.min(100, Math.round(currentPlan.currentCoveragePct + progressGain));

    return {
      ...currentPlan,
      currentCoveragePct: newCoverage,
      tasks: updatedTasks,
      status: completedCount === updatedTasks.length ? "completed" : "active",
      updatedAt: new Date().toISOString(),
    };
  }
}
