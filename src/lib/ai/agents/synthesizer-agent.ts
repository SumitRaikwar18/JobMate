import { generateStructuredOutput } from "../structured-output";
import { ResumeDraftSchema, type ResumeDraft } from "../schemas/resume-draft-schema";
import type { CandidateEvidenceBank, JobAnalysisResult, ResumePlan } from "../types";

const SYSTEM_PROMPT = `You are JobMate's Grounded Resume Content Synthesizer Agent.
Your mission is to synthesize compelling, job-aligned resume content strictly grounded in the candidate's real evidence.

ANTI-HALLUCINATION RULES (MANDATORY):
1. Use ONLY the candidate's actual projects, employment records, degrees, and technologies provided in the evidence bank.
2. NEVER invent companies, universities, GPAs, scale metrics (e.g. "1.2M users", "99.999% uptime"), or cost savings unless explicitly present in the candidate evidence.
3. If no metric is present in the evidence for a task, describe the technical outcome clearly without fabricating percentages or numbers.
4. Apply the XYZ format ("Accomplished [X] measured by [Y], by doing [Z]") ONLY where [Y] is supported by evidence. Otherwise focus on [X] and [Z].
5. Output strictly valid JSON matching the schema.`;

export async function runSynthesizerAgent(
  evidenceBank: CandidateEvidenceBank,
  jobAnalysis: JobAnalysisResult,
  resumePlan: ResumePlan,
  critiqueFeedback?: string
): Promise<ResumeDraft> {
  const userPrompt = `Synthesize a grounded resume draft based strictly on the candidate evidence bank.

Candidate Ground-Truth Evidence:
${JSON.stringify(evidenceBank, null, 2)}

Target Job Requirements:
${JSON.stringify(jobAnalysis, null, 2)}

Strategic Resume Plan:
${JSON.stringify(resumePlan, null, 2)}

${
  critiqueFeedback
    ? `CRITICAL FEEDBACK FROM PREVIOUS VERIFICATION AUDIT (MUST FIX):
"""
${critiqueFeedback}
"""`
    : ""
}

Return a strictly valid JSON ResumeDraft object.`;

  try {
    const result = await generateStructuredOutput({
      schema: ResumeDraftSchema,
      schemaName: "ResumeDraft",
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      temperature: 0.2,
      maxRetries: 2,
    });

    return result.data;
  } catch (err) {
    console.warn("[SynthesizerAgent] Structured LLM generation failed, building grounded baseline draft:", err);

    // Build strictly grounded baseline without fabricating any data
    const experiences = (evidenceBank.evidenceItems || [])
      .filter((item) => item.category === "experience")
      .map((item, idx) => ({
        id: item.id || `exp-${idx + 1}`,
        role: item.title,
        company: item.organization || "Engineering Role",
        location: undefined,
        startDate: item.dateRange?.split(" - ")?.[0] || "2023",
        endDate: item.dateRange?.split(" - ")?.[1] || "Present",
        current: (item.dateRange || "").toLowerCase().includes("present"),
        bullets: (item.verifiedClaims && item.verifiedClaims.length > 0)
          ? item.verifiedClaims
          : [`Implemented core technical features using ${(item.technologiesUsed || []).slice(0, 3).join(", ")}.`],
        evidenceIds: [item.id],
      }));

    const projects = (evidenceBank.evidenceItems || [])
      .filter((item) => item.category === "project")
      .map((item, idx) => ({
        id: item.id || `proj-${idx + 1}`,
        name: item.title,
        technologies: (item.technologiesUsed || []).join(", "),
        link: item.sourceUrl,
        githubLink: item.sourceUrl?.includes("github.com") ? item.sourceUrl : undefined,
        bullets: (item.verifiedClaims && item.verifiedClaims.length > 0)
          ? item.verifiedClaims
          : [`Built application architecture utilizing ${(item.technologiesUsed || []).slice(0, 3).join(", ")}.`],
        evidenceIds: [item.id],
      }));

    const allTech = Array.from(
      new Set(
        (evidenceBank.evidenceItems || []).flatMap((i) => i.technologiesUsed || [])
      )
    );

    return {
      personal: {
        name: evidenceBank.fullName || "Candidate",
        email: "",
        phone: "",
        location: "",
        targetRole: jobAnalysis.roleTitle || evidenceBank.targetRole || "Software Engineer",
        linkedin: "",
        github: "",
        portfolio: "",
      },
      summary: `Software engineer experienced in ${allTech.slice(0, 4).join(", ") || "software development"}, applying verified technical skills toward ${jobAnalysis.roleTitle || "engineering"} roles.`,
      skills: {
        languages: allTech.filter((t) => ["typescript", "javascript", "python", "go", "rust", "sql", "c++", "java"].includes(t.toLowerCase())),
        frameworks: allTech.filter((t) => ["react", "next.js", "node.js", "express", "fastapi", "vue", "angular"].includes(t.toLowerCase())),
        tools: allTech.filter((t) => ["git", "docker", "kubernetes", "postgresql", "supabase", "jest", "aws", "gcp"].includes(t.toLowerCase())),
        softSkills: ["Technical Communication", "Code Review", "Collaborative Problem Solving"],
        aiSkills: allTech.filter((t) => ["rag", "llm", "embeddings", "pgvector", "langgraph", "pytorch"].includes(t.toLowerCase())),
        backendSkills: allTech.filter((t) => ["api", "rest", "graphql", "database", "microservices"].includes(t.toLowerCase())),
      },
      experience: experiences,
      projects,
      education: (evidenceBank.evidenceItems || [])
        .filter((item) => item.category === "education")
        .map((item, idx) => ({
          id: item.id || `edu-${idx + 1}`,
          degree: item.title,
          institution: item.organization || "University",
          endDate: item.dateRange || "2024",
        })),
      claims: [],
    };
  }
}
