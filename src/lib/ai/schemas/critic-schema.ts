import { z } from "zod";
import { ClaimStatusSchema } from "./resume-draft-schema";

export const ClaimAuditResultSchema = z.object({
  claimId: z.string(),
  claimText: z.string(),
  verdict: ClaimStatusSchema,
  evidenceIds: z.array(z.string()).default([]),
  explanation: z.string(),
  suggestedFix: z.string().optional(),
  confidence: z.number().min(0).max(1).default(0),
});
export type ClaimAuditResult = z.infer<typeof ClaimAuditResultSchema>;

export const CriticResultSchema = z.object({
  passed: z.boolean(),
  overallGroundingScore: z.number().min(0).max(100),
  verifiedClaimsCount: z.number().int().default(0),
  unsupportedClaimsCount: z.number().int().default(0),
  claims: z.array(ClaimAuditResultSchema).default([]),
  critique: z.string().default(""),
  status: z.enum(["verified", "reflection_required", "verification_failed", "verification_unavailable"]).default("verification_unavailable"),
});
export type CriticResult = z.infer<typeof CriticResultSchema>;
