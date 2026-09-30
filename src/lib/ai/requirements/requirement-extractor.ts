import { z } from "zod";
import { generateStructuredOutput } from "../structured-output";
import type { JobRequirement } from "../evidence/evidence-types";

const RequirementExtractionSchema = z.object({
  requirements: z.array(
    z.object({
      requirementText: z.string(),
      category: z.enum(["technical", "responsibility", "seniority", "domain", "education"]),
      normalizedSkills: z.array(z.string()),
      importance: z.enum(["low", "medium", "high"]),
      evidenceNeeded: z.array(z.string()),
      confidence: z.number().min(0).max(1),
    })
  ),
});

/**
 * Structured Job Requirement Extractor
 * Parses raw job descriptions into normalized, categorized requirements with evidence expectations.
 */
export class RequirementExtractor {
  public static async extractRequirements(
    candidateId: string,
    jobDescription: string,
    jobId?: string
  ): Promise<JobRequirement[]> {
    if (!jobDescription || jobDescription.trim().length < 20) {
      return [];
    }

    const systemPrompt = `You are an expert technical recruiting analyst and requirements engineer.
Analyze the target job description and decompose it into distinct atomic requirements.
For each requirement, specify the category, normalized technical skills, importance level (high, medium, low), and the specific types of candidate engineering evidence needed to substantiate it.`;

    const userPrompt = `UNTRUSTED JOB DESCRIPTION:
<job_description>
${jobDescription.slice(0, 4000)}
</job_description>

Extract all technical, architectural, seniority, and domain requirements according to the schema.`;

    try {
      const result = await generateStructuredOutput({
        schema: RequirementExtractionSchema,
        schemaName: "JobRequirements",
        systemPrompt,
        userPrompt,
        temperature: 0.1,
        maxRetries: 2,
      });

      return result.data.requirements.map((req) => ({
        id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        jobId,
        candidateId,
        requirementText: req.requirementText,
        category: req.category,
        normalizedSkills: req.normalizedSkills,
        importance: req.importance,
        evidenceNeeded: req.evidenceNeeded,
        confidence: req.confidence,
        createdAt: new Date().toISOString(),
      }));
    } catch (error) {
      console.warn("[RequirementExtractor] Model extraction error, using rule-based fallback:", error);
      return this.heuristicFallbackExtraction(candidateId, jobDescription, jobId);
    }
  }

  private static heuristicFallbackExtraction(
    candidateId: string,
    text: string,
    jobId?: string
  ): JobRequirement[] {
    const knownSkills = [
      "Python", "TypeScript", "JavaScript", "React", "Node.js", "PostgreSQL",
      "pgvector", "Redis", "Docker", "Kubernetes", "AWS", "FastAPI", "Go",
      "Rust", "GraphQL", "CI/CD", "Git", "RAG", "Embeddings", "PyTorch"
    ];

    const foundSkills = knownSkills.filter((s) =>
      new RegExp(`\\b${s}\\b`, "i").test(text)
    );

    return foundSkills.map((skill) => ({
      id: `req_heuristic_${skill.toLowerCase()}`,
      jobId,
      candidateId,
      requirementText: `Demonstrated proficiency in ${skill}`,
      category: "technical",
      normalizedSkills: [skill],
      importance: "high",
      evidenceNeeded: [`${skill} source code`, `dependency manifests`, `unit tests`],
      confidence: 0.85,
      createdAt: new Date().toISOString(),
    }));
  }
}
