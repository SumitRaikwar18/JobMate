import { z } from "zod";

export const GitHubClaimCategorySchema = z.enum([
  "technology",
  "architecture",
  "ai",
  "testing",
  "deployment",
  "performance",
  "other",
]);
export type GitHubClaimCategory = z.infer<typeof GitHubClaimCategorySchema>;

export const GitHubClaimSchema = z.object({
  claim: z.string().min(1),
  source: z.object({
    repository: z.string(),
    path: z.string(),
    lineStart: z.number().int().optional(),
    lineEnd: z.number().int().optional(),
  }),
  evidence: z.string().min(1),
  confidence: z.number().min(0).max(1).default(1),
  category: GitHubClaimCategorySchema.default("technology"),
});
export type GitHubClaim = z.infer<typeof GitHubClaimSchema>;

export const GitHubAnalysisSchema = z.object({
  repoUrl: z.string(),
  fullName: z.string(),
  description: z.string().default(""),
  primaryLanguage: z.string().default(""),
  languages: z.record(z.number()).default({}),
  topics: z.array(z.string()).default([]),
  stars: z.number().int().default(0),
  forks: z.number().int().default(0),
  detectedTechnologies: z.array(z.string()).default([]),
  architectureSummary: z.string().default(""),
  complexityLevel: z.enum(["Production-Grade", "High", "Intermediate", "Exploratory"]).default("Intermediate"),
  verifiedClaims: z.array(GitHubClaimSchema).default([]),
  xyzBullets: z.array(z.string()).default([]),
  atsKeywords: z.array(z.string()).default([]),
});
export type GitHubAnalysis = z.infer<typeof GitHubAnalysisSchema>;
