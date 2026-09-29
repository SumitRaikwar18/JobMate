import { z } from "zod";

export const SkillCategorySchema = z.enum([
  "language",
  "framework",
  "database",
  "cloud",
  "ai",
  "ml",
  "devops",
  "tool",
  "concept",
  "other",
]);
export type SkillCategory = z.infer<typeof SkillCategorySchema>;

export const SkillImportanceSchema = z.enum(["required", "preferred", "contextual"]);
export type SkillImportance = z.infer<typeof SkillImportanceSchema>;

export const SkillRequirementSchema = z.object({
  name: z.string().min(1),
  normalizedName: z.string().min(1),
  category: SkillCategorySchema,
  importance: SkillImportanceSchema,
  evidenceExpected: z.boolean().default(true),
});
export type SkillRequirement = z.infer<typeof SkillRequirementSchema>;

export const SeniorityLevelSchema = z.enum([
  "intern",
  "junior",
  "mid",
  "senior",
  "lead",
  "staff",
  "unknown",
]);
export type SeniorityLevel = z.infer<typeof SeniorityLevelSchema>;

export const JobRequirementsSchema = z.object({
  roleTitle: z.string().min(1),
  company: z.string().optional(),
  seniority: SeniorityLevelSchema.default("mid"),
  requiredSkills: z.array(SkillRequirementSchema).default([]),
  preferredSkills: z.array(SkillRequirementSchema).default([]),
  responsibilities: z.array(z.string()).default([]),
  qualifications: z.array(z.string()).default([]),
  domainSignals: z.array(z.string()).default([]),
  toolingSignals: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
});
export type JobRequirements = z.infer<typeof JobRequirementsSchema>;

export const JobDescriptionInputSchema = z.object({
  rawText: z.string().min(10, "Job description text must be at least 10 characters"),
  sourceUrl: z.string().url().optional(),
  title: z.string().optional(),
  company: z.string().optional(),
});
export type JobDescriptionInput = z.infer<typeof JobDescriptionInputSchema>;
