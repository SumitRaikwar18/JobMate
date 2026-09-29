import { generateStructuredOutput } from "../structured-output";
import { ResumePlanSchema, type ResumePlan as ZodResumePlan } from "../schemas/resume-plan-schema";
import type { CandidateEvidenceBank, JobAnalysisResult, ResumePlan } from "../types";

const SYSTEM_PROMPT = `You are JobMate's Resume Strategist & Planning Agent.
Your goal is to formulate an optimal resume structure and evidence selection strategy tailored to a target Job Description.
Decide:
1. Section Hierarchy (Students/Interns -> Education & Projects first; Seniors -> Experience first).
2. Evidence Selection (Select real evidence IDs by relevance to the JD requirements).
3. Keyword Targeting Plan (Assign specific target keywords to each section).
Output strictly valid JSON.`;

export async function runPlannerAgent(
  evidenceBank: CandidateEvidenceBank,
  jobAnalysis: JobAnalysisResult
): Promise<ResumePlan> {
  const userPrompt = `Formulate a strategic resume plan for this candidate targeting the analyzed role.

Candidate Ground-Truth Evidence:
${JSON.stringify(evidenceBank, null, 2)}

Target Job Analysis:
${JSON.stringify(jobAnalysis, null, 2)}

Return a strictly valid JSON ResumePlan object.`;

  try {
    const result = await generateStructuredOutput({
      schema: ResumePlanSchema,
      schemaName: "ResumePlan",
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      temperature: 0.2,
      maxRetries: 2,
    });

    const parsed = result.data;

    return {
      strategySummary: parsed.summaryStrategy || `Tailoring resume for ${jobAnalysis.roleTitle} at ${jobAnalysis.company || "Target Company"}.`,
      recommendedTemplate: parsed.recommendedTemplate === "executive" ? "executive" : parsed.recommendedTemplate === "minimal" ? "minimal" : "modern",
      sectionOrder: parsed.sectionOrder || ["personal", "summary", "experience", "projects", "skills", "education"],
      selectedEvidenceIds: (parsed.selectedProjects || []).flatMap((p) => p.evidenceIds).concat(parsed.selectedSkills),
      keywordTargetingMap: {
        summary: jobAnalysis.requiredHardSkills.slice(0, 3),
        experience: jobAnalysis.requiredHardSkills.slice(2, 6),
        projects: jobAnalysis.requiredHardSkills.slice(0, 4),
        skills: jobAnalysis.requiredHardSkills,
      },
    };
  } catch (err) {
    console.warn("[PlannerAgent] Structured planning failed, using deterministic planner:", err);

    const isSenior = jobAnalysis.seniority === "Senior" || jobAnalysis.seniority === "Lead";
    const isStudent = jobAnalysis.seniority === "Intern" || jobAnalysis.seniority === "Junior";

    const sectionOrder = isStudent
      ? ["personal", "summary", "skills", "projects", "experience", "education"]
      : ["personal", "summary", "experience", "projects", "skills", "education"];

    return {
      strategySummary: `Prioritizing ${isStudent ? "verified projects and core skills" : "demonstrated work experience"} to align with ${jobAnalysis.roleTitle} requirements.`,
      recommendedTemplate: isSenior ? "executive" : "modern",
      sectionOrder,
      selectedEvidenceIds: (evidenceBank.evidenceItems || []).map((item) => item.id),
      keywordTargetingMap: {
        summary: (jobAnalysis.requiredHardSkills || []).slice(0, 3),
        experience: (jobAnalysis.requiredHardSkills || []).slice(2, 6),
        projects: (jobAnalysis.requiredHardSkills || []).slice(0, 4),
        skills: jobAnalysis.requiredHardSkills || [],
      },
    };
  }
}
