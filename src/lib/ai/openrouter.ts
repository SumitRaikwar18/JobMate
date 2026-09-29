/**
 * OpenRouter AI Integration for JobMate
 * Routes all requests through secure server function (callOpenRouterServerFn)
 * Guarantees zero secret leaks in client browser inspect / DevTools / network tab.
 * NEVER fabricates fake candidate metrics, companies, or accomplishments.
 */

import { callOpenRouterServerFn } from "./openrouter-server";
import { extractJsonFromText } from "./structured-output";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callOpenRouter(
  messages: ChatMessage[],
  temperature = 0.2,
  responseFormatJson = false
): Promise<string> {
  const content = await callOpenRouterServerFn({
    data: {
      messages,
      temperature,
      responseFormatJson,
    },
  });

  if (typeof content === "string" && content.trim().length > 0) {
    return content;
  }

  throw new Error("Model execution returned empty content. No fallback fabrication permitted.");
}

/**
 * Robust LLM JSON Parser (Strips Markdown fences ```json ... ``` and extracts objects/arrays)
 */
export function parseJsonFromLlm<T = any>(raw: string): T {
  return extractJsonFromText(raw) as T;
}
