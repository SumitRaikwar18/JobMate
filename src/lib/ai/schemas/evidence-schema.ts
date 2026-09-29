import { z } from "zod";

export const SourceTypeSchema = z.enum([
  "resume",
  "project",
  "github",
  "experience",
  "education",
  "certification",
  "manual",
]);
export type SourceType = z.infer<typeof SourceTypeSchema>;

export const EvidenceMetricSchema = z.object({
  metricName: z.string(),
  metricValue: z.string(),
  unit: z.string().optional(),
  context: z.string().optional(),
});
export type EvidenceMetric = z.infer<typeof EvidenceMetricSchema>;

export const EvidenceProvenanceSchema = z.object({
  repository: z.string().optional(),
  path: z.string().optional(),
  lineStart: z.number().int().optional(),
  lineEnd: z.number().int().optional(),
  sourceType: SourceTypeSchema,
  sourceId: z.string().optional(),
  sourceUrl: z.string().optional(),
});
export type EvidenceProvenance = z.infer<typeof EvidenceProvenanceSchema>;

export const EvidenceItemSchema = z.object({
  id: z.string(),
  candidateId: z.string(),
  sourceType: SourceTypeSchema,
  sourceId: z.string().optional(),
  sourceUrl: z.string().optional(),
  title: z.string().optional(),
  content: z.string().min(1),
  organization: z.string().optional(),
  dateRange: z.string().optional(),
  category: z.string().optional(),
  verifiedClaims: z.array(z.string()).optional(),
  technologiesUsed: z.array(z.string()).optional(),
  technologies: z.array(z.string()).default([]),
  concepts: z.array(z.string()).default([]),
  metrics: z.array(EvidenceMetricSchema).default([]),
  verified: z.boolean().default(false),
  confidence: z.number().min(0).max(1).default(0),
  sourcePath: z.string().optional(),
  sourceLineStart: z.number().int().optional(),
  sourceLineEnd: z.number().int().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type EvidenceItem = z.infer<typeof EvidenceItemSchema>;

export const CandidateEvidenceBankSchema = z.object({
  candidateId: z.string(),
  fullName: z.string().optional(),
  targetRole: z.string().optional(),
  evidenceItems: z.array(EvidenceItemSchema).default([]),
});
export type CandidateEvidenceBank = z.infer<typeof CandidateEvidenceBankSchema>;
