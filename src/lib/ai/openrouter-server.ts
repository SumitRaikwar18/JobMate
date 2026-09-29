import { createServerFn } from "@tanstack/react-start";
import { checkAndConsumeAiQuota } from "./rate-limiter";
import { AIExecutionError } from "./errors";

export interface OpenRouterServerPayload {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  temperature?: number;
  responseFormatJson?: boolean;
}

/**
 * Server-Side Proxy Function for OpenRouter
 * Runs strictly on the server backend (Node / Nitro / Serverless)
 * Protects OPENROUTER_API_KEY so it is NEVER exposed to the client browser.
 * Identity and quota limits are enforced strictly on server side.
 */
export const callOpenRouterServerFn = createServerFn({ method: "POST" })
  .validator((data: OpenRouterServerPayload) => data)
  .handler(async ({ data }) => {
    // Server-side rate limit enforcement (defaulting to secure standard quota)
    const clientIdentifier = "server-session";
    const quota = checkAndConsumeAiQuota(clientIdentifier, "free");
    
    if (!quota.allowed) {
      console.warn(`[ServerFn: OpenRouter] Rate limit hit: ${quota.reason}`);
      throw new AIExecutionError({
        code: "RATE_LIMIT",
        message: quota.reason || "Daily AI limit reached. Please try again tomorrow.",
        statusCode: 429,
        retryable: true,
      });
    }

    const apiKey = (process.env["OPENROUTER_API_KEY"] || "").trim();
    const model = (process.env["OPENROUTER_MODEL"] || "openai/gpt-4o-mini").trim();

    if (!apiKey) {
      console.warn("[ServerFn: OpenRouter] OPENROUTER_API_KEY not configured on server.");
      throw new AIExecutionError({
        code: "PROVIDER_ERROR",
        message: "OPENROUTER_API_KEY is not configured on the server environment.",
        statusCode: 500,
        retryable: false,
      });
    }

    const payload: Record<string, unknown> = {
      model,
      messages: data.messages,
      temperature: data.temperature ?? 0.2,
    };

    if (data.responseFormatJson) {
      payload["response_format"] = { type: "json_object" };
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://jobmate-ebon.vercel.app",
        "X-Title": "JobMate AI Career Engine",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[ServerFn: OpenRouter Error] ${response.status}:`, errText);
      throw new AIExecutionError({
        code: response.status === 429 ? "RATE_LIMIT" : "PROVIDER_ERROR",
        message: `OpenRouter API returned HTTP ${response.status}: ${errText}`,
        statusCode: response.status,
        retryable: response.status === 429 || response.status >= 500,
      });
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    
    if (typeof content !== "string") {
      throw new AIExecutionError({
        code: "INVALID_OUTPUT",
        message: "OpenRouter returned response without message content",
        retryable: true,
      });
    }

    return content;
  });
