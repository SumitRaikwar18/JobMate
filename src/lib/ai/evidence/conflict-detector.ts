import type {
  EvidenceItem,
  EvidenceConflict,
  AtomicFact,
  ConflictType,
} from "./evidence-types";

/**
 * Deterministic Conflict Detection Engine
 * Inspects candidate evidence against claims, repository timestamps, and metrics.
 */
export class EvidenceConflictDetector {
  /**
   * Evaluates atomic facts extracted from a resume or claim against the candidate's evidence bank.
   */
  public static detectConflicts(
    candidateId: string,
    claimId: string,
    atomicFacts: AtomicFact[],
    evidencePool: EvidenceItem[]
  ): EvidenceConflict[] {
    const conflicts: EvidenceConflict[] = [];

    for (const fact of atomicFacts) {
      // 1. Metric Unsupported Conflict Check
      if (fact.category === "metric_claim") {
        const hasQuantifiedProof = evidencePool.some((ev) => {
          if (!ev.metrics || ev.metrics.length === 0) return false;
          return ev.evidenceLevel === "L6_TEST_CI" || ev.evidenceLevel === "L4_SOURCE_CODE";
        });

        if (!hasQuantifiedProof) {
          conflicts.push({
            id: `conflict_metric_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            candidateId,
            claimId,
            conflictType: "METRIC_UNSUPPORTED",
            title: `Unproven Metric Claim: "${fact.factText}"`,
            description: `The statement asserts specific quantitative gains without supporting benchmark tests, telemetry logs, or performance test artifacts (L6/L4).`,
            evidenceIds: [],
            severity: "high",
            status: "open",
            createdAt: new Date().toISOString(),
          });
        }
      }

      // 2. Technology Unverified Check
      if (fact.category === "technology_usage") {
        const matchingEvidence = evidencePool.filter((ev) =>
          ev.technologies.some((t) => fact.factText.toLowerCase().includes(t.toLowerCase()))
        );

        if (matchingEvidence.length === 0) {
          conflicts.push({
            id: `conflict_tech_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            candidateId,
            claimId,
            conflictType: "TECH_UNVERIFIED",
            title: `Unverified Technology Assertion: "${fact.factText}"`,
            description: `No repository files, dependencies, or commits found demonstrating active usage of this technology.`,
            evidenceIds: [],
            severity: "medium",
            status: "open",
            createdAt: new Date().toISOString(),
          });
        }
      }

      // 3. Leadership / Team Scale Check
      if (fact.category === "leadership_claim") {
        const hasPrOrCommitProof = evidencePool.some(
          (ev) => ev.evidenceLevel === "L5_COMMIT_PR" || ev.evidenceLevel === "L7_EXTERNAL"
        );

        if (!hasPrOrCommitProof) {
          conflicts.push({
            id: `conflict_lead_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            candidateId,
            claimId,
            conflictType: "SOURCE_DISCREPANCY",
            title: `Unverified Leadership Claim: "${fact.factText}"`,
            description: `Claimed team leadership or governance lacks corroborating code review or pull request management artifacts.`,
            evidenceIds: [],
            severity: "low",
            status: "open",
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Detects chronological timeline conflicts between claimed years of experience and first commit/source dates.
   */
  public static detectTimelineConflicts(
    candidateId: string,
    techName: string,
    claimedYears: number,
    evidencePool: EvidenceItem[]
  ): EvidenceConflict | null {
    const techEvidence = evidencePool.filter((ev) =>
      ev.technologies.some((t) => t.toLowerCase() === techName.toLowerCase())
    );

    if (techEvidence.length === 0) return null;

    // Find oldest evidence observation
    const dates = techEvidence
      .map((ev) => new Date(ev.observedAt).getTime())
      .filter((time) => !isNaN(time));

    if (dates.length === 0) return null;

    const earliestTimestamp = Math.min(...dates);
    const monthsActive = (Date.now() - earliestTimestamp) / (1000 * 60 * 60 * 24 * 30.4);
    const observedYears = monthsActive / 12;

    if (claimedYears > observedYears + 1.5 && claimedYears > 2.0) {
      return {
        id: `conflict_time_${Date.now()}`,
        candidateId,
        conflictType: "TIMELINE_MISMATCH",
        title: `Timeline Discrepancy for ${techName}`,
        description: `Candidate claims ${claimedYears} years of ${techName} experience, but the earliest recorded repository activity was observed ${observedYears.toFixed(1)} years ago.`,
        evidenceIds: techEvidence.map((e) => e.id),
        severity: "medium",
        status: "open",
        createdAt: new Date().toISOString(),
      };
    }

    return null;
  }
}
