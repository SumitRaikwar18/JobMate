import { z } from "zod";

export const ATSIssueSeveritySchema = z.enum(["critical", "warning", "info"]);
export type ATSIssueSeverity = z.infer<typeof ATSIssueSeveritySchema>;

export const ATSIssueSchema = z.object({
  id: z.string(),
  category: z.enum([
    "keyword_coverage",
    "evidence_grounding",
    "section_structure",
    "formatting",
    "readability",
    "verb_strength",
    "quantifiable_impact",
  ]),
  severity: ATSIssueSeveritySchema,
  message: z.string(),
  detectedContext: z.string().optional(),
  suggestedFix: z.string().optional(),
});
export type ATSIssue = z.infer<typeof ATSIssueSchema>;

export const ATSReportSchema = z.object({
  overallScore: z.number().min(0).max(100),
  keywordCoverage: z.number().min(0).max(100),
  evidenceCoverage: z.number().min(0).max(100),
  sectionCompleteness: z.number().min(0).max(100),
  formattingScore: z.number().min(0).max(100),
  readabilityScore: z.number().min(0).max(100),
  actionVerbScore: z.number().min(0).max(100),
  quantifiableImpactScore: z.number().min(0).max(100),
  matchedKeywords: z.array(z.string()).default([]),
  missingKeywords: z.array(z.string()).default([]),
  strongActionVerbs: z.array(z.string()).default([]),
  weakActionVerbs: z.array(z.string()).default([]),
  issues: z.array(ATSIssueSchema).default([]),
  disclaimer: z.string().default(
    "These are JobMate internal heuristic measurements and are not guarantees of proprietary commercial ATS or recruiter outcomes."
  ),
});
export type ATSReport = z.infer<typeof ATSReportSchema>;
