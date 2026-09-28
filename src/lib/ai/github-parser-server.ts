import { createServerFn } from "@tanstack/react-start";

export interface GitHubRepoIngestionResult {
  owner: string;
  repo: string;
  fullName: string;
  description: string;
  stars: number;
  forks: number;
  primaryLanguage: string;
  languages: Record<string, number>;
  readmeContent?: string;
  manifestFiles: {
    packageJson?: string;
    requirementsTxt?: string;
    goMod?: string;
    cargoToml?: string;
    dockerfile?: string;
  };
  fileTree: string[];
  repoUrl: string;
  topics: string[];
}

/**
 * Server Function: Fetches public GitHub repository AST & metadata
 * Bypasses CORS and runs securely on serverless backend.
 */
export const fetchGitHubRepoServerFn = createServerFn({ method: "POST" })
  .validator((data: { repoUrlOrSlug: string }) => data)
  .handler(async ({ data }): Promise<GitHubRepoIngestionResult> => {
    const rawInput = data.repoUrlOrSlug.trim();
    
    // Parse owner and repo from URL (e.g., https://github.com/owner/repo or owner/repo)
    let cleanSlug = rawInput
      .replace(/^https?:\/\/github\.com\//i, "")
      .replace(/\.git$/i, "")
      .replace(/\/$/, "");

    const parts = cleanSlug.split("/").filter(Boolean);
    if (parts.length < 2) {
      throw new Error("Invalid GitHub repository URL or slug. Format should be: owner/repo or https://github.com/owner/repo");
    }

    const [owner, repo] = parts;
    const headers: Record<string, string> = {
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "JobMate-AI-Agent",
    };

    // If GITHUB_TOKEN is available in env, use it to bypass unauthenticated rate limits (60 req/hr -> 5000 req/hr)
    const githubToken = process.env.GITHUB_TOKEN || process.env.VITE_GITHUB_TOKEN;
    if (githubToken) {
      headers["Authorization"] = `Bearer ${githubToken.trim()}`;
    }

    console.log(`[GitHub Ingestion] Fetching repository: ${owner}/${repo}...`);

    // 1. Fetch Core Repo Metadata
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (!repoRes.ok) {
      if (repoRes.status === 404) {
        throw new Error(`GitHub repository '${owner}/${repo}' not found. Please ensure the repository is public.`);
      }
      if (repoRes.status === 403) {
        throw new Error("GitHub API rate limit exceeded. Please try again in a few minutes.");
      }
      throw new Error(`GitHub API error (${repoRes.status}): ${await repoRes.text()}`);
    }
    const repoData = await repoRes.json();

    // 2. Fetch Language Distribution
    let languages: Record<string, number> = {};
    try {
      const langRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, { headers });
      if (langRes.ok) {
        languages = await langRes.json();
      }
    } catch {}

    // 3. Fetch README.md
    let readmeContent = "";
    try {
      const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
        headers: { ...headers, "Accept": "application/vnd.github.raw" },
      });
      if (readmeRes.ok) {
        readmeContent = await readmeRes.text();
      }
    } catch {}

    // 4. Fetch Key Manifest Files in parallel
    const manifestFiles: GitHubRepoIngestionResult["manifestFiles"] = {};
    const manifestTargets = [
      { name: "package.json", key: "packageJson" },
      { name: "requirements.txt", key: "requirementsTxt" },
      { name: "go.mod", key: "goMod" },
      { name: "Cargo.toml", key: "cargoToml" },
      { name: "Dockerfile", key: "dockerfile" },
    ] as const;

    await Promise.all(
      manifestTargets.map(async ({ name, key }) => {
        try {
          const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${name}`, {
            headers: { ...headers, "Accept": "application/vnd.github.raw" },
          });
          if (res.ok) {
            const text = await res.text();
            manifestFiles[key] = text.slice(0, 4000); // cap to reasonable AST size
          }
        } catch {}
      })
    );

    // 5. Fetch Root Directory File Tree
    let fileTree: string[] = [];
    try {
      const contentsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, { headers });
      if (contentsRes.ok) {
        const contents = await contentsRes.json();
        if (Array.isArray(contents)) {
          fileTree = contents.map((c: any) => `${c.type === "dir" ? "📁 " : "📄 "}${c.name}`);
        }
      }
    } catch {}

    return {
      owner,
      repo,
      fullName: repoData.full_name || `${owner}/${repo}`,
      description: repoData.description || "",
      stars: repoData.stargazers_count || 0,
      forks: repoData.forks_count || 0,
      primaryLanguage: repoData.language || Object.keys(languages)[0] || "TypeScript",
      languages,
      readmeContent: readmeContent.slice(0, 8000), // top 8000 chars of README
      manifestFiles,
      fileTree: fileTree.slice(0, 30),
      repoUrl: repoData.html_url || `https://github.com/${owner}/${repo}`,
      topics: repoData.topics || [],
    };
  });
