import { z } from "zod";
import { generateStructuredOutput } from "../structured-output";
import type {
  EvidenceItem,
  AtomicFact,
  CandidateClaim,
} from "../evidence/evidence-types";

const AtomicFactDecompositionSchema = z.object({
  facts: z.array(
    z.object({
      factText: z.string(),
      category: z.enum(["technology_usage", "metric_claim", "leadership_claim", "timeline_claim"]),
    })
  ),
});

export interface VerificationGateResult {
  passed: boolean;
  claims: CandidateClaim[];
  blockedClaimsCount: number;
  unsupportedMetricsCount: number;
  overallGroundednessScore: number;
  failureReasons: string[];
}

/**
 * Deterministic Claim Verification Engine
 * Decomposes text into atomic facts and verifies each against the evidence graph.
 */
export class ClaimVerificationEngine {
  /**
   * Decomposes a statement or bullet point into atomic testable facts.
   */
  public static async extractAtomicFacts(statement: string): Promise<AtomicFact[]> {
    if (!statement || statement.trim().length < 10) return [];

    const systemPrompt = `You are a strict technical claim verification compiler.
Decompose the input candidate statement into atomic testable facts.
Categorize each fact as:
- 'technology_usage': asserted use of a specific tool, language, database, or library
- 'metric_claim': asserted quantitative result, percentage, transaction count, latency reduction, or uptime
- 'leadership_claim': asserted team management, architecture lead, or mentoring
- 'timeline_claim': asserted duration, launch date, or employment timeline`;

    const userPrompt = `Statement to decompose:
"${statement}"

Extract all atomic facts.`;

    try {
      const result = await generateStructuredOutput({
        schema: AtomicFactDecompositionSchema,
        schemaName: "AtomicFacts",
        systemPrompt,
        userPrompt,
        temperature: 0.0,
        maxRetries: 1,
      });

      return result.data.facts.map((f) => ({
        factText: f.factText,
        category: f.category,
        status: "unsupported",
        matchedEvidenceIds: [],
        confidence: 0.5,
      }));
    } catch {
      return this.heuristicDecompose(statement);
    }
  }

  /**
   * Verifies atomic facts against the evidence bank.
   */
  public static verifyAtomicFacts(
    facts: AtomicFact[],
    evidencePool: EvidenceItem[]
  ): AtomicFact[] {
    return facts.map((fact) => {
      const lowerFact = fact.factText.toLowerCase();

      if (fact.category === "technology_usage") {
        const matches = evidencePool.filter((ev) =>
          ev.technologies.some((t) => lowerFact.includes(t.toLowerCase()))
        );

        if (matches.length > 0) {
          const isVerifiedTier = matches.some(
            (m) => m.evidenceLevel === "L4_SOURCE_CODE" || m.evidenceLevel === "L3_MANIFEST_DEPENDENCY" || m.evidenceLevel === "L6_TEST_CI"
          );
          return {
            ...fact,
            status: isVerifiedTier ? "verified" : "partially_verified",
            matchedEvidenceIds: matches.map((m) => m.id),
            confidence: isVerifiedTier ? 0.95 : 0.65,
          };
        }
      } else if (fact.category === "metric_claim") {
        const matches = evidencePool.filter((ev) =>
          ev.metrics && ev.metrics.some((m) => lowerFact.includes(String(m.observedValue)) || lowerFact.includes(m.metricName.toLowerCase()))
        );

        if (matches.length > 0) {
          return {
            ...fact,
            status: "verified",
            matchedEvidenceIds: matches.map((m) => m.id),
            confidence: 0.90,
          };
        }

        // Metrics without exact benchmark/test evidence fail closed
        return {
          ...fact,
          status: "unsupported",
          matchedEvidenceIds: [],
          confidence: 0.0,
        };
      } else if (fact.category === "leadership_claim") {
        const matches = evidencePool.filter((ev) =>
          ev.evidenceLevel === "L5_COMMIT_PR" || ev.evidenceLevel === "L7_EXTERNAL"
        );
        return {
          ...fact,
          status: matches.length > 0 ? "verified" : "partially_verified",
          matchedEvidenceIds: matches.map((m) => m.id),
          confidence: matches.length > 0 ? 0.85 : 0.40,
        };
      }

      return fact;
    });
  }

  /**
   * Evaluates all claims in a draft against the Hard Claim Gate.
   */
  public static async executeVerificationGate(
    candidateId: string,
    bulletStatements: string[],
    evidencePool: EvidenceItem[]
  ): Promise<VerificationGateResult> {
    const claims: CandidateClaim[] = [];
    const failureReasons: string[] = [];
    let unsupportedMetrics = 0;
    let blockedClaims = 0;

    for (const statement of bulletStatements) {
      const atomicFacts = await this.extractAtomicFacts(statement);
      const verifiedFacts = this.verifyAtomicFacts(atomicFacts, evidencePool);

      const hasUnsupportedMetric = verifiedFacts.some(
        (f) => f.category === "metric_claim" && f.status === "unsupported"
      );

      const unverifiedTechCount = verifiedFacts.filter(
        (f) => f.category === "technology_usage" && f.status === "unsupported"
      ).length;

      let claimStatus: CandidateClaim["status"] = "verified";
      if (hasUnsupportedMetric) {
        claimStatus = "blocked";
        unsupportedMetrics++;
        blockedClaims++;
        failureReasons.push(`Blocked unproven metric assertion in statement: "${statement.slice(0, 80)}..."`);
      } else if (unverifiedTechCount > 0) {
        claimStatus = "partially_verified";
      }

      const allEvidenceIds = Array.from(new Set(verifiedFacts.flatMap((f) => f.matchedEvidenceIds)));

      claims.push({
        id: `claim_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        candidateId,
        claimText: statement,
        atomicFacts: verifiedFacts,
        status: claimStatus,
        confidence: claimStatus === "verified" ? 0.95 : claimStatus === "blocked" ? 0.0 : 0.65,
        evidenceIds: allEvidenceIds,
        createdAt: new Date().toISOString(),
      });
    }

    const verifiedCount = claims.filter((c) => c.status === "verified").length;
    const overallGroundednessScore = claims.length > 0 ? Math.round((verifiedCount / claims.length) * 100) : 100;

    // Hard Gate: No blocked claims and at least 70% verified claims
    const passed = blockedClaims === 0 && overallGroundednessScore >= 70;

    return {
      passed,
      claims,
      blockedClaimsCount: blockedClaims,
      unsupportedMetricsCount: unsupportedMetrics,
      overallGroundednessScore,
      failureReasons,
    };
  }

  private static heuristicDecompose(text: string): AtomicFact[] {
    const facts: AtomicFact[] = [];
    // Detect numbers/percentages
    const metricMatches = text.match(/\b\d+(\.\d+)?(%|\+|x|k|m|ms|s)?\b/gi);
    if (metricMatches) {
      for (const m of metricMatches) {
        facts.push({
          factText: `Asserts metric value: ${m}`,
          category: "metric_claim",
          status: "unsupported",
          matchedEvidenceIds: [],
          confidence: 0.5,
        });
      }
    }

    facts.push({
      factText: text,
      category: "technology_usage",
      status: "unsupported",
      matchedEvidenceIds: [],
      confidence: 0.5,
    });

    return facts;
  }
}
