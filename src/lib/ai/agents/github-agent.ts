import { generateStructuredOutput } from "../structured-output";
import { GitHubAnalysisSchema, type GitHubAnalysis } from "../schemas/github-schema";
import { fetchGitHubRepoServerFn, type GitHubRepoIngestionResult } from "../github-parser-server";

export interface GitHubProjectAnalysis {
  repoUrl: string;
  projectTitle: string;
  role: string;
  primaryTechnologies: string[];
  architectureSummary: string;
  complexityLevel: "Production-Grade" | "High" | "Intermediate";
  stars: number;
  xyzBullets: string[];
  atsKeywords: string[];
  rawRepoData: {
    fullName: string;
    description: string;
    primaryLanguage: string;
  };
}

const GITHUB_INTELLIGENCE_SYSTEM_PROMPT = `You are JobMate's Senior Code Intelligence & GitHub Architecture Agent.
Your mission is to inspect software repositories, dependencies, file manifests, and system architecture to synthesize truth-grounded resume bullet points.

CRITICAL PRINCIPLES:
1. Ground all claims STRICTLY in the detected technologies, frameworks, and file paths.
2. NEVER invent false test coverage (e.g. "100% test coverage"), fake metrics, or unverified scale numbers.
3. Formulate 2-3 distinct resume bullets following the XYZ formula ("Accomplished [X] measured by [Y], by doing [Z]") ONLY where [Y] is supported by repository evidence.
4. Output strictly valid JSON conforming to the schema.`;

/**
 * Executes the full GitHub Code Intelligence Agent pipeline
 */
export async function analyzeGitHubRepository(repoUrlOrSlug: string): Promise<GitHubProjectAnalysis> {
  const repoData: GitHubRepoIngestionResult = await fetchGitHubRepoServerFn({
    data: { repoUrlOrSlug },
  });

  const manifestSummaries = Object.entries(repoData.manifestFiles)
    .filter(([_, content]) => Boolean(content))
    .map(([file, content]) => `--- ${file} ---\n${content}`)
    .join("\n\n");

  const userPrompt = `Analyze this repository and generate grounded resume bullets and engineering evidence.

Repository: ${repoData.fullName}
Description: ${repoData.description || "No description provided."}
Primary Language: ${repoData.primaryLanguage}
Languages Distribution: ${JSON.stringify(repoData.languages)}
Topics/Tags: ${JSON.stringify(repoData.topics)}
Stars: ${repoData.stars} | Forks: ${repoData.forks}

Root File Tree:
${repoData.fileTree.join("\n")}

Manifest Files:
${manifestSummaries || "No manifest files detected."}

README Preview:
"""
${repoData.readmeContent || "No README provided."}
"""

Return a strictly valid JSON GitHubAnalysis object.`;

  try {
    const result = await generateStructuredOutput({
      schema: GitHubAnalysisSchema,
      schemaName: "GitHubAnalysis",
      systemPrompt: GITHUB_INTELLIGENCE_SYSTEM_PROMPT,
      userPrompt,
      temperature: 0.2,
      maxRetries: 2,
    });

    const parsed = result.data;

    return {
      repoUrl: repoData.repoUrl,
      projectTitle: parsed.fullName || repoData.repo,
      role: "Lead Developer / Contributor",
      primaryTechnologies: parsed.detectedTechnologies.length > 0 ? parsed.detectedTechnologies : Object.keys(repoData.languages),
      architectureSummary: parsed.architectureSummary || repoData.description,
      complexityLevel: parsed.complexityLevel === "Production-Grade" ? "Production-Grade" : parsed.complexityLevel === "High" ? "High" : "Intermediate",
      stars: repoData.stars,
      xyzBullets: parsed.xyzBullets.length > 0 ? parsed.xyzBullets : [
        `Engineered ${repoData.repo} utilizing ${repoData.primaryLanguage}, implementing modular system architecture and clean separation of concerns.`,
      ],
      atsKeywords: parsed.atsKeywords.length > 0 ? parsed.atsKeywords : Object.keys(repoData.languages),
      rawRepoData: {
        fullName: repoData.fullName,
        description: repoData.description,
        primaryLanguage: repoData.primaryLanguage,
      },
    };
  } catch (err) {
    console.warn("[analyzeGitHubRepository] LLM parsing failed, generating grounded heuristic analysis:", err);

    const detectedTech = [
      repoData.primaryLanguage,
      ...Object.keys(repoData.languages).slice(0, 4),
      ...(repoData.manifestFiles.dockerfile ? ["Docker"] : []),
      ...(repoData.manifestFiles.packageJson && repoData.manifestFiles.packageJson.includes("react") ? ["React"] : []),
      ...(repoData.manifestFiles.packageJson && repoData.manifestFiles.packageJson.includes("next") ? ["Next.js"] : []),
      ...(repoData.manifestFiles.requirementsTxt && repoData.manifestFiles.requirementsTxt.includes("fastapi") ? ["FastAPI"] : []),
      ...(repoData.manifestFiles.requirementsTxt && repoData.manifestFiles.requirementsTxt.includes("torch") ? ["PyTorch"] : []),
    ].filter((v, i, a) => a.indexOf(v) === i && Boolean(v));

    return {
      repoUrl: repoData.repoUrl,
      projectTitle: repoData.repo.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      role: "Creator & Developer",
      primaryTechnologies: detectedTech,
      architectureSummary: repoData.description || `Software project built with ${repoData.primaryLanguage}.`,
      complexityLevel: repoData.stars > 50 ? "Production-Grade" : "High",
      stars: repoData.stars,
      xyzBullets: [
        `Architected and implemented ${repoData.repo} utilizing ${detectedTech.slice(0, 3).join(", ")}, establishing modular component design and typed interfaces.`,
        `Integrated core workflows and API communications within ${repoData.primaryLanguage} environment.`,
      ],
      atsKeywords: detectedTech,
      rawRepoData: {
        fullName: repoData.fullName,
        description: repoData.description,
        primaryLanguage: repoData.primaryLanguage,
      },
    };
  }
}
