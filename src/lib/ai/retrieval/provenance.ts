import type { EvidenceItem } from "../schemas/evidence-schema";
import type { ResumeClaim } from "../schemas/resume-draft-schema";

export interface ClaimProvenanceRecord {
  claimId: string;
  claimText: string;
  evidenceId: string;
  evidenceSourceType: string;
  evidenceTitle: string;
  evidenceExcerpt: string;
  confidenceScore: number;
  verificationStatus: "grounded" | "partially_grounded" | "unsupported" | "verification_unavailable";
  matchedTechnologies: string[];
  matchedMetrics: string[];
  explanation: string;
}

export interface GroundingAuditSummary {
  totalClaims: number;
  groundedClaimsCount: number;
  unsupportedClaimsCount: number;
  groundingRatePercentage: number;
  claims: ClaimProvenanceRecord[];
}

/**
 * Builds deterministic provenance records linking generated resume claims to source evidence
 */
export function buildClaimProvenanceRecords(
  generatedClaims: ResumeClaim[],
  evidencePool: EvidenceItem[]
): ClaimProvenanceRecord[] {
  const evidenceMap = new Map<string, EvidenceItem>();
  for (const item of evidencePool) {
    evidenceMap.set(item.id, item);
  }

  return generatedClaims.map((claim, idx) => {
    const claimId = claim.id || `claim-${idx + 1}`;
    const claimContent = claim.text || claim.claimText || "";
    const primaryEvidenceId = claim.evidenceIds[0] || "";
    const evidenceItem = primaryEvidenceId ? evidenceMap.get(primaryEvidenceId) : undefined;

    if (!evidenceItem) {
      return {
        claimId,
        claimText: claimContent,
        evidenceId: primaryEvidenceId || "none",
        evidenceSourceType: "untracked",
        evidenceTitle: "No direct evidence linked",
        evidenceExcerpt: "No backing record found in candidate evidence bank.",
        confidenceScore: 0.0,
        verificationStatus: "unsupported",
        matchedTechnologies: [],
        matchedMetrics: [],
        explanation: "This statement does not link to any verified candidate evidence item in the evidence bank.",
      };
    }

    // Check overlap of claim words with evidence content
    const claimWords: string[] = claimContent
      .toLowerCase()
      .split(/\W+/)
      .filter((w: string) => w.length > 3);
    const evidenceWords = new Set(
      `${evidenceItem.content} ${(evidenceItem.technologies || []).join(" ")}`
        .toLowerCase()
        .split(/\W+/)
    );

    let matchCount = 0;
    for (const w of claimWords) {
      if (evidenceWords.has(w)) matchCount++;
    }

    const overlapRatio = claimWords.length > 0 ? matchCount / claimWords.length : 0;
    const confidenceScore = Number(Math.min(1, Math.max(0.4, overlapRatio * 1.2)).toFixed(2));

    const matchedTechs = (evidenceItem.technologies || []).filter((t) =>
      claimContent.toLowerCase().includes(t.toLowerCase())
    );

    const matchedMetrics = (evidenceItem.metrics || [])
      .filter((m) => claimContent.toLowerCase().includes(m.metricValue.toLowerCase()))
      .map((m) => m.metricValue);

    const isGrounded = (claim.isVerified ?? (claim.status === "supported")) && overlapRatio >= 0.25;

    return {
      claimId,
      claimText: claimContent,
      evidenceId: evidenceItem.id,
      evidenceSourceType: evidenceItem.sourceType,
      evidenceTitle: evidenceItem.title || `${evidenceItem.sourceType} record`,
      evidenceExcerpt: evidenceItem.content.slice(0, 250),
      confidenceScore,
      verificationStatus: isGrounded ? "grounded" : "partially_grounded",
      matchedTechnologies: matchedTechs,
      matchedMetrics: matchedMetrics,
      explanation: isGrounded
        ? `Grounded in ${evidenceItem.sourceType} "${evidenceItem.title || evidenceItem.id}". Verified matching technologies: ${matchedTechs.join(", ") || "aligned"}.`
        : `Partially grounded in ${evidenceItem.sourceType}. Candidate should verify exact metrics and phrasing before submission.`,
    };
  });
}

/**
 * Computes grounding rate and summary audit
 */
export function auditResumeGrounding(
  generatedClaims: ResumeClaim[],
  evidencePool: EvidenceItem[]
): GroundingAuditSummary {
  const records = buildClaimProvenanceRecords(generatedClaims, evidencePool);
  const grounded = records.filter((r) => r.verificationStatus === "grounded").length;
  const unsupported = records.filter((r) => r.verificationStatus === "unsupported").length;
  const rate = records.length > 0 ? Math.round((grounded / records.length) * 100) : 100;

  return {
    totalClaims: records.length,
    groundedClaimsCount: grounded,
    unsupportedClaimsCount: unsupported,
    groundingRatePercentage: rate,
    claims: records,
  };
}
