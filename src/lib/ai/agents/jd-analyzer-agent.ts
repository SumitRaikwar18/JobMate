import { generateStructuredOutput } from "../structured-output";
import { JobRequirementsSchema, type JobRequirements } from "../schemas/jd-schema";
import type { JobAnalysisResult } from "../types";

const SYSTEM_PROMPT = `You are JobMate's Job Description Semantic Analyzer Agent.
Your goal is to perform deep semantic decomposition of job postings into structured technical requirements.
Identify required hard skills, preferred skills, soft skills, seniority indicators, and core responsibilities with precision.
Output strictly valid JSON matching the schema.`;

export async function runJdAnalyzerAgent(
  jdText: string,
  targetCompany?: string
): Promise<JobAnalysisResult> {
  const userPrompt = `Analyze this job posting and extract a structured technical requirement matrix.

Job Description:
"""
${jdText}
"""
${targetCompany ? `Target Company: ${targetCompany}` : ""}

Return a strictly valid JSON JobRequirements object.`;

  try {
    const result = await generateStructuredOutput({
      schema: JobRequirementsSchema,
      schemaName: "JobRequirements",
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      temperature: 0.1,
      maxRetries: 2,
    });

    const parsed = result.data;
    const hardSkills = parsed.requiredSkills.map((s) => s.name);
    const softSkills = parsed.preferredSkills.map((s) => s.name);

    return {
      roleTitle: parsed.roleTitle,
      company: parsed.company || targetCompany || "Target Employer",
      seniority: parsed.seniority === "senior" || parsed.seniority === "lead" || parsed.seniority === "staff"
        ? "Senior"
        : parsed.seniority === "intern"
        ? "Intern"
        : parsed.seniority === "junior"
        ? "Junior"
        : "Mid-Level",
      requiredHardSkills: hardSkills.length > 0 ? hardSkills : ["TypeScript", "React", "Node.js", "SQL"],
      requiredSoftSkills: softSkills.length > 0 ? softSkills : ["Problem Solving", "Collaboration"],
      domainKeywords: parsed.domainSignals.length > 0 ? parsed.domainSignals : ["Software Engineering"],
      responsibilities: parsed.responsibilities.length > 0 ? parsed.responsibilities : ["Develop and maintain software applications."],
      keyChallenges: parsed.toolingSignals,
      overallMatchScore: 85,
    };
  } catch (err) {
    console.warn("[JdAnalyzerAgent] LLM parsing failed, using deterministic keyword extractor:", err);

    const lower = jdText.toLowerCase();
    const hardSkillsTaxonomy = [
      "TypeScript", "JavaScript", "React", "Next.js", "Node.js", "Python", "Go", "Rust",
      "SQL", "PostgreSQL", "Supabase", "Docker", "Kubernetes", "AWS", "GCP", "CI/CD",
      "GraphQL", "REST APIs", "TailwindCSS", "Distributed Systems", "Microservices", "Jest"
    ];
    const detectedHardSkills = hardSkillsTaxonomy.filter((skill) => lower.includes(skill.toLowerCase()));

    const seniority: "Intern" | "Junior" | "Mid-Level" | "Senior" | "Lead" | "Staff" =
      lower.includes("senior") || lower.includes("sr.")
        ? "Senior"
        : lower.includes("lead") || lower.includes("principal")
        ? "Lead"
        : lower.includes("intern")
        ? "Intern"
        : lower.includes("junior") || lower.includes("associate")
        ? "Junior"
        : "Mid-Level";

    return {
      roleTitle: lower.includes("frontend")
        ? "Frontend Engineer"
        : lower.includes("full stack") || lower.includes("fullstack")
        ? "Full Stack Engineer"
        : lower.includes("backend")
        ? "Backend Engineer"
        : lower.includes("ai") || lower.includes("machine learning")
        ? "AI Engineer"
        : "Software Engineer",
      company: targetCompany || "Target Employer",
      seniority,
      requiredHardSkills: detectedHardSkills.length > 0 ? detectedHardSkills : ["Software Development"],
      requiredSoftSkills: ["Collaboration", "Problem Solving", "Code Quality"],
      domainKeywords: ["Software Architecture", "API Integration"],
      responsibilities: ["Develop and deliver reliable software components."],
      keyChallenges: ["Maintaining code quality and meeting system requirements."],
      overallMatchScore: 80,
    };
  }
}
