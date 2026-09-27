import { callOpenRouter, parseJsonFromLlm } from "../openrouter";
import type { CandidateEvidenceBank, JobAnalysisResult, ResumePlan } from "../types";

const SYSTEM_PROMPT = `You are JobMate's Resume Strategist & Planning Agent.
Your goal is to formulate an optimal resume structure and evidence selection strategy tailored to a target Job Description.
Decide:
1. Section Hierarchy (Students/Interns -> Education & Projects first; Seniors -> Experience first).
2. Evidence Selection (Rank candidate evidence items by relevance to the JD requirements).
3. Keyword Targeting Plan (Assign specific target keywords to each section).
Output strictly valid JSON.`;

export async function runPlannerAgent(
  evidenceBank: CandidateEvidenceBank,
  jobAnalysis: JobAnalysisResult
): Promise<ResumePlan> {
  const prompt = `Formulate a strategic resume plan for this candidate targeting the analyzed role.

Candidate Evidence Bank:
${JSON.stringify(evidenceBank, null, 2)}

Target Job Analysis:
${JSON.stringify(jobAnalysis, null, 2)}

Return a valid JSON object matching:
{
  "strategySummary": "Strategic rationale for section order, template selection, and primary technical emphasis",
  "recommendedTemplate": "modern" | "classic" | "minimal" | "executive",
  "sectionOrder": ["personal", "summary", "experience", "projects", "skills", "education"],
  "selectedEvidenceIds": ["id1", "id2", ...],
  "keywordTargetingMap": {
    "summary": ["keyword1", "keyword2"],
    "experience": ["keyword3", "keyword4"],
    "projects": ["keyword5"],
    "skills": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
  }
}`;

  try {
    const raw = await callOpenRouter(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      0.2,
      true
    );

    if (raw) {
      const parsed = parseJsonFromLlm<ResumePlan>(raw);
      if (parsed && parsed.strategySummary && parsed.sectionOrder) {
        console.log("[PlannerAgent] Successfully parsed live AI plan:", parsed);
        return parsed;
      }
    }
  } catch (err) {
    console.warn("PlannerAgent using strategic fallback planner:", err);
  }

  // Fallback Planning Logic
  const isSenior = jobAnalysis.seniority === "Senior" || jobAnalysis.seniority === "Lead" || jobAnalysis.seniority === "Staff";
  const isStudent = jobAnalysis.seniority === "Intern" || jobAnalysis.seniority === "Junior";

  const sectionOrder = isStudent
    ? ["personal", "summary", "skills", "projects", "experience", "education"]
    : ["personal", "summary", "experience", "projects", "skills", "education"];

  return {
    strategySummary: `Prioritizing ${isStudent ? "hands-on projects and core technologies" : "quantifiable work achievements"} to match ${jobAnalysis.roleTitle} expectations at ${jobAnalysis.company}.`,
    recommendedTemplate: isSenior ? "executive" : "modern",
    sectionOrder,
    selectedEvidenceIds: evidenceBank.evidenceItems.map((item) => item.id),
    keywordTargetingMap: {
      summary: jobAnalysis.requiredHardSkills.slice(0, 3),
      experience: jobAnalysis.requiredHardSkills.slice(2, 6),
      projects: jobAnalysis.requiredHardSkills.slice(0, 4),
      skills: jobAnalysis.requiredHardSkills,
    },
  };
}
