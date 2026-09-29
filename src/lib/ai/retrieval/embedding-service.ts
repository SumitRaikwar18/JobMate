import { createServerFn } from "@tanstack/react-start";
import { AIExecutionError } from "../errors";

export interface EmbeddingOptions {
  model?: string | undefined;
  dimensions?: number | undefined;
}

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  tokensUsed?: number | undefined;
}

export interface BatchEmbeddingResult {
  embeddings: number[][];
  model: string;
  tokensUsed?: number | undefined;
}

/**
 * In-memory server cache for embeddings to minimize API costs and latency
 */
const embeddingCache = new Map<string, number[]>();

function getCacheKey(text: string, model: string): string {
  return `${model}:${text.trim().toLowerCase()}`;
}

export type EmbeddingEnvironmentMode = "production" | "development" | "test";

export function getEmbeddingEnvironmentMode(): EmbeddingEnvironmentMode {
  if (process.env["EMBEDDING_MODE"] === "production" || process.env["NODE_ENV"] === "production") {
    return "production";
  }
  if (process.env["EMBEDDING_MODE"] === "test" || process.env["NODE_ENV"] === "test") {
    return "test";
  }
  return "development";
}

/**
 * Core dense vector embedding generation function
 */
export async function generateDenseEmbedding(
  text: string,
  options?: { model?: string | undefined }
): Promise<EmbeddingResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new AIExecutionError({
      code: "INVALID_OUTPUT",
      message: "Cannot generate embedding for empty text.",
      retryable: false,
    });
  }

  const mode = getEmbeddingEnvironmentMode();
  const model = options?.model || "openai/text-embedding-3-small";
  const cacheKey = getCacheKey(trimmed, model);

  if (embeddingCache.has(cacheKey)) {
    const cached = embeddingCache.get(cacheKey)!;
    return { embedding: cached, model };
  }

  const apiKey = (process.env["OPENROUTER_API_KEY"] || "").trim();

  // STRICT PRODUCTION MODE: API key is mandatory. Never silently fall back to mock embeddings in production.
  if (mode === "production" && !apiKey) {
    throw new AIExecutionError({
      code: "PROVIDER_ERROR",
      message: "embedding_unavailable: OPENROUTER_API_KEY is not configured for production embedding generation.",
      retryable: false,
    });
  }

  // In offline test mode or development mode without API key, use deterministic normalized unit vector
  if (!apiKey) {
    const fallbackVec = generateDeterministicUnitVector(trimmed, 1536);
    embeddingCache.set(cacheKey, fallbackVec);
    return { embedding: fallbackVec, model: "deterministic-hash-1536" };
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://jobmate-ebon.vercel.app",
        "X-Title": "JobMate AI Career Engine",
      },
      body: JSON.stringify({
        model,
        input: trimmed,
      }),
    });

    if (!response.ok) {
      if (mode === "production") {
        throw new AIExecutionError({
          code: "PROVIDER_ERROR",
          message: `embedding_unavailable: Remote embedding provider failed with status ${response.status}.`,
          retryable: true,
        });
      }
      console.warn(`[EmbeddingService] OpenRouter embeddings error ${response.status}, using deterministic fallback in ${mode} mode.`);
      const fallbackVec = generateDeterministicUnitVector(trimmed, 1536);
      return { embedding: fallbackVec, model: "deterministic-hash-1536" };
    }

    const json = await response.json();
    const embedding = json.data?.[0]?.embedding;
    if (!embedding || !Array.isArray(embedding)) {
      if (mode === "production") {
        throw new AIExecutionError({
          code: "INVALID_OUTPUT",
          message: "embedding_unavailable: Invalid embedding response structure received from provider in production.",
          retryable: false,
        });
      }
      throw new Error("Invalid embedding response structure.");
    }

    embeddingCache.set(cacheKey, embedding);
    return {
      embedding,
      model,
      tokensUsed: json.usage?.total_tokens,
    };
  } catch (err) {
    if (err instanceof AIExecutionError) {
      throw err;
    }
    if (mode === "production") {
      throw new AIExecutionError({
        code: "PROVIDER_ERROR",
        message: `embedding_unavailable: Failed connecting to remote embeddings API in production: ${err instanceof Error ? err.message : String(err)}`,
        retryable: true,
      });
    }
    console.warn("[EmbeddingService] Failed calling remote embeddings API, falling back to unit vector:", err);
    const fallbackVec = generateDeterministicUnitVector(trimmed, 1536);
    return { embedding: fallbackVec, model: "deterministic-hash-1536" };
  }
}

/**
 * Server Function: Generate dense vector embedding for single text
 */
export const generateEmbeddingServerFn = createServerFn({ method: "POST" })
  .validator((data: { text: string; model?: string | undefined }) => data)
  .handler(async ({ data }): Promise<EmbeddingResult> => {
    return generateDenseEmbedding(data.text, { model: data.model });
  });

/**
 * Core batch embedding generation function
 */
export async function generateBatchDenseEmbeddings(
  texts: string[],
  options?: { model?: string | undefined }
): Promise<BatchEmbeddingResult> {
  const filteredTexts = texts.map((t) => t.trim()).filter(Boolean);
  if (filteredTexts.length === 0) {
    return { embeddings: [], model: options?.model || "openai/text-embedding-3-small" };
  }

  const model = options?.model || "openai/text-embedding-3-small";
  const results: number[][] = [];
  const uncachedIndices: number[] = [];
  const uncachedTexts: string[] = [];

  filteredTexts.forEach((txt, idx) => {
    const cacheKey = getCacheKey(txt, model);
    if (embeddingCache.has(cacheKey)) {
      results[idx] = embeddingCache.get(cacheKey)!;
    } else {
      uncachedIndices.push(idx);
      uncachedTexts.push(txt);
    }
  });

  if (uncachedTexts.length === 0) {
    return { embeddings: results, model };
  }

  const mode = getEmbeddingEnvironmentMode();
  const apiKey = (process.env["OPENROUTER_API_KEY"] || "").trim();

  if (mode === "production" && !apiKey) {
    throw new AIExecutionError({
      code: "PROVIDER_ERROR",
      message: "embedding_unavailable: OPENROUTER_API_KEY is not configured for production batch embeddings.",
      retryable: false,
    });
  }

  if (!apiKey) {
    uncachedTexts.forEach((txt, i) => {
      const originalIdx = uncachedIndices[i]!;
      const vec = generateDeterministicUnitVector(txt, 1536);
      embeddingCache.set(getCacheKey(txt, model), vec);
      results[originalIdx] = vec;
    });
    return { embeddings: results, model: "deterministic-hash-1536" };
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://jobmate-ebon.vercel.app",
        "X-Title": "JobMate AI Career Engine",
      },
      body: JSON.stringify({
        model,
        input: uncachedTexts,
      }),
    });

    if (!response.ok) {
      if (mode === "production") {
        throw new AIExecutionError({
          code: "PROVIDER_ERROR",
          message: `embedding_unavailable: Remote batch embedding provider failed with status ${response.status}.`,
          retryable: true,
        });
      }
      throw new Error(`Embedding batch request failed (${response.status})`);
    }

    const json = await response.json();
    const rawData = json.data || [];

    rawData.forEach((item: any, i: number) => {
      const originalIdx = uncachedIndices[i]!;
      const txt = uncachedTexts[i]!;
      const vec = item.embedding;
      embeddingCache.set(getCacheKey(txt, model), vec);
      results[originalIdx] = vec;
    });

    return {
      embeddings: results,
      model,
      tokensUsed: json.usage?.total_tokens,
    };
  } catch (err) {
    if (err instanceof AIExecutionError) {
      throw err;
    }
    if (mode === "production") {
      throw new AIExecutionError({
        code: "PROVIDER_ERROR",
        message: `embedding_unavailable: Failed connecting to remote batch embeddings API in production: ${err instanceof Error ? err.message : String(err)}`,
        retryable: true,
      });
    }
    uncachedTexts.forEach((txt, i) => {
      const originalIdx = uncachedIndices[i]!;
      const vec = generateDeterministicUnitVector(txt, 1536);
      results[originalIdx] = vec;
    });
    return { embeddings: results, model: "deterministic-hash-1536" };
  }
}

/**
 * Server Function: Generate batch embeddings for multiple texts
 */
export const generateBatchEmbeddingsServerFn = createServerFn({ method: "POST" })
  .validator((data: { texts: string[]; model?: string | undefined }) => data)
  .handler(async ({ data }): Promise<BatchEmbeddingResult> => {
    return generateBatchDenseEmbeddings(data.texts, { model: data.model });
  });

/**
 * Generate a deterministic normalized 1536-dimensional unit vector from text hash
 * Used for offline testing and graceful degradation when embedding provider is offline.
 */
export function generateDeterministicUnitVector(text: string, dimensions = 1536): number[] {
  const vec = new Array(dimensions).fill(0);
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  for (let d = 0; d < dimensions; d++) {
    const pseudoRandom = Math.sin(hash + d * 0.1234567);
    vec[d] = pseudoRandom;
  }

  // Normalize to L2 unit norm
  let norm = 0;
  for (let d = 0; d < dimensions; d++) {
    norm += vec[d] * vec[d];
  }
  norm = Math.sqrt(norm) || 1;

  for (let d = 0; d < dimensions; d++) {
    vec[d] = vec[d] / norm;
  }

  return vec;
}
