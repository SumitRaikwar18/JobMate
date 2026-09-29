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

function cleanProjectTitle(rawTitle: string, repoName: string): string {
  const candidate = (rawTitle || repoName || "Software Project")
    .replace(/^.*\//, "") // strip owner/ prefix (e.g. NikhilRaikwar/PlanProof -> PlanProof)
    .replace(/\.git$/i, "")
    .replace(/[-_]/g, " ")
    .trim();
  return candidate.replace(/\b\w/g, (c) => c.toUpperCase());
}

function filterKeyTechnologies(technologies: string[], primaryLanguage: string): string[] {
  const noise = new Set(["powershell", "shell", "dockerfile", "makefile", "html", "css", "batchfile", "scss", "sass"]);
  const filtered = technologies.filter((t) => !noise.has(t.toLowerCase().trim()));
  const list = filtered.length > 0 ? filtered : [primaryLanguage];
  return Array.from(new Set(list)).slice(0, 5);
}

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

  const cleanTitle = cleanProjectTitle(repoData.repo, repoData.repo);

  const userPrompt = `Analyze this public GitHub repository and extract concrete, truth-grounded resume accomplishment bullets and engineering architecture.

Repository Name: ${cleanTitle} (Full: ${repoData.fullName})
Description: ${repoData.description || "No description provided."}
Primary Language: ${repoData.primaryLanguage}
Detected Language Breakdown: ${JSON.stringify(repoData.languages)}
Topics/Tags: ${JSON.stringify(repoData.topics)}
Stars: ${repoData.stars} | Forks: ${repoData.forks}

Root Directory Manifests:
${repoData.fileTree.join("\n")}

Key Manifest Files:
${manifestSummaries || "No manifest files detected."}

README Content:
"""
${repoData.readmeContent || "No README provided."}
"""

Instructions:
1. In 'projectTitle', return clean "${cleanTitle}". Do NOT prefix with the GitHub username.
2. In 'detectedTechnologies', prioritize the top 3-5 core languages and frameworks (e.g. Python, TypeScript, React, FastAPI, Docker). Exclude noise like CSS, HTML, PowerShell, Dockerfile.
3. In 'xyzBullets', synthesize 2 to 3 detailed, technical accomplishment bullets following Google's XYZ formula ("Accomplished [X] measured by [Y], by doing [Z]"). Detail what the application does, its architectural components, and technical challenges solved.

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
    const finalTitle = cleanProjectTitle(parsed.fullName || parsed.projectTitle || "", repoData.repo);
    const finalTech = filterKeyTechnologies(
      parsed.detectedTechnologies.length > 0 ? parsed.detectedTechnologies : Object.keys(repoData.languages),
      repoData.primaryLanguage
    );

    const bullets = parsed.xyzBullets.length >= 2 ? parsed.xyzBullets : [
      `Architected and engineered ${finalTitle} using ${finalTech.slice(0, 3).join(", ")}, implementing modular system architecture and clean component separation.`,
      `Designed core application workflows and integrated typed interfaces to ensure reliable runtime execution.`,
    ];

    return {
      repoUrl: repoData.repoUrl,
      projectTitle: finalTitle,
      role: "Lead Developer / Creator",
      primaryTechnologies: finalTech,
      architectureSummary: parsed.architectureSummary || repoData.description || `Software application built with ${finalTech.join(", ")}.`,
      complexityLevel: parsed.complexityLevel === "Production-Grade" ? "Production-Grade" : parsed.complexityLevel === "High" ? "High" : "Intermediate",
      stars: repoData.stars,
      xyzBullets: bullets,
      atsKeywords: parsed.atsKeywords.length > 0 ? parsed.atsKeywords : finalTech,
      rawRepoData: {
        fullName: repoData.fullName,
        description: repoData.description,
        primaryLanguage: repoData.primaryLanguage,
      },
    };
  } catch (err) {
    console.warn("[analyzeGitHubRepository] LLM parsing fallback, generating grounded heuristic analysis:", err);

    const detectedTech = filterKeyTechnologies(
      [
        repoData.primaryLanguage,
        ...Object.keys(repoData.languages).slice(0, 4),
        ...(repoData.manifestFiles.packageJson && repoData.manifestFiles.packageJson.includes("react") ? ["React"] : []),
        ...(repoData.manifestFiles.packageJson && repoData.manifestFiles.packageJson.includes("next") ? ["Next.js"] : []),
        ...(repoData.manifestFiles.requirementsTxt && repoData.manifestFiles.requirementsTxt.includes("fastapi") ? ["FastAPI"] : []),
        ...(repoData.manifestFiles.requirementsTxt && repoData.manifestFiles.requirementsTxt.includes("torch") ? ["PyTorch"] : []),
        ...(repoData.manifestFiles.dockerfile ? ["Docker"] : []),
      ],
      repoData.primaryLanguage
    );

    return {
      repoUrl: repoData.repoUrl,
      projectTitle: cleanTitle,
      role: "Lead Developer / Creator",
      primaryTechnologies: detectedTech,
      architectureSummary: repoData.description || `Full-stack engineering project built with ${detectedTech.join(", ")}.`,
      complexityLevel: repoData.stars > 50 ? "Production-Grade" : "High",
      stars: repoData.stars,
      xyzBullets: [
        `Architected and engineered ${cleanTitle} utilizing ${detectedTech.slice(0, 3).join(", ")}, establishing modular service design and structured data pipelines.`,
        `Implemented core backend and frontend workflows with clean interface boundaries and automated build configurations.`,
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
