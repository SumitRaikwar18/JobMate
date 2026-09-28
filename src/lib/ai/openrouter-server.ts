import { createServerFn } from "@tanstack/react-start";
import { checkAndConsumeAiQuota } from "./rate-limiter";

export interface OpenRouterServerPayload {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  temperature?: number;
  responseFormatJson?: boolean;
  userId?: string;
  tier?: "free" | "pro";
}

/**
 * Server-Side Proxy Function for OpenRouter
 * Runs strictly on the server backend (Node / Nitro / Vercel Serverless)
 * Protects OPENROUTER_API_KEY so it is NEVER exposed to the client browser.
 */
export const callOpenRouterServerFn = createServerFn({ method: "POST" })
  .validator((data: OpenRouterServerPayload) => data)
  .handler(async ({ data }) => {
    const quota = checkAndConsumeAiQuota(data.userId || "anonymous-client", data.tier || "free");
    if (!quota.allowed) {
      console.warn(`[ServerFn: OpenRouter] Rate limit hit: ${quota.reason}`);
      throw new Error(quota.reason || "Daily AI limit reached. Please try again tomorrow.");
    }

    const apiKey = (process.env.OPENROUTER_API_KEY || "").trim();
    const model = (process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini").trim();

    if (!apiKey) {
      console.warn("[ServerFn: OpenRouter] OPENROUTER_API_KEY not configured on server.");
      return "";
    }

    const payload: any = {
      model,
      messages: data.messages,
      temperature: data.temperature ?? 0.3,
    };

    if (data.responseFormatJson) {
      payload.response_format = { type: "json_object" };
    }

    console.log(`[ServerFn: OpenRouter] 🛡️ Securely dispatching to ${model} from server backend...`);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://jobmate-ebon.vercel.app",
        "X-Title": "JobMate AI Resume Engine",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[ServerFn: OpenRouter Error] ${response.status}:`, errText);
      throw new Error(`OpenRouter API failed (${response.status}): ${errText}`);
    }

    const result = await response.json();
    return result.choices?.[0]?.message?.content || "";
  });
