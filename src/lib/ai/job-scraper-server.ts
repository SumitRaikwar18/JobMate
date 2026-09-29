import { createServerFn } from "@tanstack/react-start";

export interface ScrapedJobPosting {
  title: string;
  company: string;
  description: string;
  url: string;
  location?: string | undefined;
  salaryRange?: string | undefined;
  source: "greenhouse" | "lever" | "linkedin" | "indeed" | "ashby" | "workday" | "generic";
}

/**
 * Server Function: Fetches and cleans job descriptions from public job links
 * Handles CORS and HTML parsing server-side.
 */
export const scrapeJobUrlServerFn = createServerFn({ method: "POST" })
  .validator((data: { jobUrl: string }) => data)
  .handler(async ({ data }): Promise<ScrapedJobPosting> => {
    const rawUrl = data.jobUrl.trim();
    if (!rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")) {
      throw new Error("Invalid URL. Please include http:// or https://");
    }

    console.log(`[Job Scraper] Fetching job posting from: ${rawUrl}...`);

    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    };

    const response = await fetch(rawUrl, { headers, redirect: "follow" });
    if (!response.ok) {
      throw new Error(`Failed to fetch job posting (${response.status}: ${response.statusText})`);
    }

    const html = await response.text();
    let source: ScrapedJobPosting["source"] = "generic";
    if (rawUrl.includes("greenhouse.io")) source = "greenhouse";
    else if (rawUrl.includes("lever.co")) source = "lever";
    else if (rawUrl.includes("linkedin.com")) source = "linkedin";
    else if (rawUrl.includes("indeed.com")) source = "indeed";
    else if (rawUrl.includes("ashbyhq.com")) source = "ashby";
    else if (rawUrl.includes("myworkdayjobs.com")) source = "workday";

    // 1. Try to extract Schema.org/JobPosting JSON-LD
    const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    if (jsonLdMatch) {
      for (const tag of jsonLdMatch) {
        try {
          const jsonStr = tag.replace(/<script[^>]*>|<\/script>/gi, "").trim();
          const parsed = JSON.parse(jsonStr);
          const jobObj = Array.isArray(parsed) ? parsed.find((p) => p["@type"] === "JobPosting") : (parsed["@type"] === "JobPosting" ? parsed : null);

          if (jobObj && jobObj.title) {
            const cleanDesc = sanitizeHtmlToMarkdown(jobObj.description || "");
            const companyName = jobObj.hiringOrganization?.name || extractFallbackCompany(html) || "Target Employer";
            return {
              title: jobObj.title.trim(),
              company: companyName.trim(),
              description: cleanDesc.length > 50 ? cleanDesc : sanitizeHtmlToMarkdown(html),
              url: rawUrl,
              location: jobObj.jobLocation?.address?.addressLocality || jobObj.jobLocation?.address?.addressRegion,
              salaryRange: jobObj.baseSalary?.value?.value ? `$${jobObj.baseSalary.value.value}` : undefined,
              source,
            };
          }
        } catch {}
      }
    }

    // 2. Fallback Heuristic DOM Extraction
    const title = extractFallbackTitle(html);
    const company = extractFallbackCompany(html);
    const cleanDescription = sanitizeHtmlToMarkdown(html);

    return {
      title: title || "Software Engineer",
      company: company || "Target Employer",
      description: cleanDescription,
      url: rawUrl,
      source,
    };
  });

function extractFallbackTitle(html: string): string {
  // Check <meta property="og:title">
  const ogMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  if (ogMatch && ogMatch[1]) {
    return cleanJobTitleString(ogMatch[1]);
  }

  // Check <title>
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    return cleanJobTitleString(titleMatch[1]);
  }

  // Check <h1>
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match && h1Match[1]) {
    return cleanJobTitleString(h1Match[1]);
  }

  return "Software Engineer";
}

function cleanJobTitleString(title: string): string {
  return title
    .replace(/\s*\|\s*.*$/, "")
    .replace(/\s*-\s*.*job.*$/i, "")
    .replace(/\s*at\s+.*$/i, "")
    .trim();
}

function extractFallbackCompany(html: string): string {
  const ogSite = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i);
  if (ogSite && ogSite[1]) return ogSite[1].trim();

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    const parts = titleMatch[1].split(/[-|–]/);
    if (parts.length > 1) {
      const lastPart = parts[parts.length - 1];
      if (lastPart) return lastPart.trim();
    }
  }

  return "Target Company";
}

function sanitizeHtmlToMarkdown(html: string): string {
  let text = html;

  // Remove scripts, styles, svgs, noscripts, iframes
  text = text.replace(/<script[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, "");
  text = text.replace(/<svg[\s\S]*?<\/svg>/gi, "");
  text = text.replace(/<noscript[\s\S]*?<\/noscript>/gi, "");
  text = text.replace(/<iframe[\s\S]*?<\/iframe>/gi, "");
  text = text.replace(/<!--[\s\S]*?-->/gi, "");

  // Convert headings
  text = text.replace(/<h[1-2][^>]*>(.*?)<\/h[1-2]>/gi, "\n\n## $1\n\n");
  text = text.replace(/<h[3-6][^>]*>(.*?)<\/h[3-6]>/gi, "\n\n### $1\n\n");

  // Convert list items
  text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, "\n- $1");
  text = text.replace(/<br\s*[\/]?>/gi, "\n");
  text = text.replace(/<\/p>/gi, "\n\n");

  // Strip remaining tags
  text = text.replace(/<[^>]+>/g, " ");

  // Decode common HTML entities
  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  // Clean excessive whitespace
  text = text.replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").trim();

  return text.slice(0, 8000); // cap to reasonable LLM token length
}
