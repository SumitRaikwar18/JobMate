import { z } from "zod";

export const BulletPlanSchema = z.object({
  section: z.string(),
  evidenceId: z.string(),
  targetRequirement: z.string(),
  emphasisKeywords: z.array(z.string()).default([]),
});
export type BulletPlan = z.infer<typeof BulletPlanSchema>;

export const ResumePlanSchema = z.object({
  targetRole: z.string().min(1),
  summaryStrategy: z.string(),
  recommendedTemplate: z.enum(["modern", "classic", "minimal", "executive", "technical"]).default("modern"),
  sectionOrder: z.array(z.string()).default(["personal", "summary", "experience", "projects", "skills", "education"]),
  selectedSkills: z.array(z.string()).default([]),
  selectedProjects: z.array(
    z.object({
      projectId: z.string(),
      evidenceIds: z.array(z.string()).default([]),
      requirementsCovered: z.array(z.string()).default([]),
    })
  ).default([]),
  bulletPlans: z.array(BulletPlanSchema).default([]),
  omissions: z.array(
    z.object({
      requirement: z.string(),
      reason: z.string(),
    })
  ).default([]),
});
export type ResumePlan = z.infer<typeof ResumePlanSchema>;
