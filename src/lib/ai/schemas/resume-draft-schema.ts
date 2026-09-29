import { z } from "zod";

export const ClaimStatusSchema = z.enum([
  "supported",
  "partially_supported",
  "unsupported",
  "verification_unavailable",
]);
export type ClaimStatus = z.infer<typeof ClaimStatusSchema>;

export const GeneratedClaimSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  claimText: z.string().optional(),
  evidenceIds: z.array(z.string()).default([]),
  requirementIds: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).default(0),
  confidenceScore: z.number().min(0).max(1).optional(),
  isVerified: z.boolean().optional(),
  status: ClaimStatusSchema.default("verification_unavailable"),
  reasoning: z.string().optional(),
});
export type GeneratedClaim = z.infer<typeof GeneratedClaimSchema>;
export type ResumeClaim = GeneratedClaim;

export const ResumeExperienceSchema = z.object({
  id: z.string(),
  role: z.string().min(1),
  company: z.string().min(1),
  location: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  current: z.boolean().default(false),
  bullets: z.array(z.string()).default([]),
  evidenceIds: z.array(z.string()).default([]),
});
export type ResumeExperience = z.infer<typeof ResumeExperienceSchema>;

export const ResumeProjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  technologies: z.string().default(""),
  link: z.string().optional(),
  githubLink: z.string().optional(),
  bullets: z.array(z.string()).default([]),
  evidenceIds: z.array(z.string()).default([]),
});
export type ResumeProject = z.infer<typeof ResumeProjectSchema>;

export const ResumeEducationSchema = z.object({
  id: z.string(),
  degree: z.string().min(1),
  institution: z.string().min(1),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string(),
  score: z.string().optional(),
});
export type ResumeEducation = z.infer<typeof ResumeEducationSchema>;

export const ResumeSkillsSchema = z.object({
  languages: z.array(z.string()).default([]),
  frameworks: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
  softSkills: z.array(z.string()).default([]),
  aiSkills: z.array(z.string()).default([]),
  backendSkills: z.array(z.string()).default([]),
});
export type ResumeSkills = z.infer<typeof ResumeSkillsSchema>;

export const ResumePersonalSchema = z.object({
  name: z.string().min(1),
  email: z.string().default(""),
  phone: z.string().default(""),
  location: z.string().default(""),
  targetRole: z.string().default(""),
  linkedin: z.string().default(""),
  github: z.string().default(""),
  portfolio: z.string().default(""),
});
export type ResumePersonal = z.infer<typeof ResumePersonalSchema>;

export const ResumeDraftSchema = z.object({
  personal: ResumePersonalSchema,
  summary: z.string().default(""),
  skills: ResumeSkillsSchema,
  experience: z.array(ResumeExperienceSchema).default([]),
  projects: z.array(ResumeProjectSchema).default([]),
  education: z.array(ResumeEducationSchema).default([]),
  claims: z.array(GeneratedClaimSchema).default([]),
});
export type ResumeDraft = z.infer<typeof ResumeDraftSchema>;
