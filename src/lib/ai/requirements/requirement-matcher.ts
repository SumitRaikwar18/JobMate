import type {
  JobRequirement,
  EvidenceItem,
  RequirementEvidenceDecision,
  EvidenceLevel,
} from "../evidence/evidence-types";
import { EVIDENCE_LEVEL_WEIGHTS } from "../evidence/evidence-types";

/**
 * Requirement Evidence Matcher
 * Computes multi-signal proof coverage, evidence diversity, and explainable justifications.
 */
export class RequirementMatcher {
  public static matchRequirement(
    requirement: JobRequirement,
    candidateEvidence: EvidenceItem[]
  ): RequirementEvidenceDecision {
    const candidateId = requirement.candidateId;
    const reqSkills = requirement.normalizedSkills.map((s) => s.toLowerCase());

    // 1. Identify relevant evidence items matching skills or requirement text
    const matchedItems = candidateEvidence.filter((ev) => {
      const hasTechMatch = ev.technologies.some((t) =>
        reqSkills.some((rs) => rs === t.toLowerCase() || rs.includes(t.toLowerCase()) || t.toLowerCase().includes(rs))
      );
      const hasConceptMatch = ev.concepts.some((c) =>
        requirement.requirementText.toLowerCase().includes(c.toLowerCase())
      );
      return hasTechMatch || hasConceptMatch;
    });

    if (matchedItems.length === 0) {
      return {
        requirementId: requirement.id,
        candidateId,
        matchedEvidenceIds: [],
        status: "absent",
        proofScore: 0,
        evidenceDiversity: 0,
        explanation: `No candidate evidence (repositories, manifests, tests, or verified achievements) found demonstrating ${requirement.requirementText}.`,
      };
    }

    // 2. Compute Evidence Diversity (unique source repositories, files, and tiers)
    const distinctSourceTypes = new Set(matchedItems.map((e) => e.evidenceLevel));
    const distinctFiles = new Set(matchedItems.map((e) => e.filePath || e.sourceUri || e.title));
    const diversityCount = distinctSourceTypes.size + Math.min(distinctFiles.size, 3);

    // 3. Assess highest evidence tier
    const levels = matchedItems.map((e) => e.evidenceLevel as EvidenceLevel);
    const hasSourceCode = levels.includes("L4_SOURCE_CODE");
    const hasTestOrCi = levels.includes("L6_TEST_CI");
    const hasDependency = levels.includes("L3_MANIFEST_DEPENDENCY");
    const isOnlyUserAssertion = levels.every((l) => l === "L0_USER_ASSERTION" || l === "L1_RESUME_CLAIM");

    // 4. Compute Weighted Proof Score
    let maxTierWeight = 0;
    for (const lvl of levels) {
      const w = EVIDENCE_LEVEL_WEIGHTS[lvl] || 0.3;
      if (w > maxTierWeight) maxTierWeight = w;
    }

    const diversityMultiplier = Math.min(1.15, 1.0 + (diversityCount - 1) * 0.05);
    const rawScore = Math.min(100, Math.round(maxTierWeight * 100 * diversityMultiplier));

    // 5. Determine Formal Verification Status
    let status: RequirementEvidenceDecision["status"] = "partially_supported";
    if (isOnlyUserAssertion) {
      status = "user_asserted";
    } else if (hasSourceCode && (hasDependency || hasTestOrCi)) {
      status = "supported";
    } else if (rawScore >= 70) {
      status = "supported";
    } else if (rawScore >= 35) {
      status = "partially_supported";
    }

    const explanationSources = matchedItems
      .slice(0, 3)
      .map((i) => `✓ ${i.title} [${i.evidenceLevel}]`)
      .join("\n");

    const explanation = `Corroborated across ${diversityCount} independent signals (Highest Tier: ${levels[0] || "L1"}):\n${explanationSources}`;

    return {
      requirementId: requirement.id,
      candidateId,
      matchedEvidenceIds: matchedItems.map((e) => e.id),
      status,
      proofScore: rawScore,
      evidenceDiversity: diversityCount,
      explanation,
    };
  }

  /**
   * Matches all requirements for a job and returns overall proof coverage percentage.
   */
  public static matchAllRequirements(
    requirements: JobRequirement[],
    candidateEvidence: EvidenceItem[]
  ): {
    decisions: RequirementEvidenceDecision[];
    overallProofCoverage: number;
    supportedCount: number;
    absentCount: number;
  } {
    if (requirements.length === 0) {
      return {
        decisions: [],
        overallProofCoverage: 0,
        supportedCount: 0,
        absentCount: 0,
      };
    }

    const decisions = requirements.map((req) => this.matchRequirement(req, candidateEvidence));
    const totalScore = decisions.reduce((acc, d) => acc + d.proofScore, 0);
    const overallProofCoverage = Math.round(totalScore / requirements.length);
    const supportedCount = decisions.filter((d) => d.status === "supported").length;
    const absentCount = decisions.filter((d) => d.status === "absent").length;

    return {
      decisions,
      overallProofCoverage,
      supportedCount,
      absentCount,
    };
  }
}
