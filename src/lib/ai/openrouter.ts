/**
 * OpenRouter AI Integration for JobMate
 * Connects to OpenRouter API (Default Model: openai/gpt-4o-mini)
 */

const getApiKey = () => {
  let envKey = "";
  try {
    if (typeof import.meta !== "undefined" && (import.meta as any).env) {
      envKey = (import.meta as any).env.VITE_OPENROUTER_API_KEY || (import.meta as any).env.OPENROUTER_API_KEY || "";
    }
  } catch {}
  if (!envKey && typeof process !== "undefined" && process.env) {
    envKey = process.env.VITE_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || "";
  }
  return envKey ? envKey.trim() : "";
};

const getModel = () => {
  let model = "";
  try {
    if (typeof import.meta !== "undefined" && (import.meta as any).env) {
      model = (import.meta as any).env.VITE_OPENROUTER_MODEL || (import.meta as any).env.OPENROUTER_MODEL || "";
    }
  } catch {}
  if (!model && typeof process !== "undefined" && process.env) {
    model = process.env.VITE_OPENROUTER_MODEL || process.env.OPENROUTER_MODEL || "";
  }
  return model || "openai/gpt-4o-mini";
};

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callOpenRouter(
  messages: ChatMessage[],
  temperature = 0.3,
  responseFormatJson = false
): Promise<string> {
  const apiKey = getApiKey();
  const model = getModel();

  if (!apiKey) {
    console.warn("OpenRouter API key not configured.");
    return "";
  }

  const payload: any = {
    model,
    messages,
    temperature,
  };

  if (responseFormatJson) {
    payload.response_format = { type: "json_object" };
  }

  console.log(`[OpenRouter AI] Calling model: ${model} with ${messages.length} messages...`);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
        "HTTP-Referer": "https://jobmate.ai",
        "X-Title": "JobMate AI Resume Platform",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[OpenRouter AI Error]", response.status, errText);
      throw new Error(`OpenRouter API failed (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    console.log(`[OpenRouter AI Response Received] length: ${content.length} chars`);
    return content;
  } catch (error: any) {
    console.error("[OpenRouter AI Exception]:", error);
    throw error;
  }
}

/**
 * Robust LLM JSON Parser (Strips Markdown fences ```json ... ``` and extracts objects/arrays)
 */
export function parseJsonFromLlm<T = any>(raw: string): T {
  if (!raw || typeof raw !== "string") {
    throw new Error("Empty or invalid string provided to parseJsonFromLlm");
  }

  let cleaned = raw.trim();

  // Strip markdown code fences if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }

  // Find outermost JSON boundaries { ... } or [ ... ]
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  let startIdx = -1;

  if (firstBrace !== -1 && firstBracket !== -1) {
    startIdx = Math.min(firstBrace, firstBracket);
  } else if (firstBrace !== -1) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }

  if (startIdx !== -1) {
    const isObject = cleaned[startIdx] === "{";
    const endIdx = isObject ? cleaned.lastIndexOf("}") : cleaned.lastIndexOf("]");
    if (endIdx !== -1 && endIdx > startIdx) {
      cleaned = cleaned.substring(startIdx, endIdx + 1);
    }
  }

  return JSON.parse(cleaned);
}
