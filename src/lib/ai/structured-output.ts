import { z } from "zod";
import { callOpenRouterServerFn } from "./openrouter-server";
import { AIExecutionError, classifyAIError } from "./errors";

export interface StructuredGenerationOptions<T extends z.ZodTypeAny> {
  schema: T;
  schemaName: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxRetries?: number;
  model?: string;
}

export interface StructuredGenerationResult<T> {
  data: T;
  model: string;
  rawText: string;
  retries: number;
}

/**
 * Robust JSON Extractor with markdown fence handling and brace boundary matching
 */
export function extractJsonFromText(raw: string): unknown {
  if (!raw || typeof raw !== "string") {
    throw new AIExecutionError({
      code: "INVALID_OUTPUT",
      message: "LLM returned empty or non-string response",
      retryable: true,
      rawResponse: raw,
    });
  }

  let cleaned = raw.trim();

  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }

  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (nestedErr) {
        throw new AIExecutionError({
          code: "INVALID_OUTPUT",
          message: `Failed to parse extracted JSON block from LLM output`,
          retryable: true,
          rawResponse: raw,
          cause: nestedErr,
        });
      }
    }
    throw new AIExecutionError({
      code: "INVALID_OUTPUT",
      message: `No JSON object or array found in LLM output`,
      retryable: true,
      rawResponse: raw,
    });
  }
}

/**
 * Dispatches structured generation to server function, parses and validates with Zod,
 * retrying with repair guidance if schema validation fails.
 */
export async function generateStructuredOutput<T extends z.ZodTypeAny>(
  options: StructuredGenerationOptions<T>
): Promise<StructuredGenerationResult<z.infer<T>>> {
  const {
    schema,
    schemaName,
    systemPrompt,
    userPrompt,
    temperature = 0.2,
    maxRetries = 2,
    model,
  } = options;

  let retries = 0;
  let lastError: unknown = null;
  let currentPrompt = userPrompt;

  while (retries <= maxRetries) {
    try {
      const rawText = await callOpenRouterServerFn({
        data: {
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: currentPrompt },
          ],
          temperature,
          responseFormatJson: true,
        },
      });

      if (!rawText || rawText.trim().length === 0) {
        throw new AIExecutionError({
          code: "PROVIDER_ERROR",
          message: "Server returned empty response from OpenRouter",
          retryable: true,
        });
      }

      const rawJson = extractJsonFromText(rawText);
      const parseResult = schema.safeParse(rawJson);

      if (parseResult.success) {
        return {
          data: parseResult.data,
          model: model || "openai/gpt-4o-mini",
          rawText,
          retries,
        };
      }

      // Schema validation failed - construct repair prompt for next retry
      const issues = parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      console.warn(`[StructuredOutput: ${schemaName}] Schema validation failed (attempt ${retries + 1}/${maxRetries + 1}):`, issues);

      lastError = new AIExecutionError({
        code: "SCHEMA_ERROR",
        message: `Schema validation failed for ${schemaName}: ${issues}`,
        retryable: true,
        rawResponse: rawText,
        cause: parseResult.error,
      });

      currentPrompt = `${userPrompt}\n\n[CRITICAL CORRECTION REQUIRED: Your previous JSON response violated the ${schemaName} schema with errors: ${issues}. Respond with STRICTLY valid JSON conforming to all schema requirements.]`;
    } catch (err: unknown) {
      lastError = classifyAIError(err);
      console.warn(`[StructuredOutput: ${schemaName}] Execution error (attempt ${retries + 1}):`, (lastError as Error).message);
    }

    retries++;
  }

  throw lastError instanceof AIExecutionError
    ? lastError
    : new AIExecutionError({
        code: "INVALID_OUTPUT",
        message: `Failed to generate valid structured ${schemaName} after ${maxRetries} retries`,
        retryable: false,
        cause: lastError,
      });
}
