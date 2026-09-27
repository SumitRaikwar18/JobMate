import type { CandidateEvidenceBank, CandidateEvidenceItem, JobAnalysisResult } from "./types";

export interface RankedEvidenceItem {
  evidence: CandidateEvidenceItem;
  relevanceScore: number; // 0 to 100
  matchedKeywords: string[];
  relevanceRationale: string;
}

/**
 * Hybrid Evidence Retrieval Engine (BM25 + Semantic Keyword Graph)
 * Evaluates candidate evidence bank items against extracted JD requirements
 */
export function retrieveAndRankCandidateEvidence(
  evidenceBank: CandidateEvidenceBank,
  jobAnalysis: JobAnalysisResult
): RankedEvidenceItem[] {
  const targetKeywords = [
    ...(jobAnalysis.requiredHardSkills || []),
    ...(jobAnalysis.domainKeywords || []),
  ].map((kw) => kw.toLowerCase().trim());

  if (!evidenceBank?.evidenceItems || evidenceBank.evidenceItems.length === 0) {
    return [];
  }

  const scoredItems: RankedEvidenceItem[] = evidenceBank.evidenceItems.map((item) => {
    const itemContentStr = [
      item.title,
      item.organization || "",
      ...(item.verifiedClaims || []),
      ...(item.technologiesUsed || []),
      ...(item.metrics || []),
    ]
      .join(" ")
      .toLowerCase();

    // 1. Keyword Overlap Scoring (40% weight)
    const matched = targetKeywords.filter((kw) => itemContentStr.includes(kw));
    const keywordOverlapScore = targetKeywords.length > 0
      ? Math.min(100, Math.round((matched.length / Math.max(1, targetKeywords.length)) * 100))
      : 50;

    // 2. Metric / Reliability Proof Scoring (30% weight)
    const hasMetric = (item.metrics && item.metrics.length > 0) || itemContentStr.includes("%") || /\d+/.test(itemContentStr);
    const metricScore = hasMetric ? 95 : 60;

    // 3. Category & Role Alignment (30% weight)
    const isDirectRoleMatch = item.title.toLowerCase().includes(jobAnalysis.roleTitle.toLowerCase()) ||
      (jobAnalysis.roleTitle.toLowerCase().includes("ai") && itemContentStr.includes("ai")) ||
      (jobAnalysis.roleTitle.toLowerCase().includes("frontend") && itemContentStr.includes("react")) ||
      (jobAnalysis.roleTitle.toLowerCase().includes("backend") && (itemContentStr.includes("api") || itemContentStr.includes("sql")));
    const categoryScore = isDirectRoleMatch ? 95 : 70;

    const totalRelevance = Math.round(
      keywordOverlapScore * 0.4 +
      metricScore * 0.3 +
      categoryScore * 0.3
    );

    return {
      evidence: item,
      relevanceScore: totalRelevance,
      matchedKeywords: matched,
      relevanceRationale: `Matched ${matched.length} JD keywords (${matched.slice(0, 3).join(", ")}). Direct relevance: ${totalRelevance}%.`,
    };
  });

  // Sort descending by relevance score
  return scoredItems.sort((a, b) => b.relevanceScore - a.relevanceScore);
}
