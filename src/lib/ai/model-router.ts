export type TaskCategory =
  | "extraction"
  | "planning"
  | "synthesis"
  | "critic_reflection"
  | "ats_audit"
  | "reranking"
  | "embedding";

export interface ModelConfig {
  id: string;
  name: string;
  provider: "openai" | "openrouter" | "anthropic" | "meta";
  costPer1MInputTokens: number; // in USD
  costPer1MOutputTokens: number; // in USD
  contextWindow: number;
  maxOutputTokens: number;
}

export const MODEL_CATALOG: Record<string, ModelConfig> = {
  "openai/gpt-4o-mini": {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openrouter",
    costPer1MInputTokens: 0.15,
    costPer1MOutputTokens: 0.60,
    contextWindow: 128000,
    maxOutputTokens: 4096,
  },
  "openai/gpt-4o": {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "openrouter",
    costPer1MInputTokens: 2.50,
    costPer1MOutputTokens: 10.00,
    contextWindow: 128000,
    maxOutputTokens: 4096,
  },
  "anthropic/claude-3.5-sonnet": {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "openrouter",
    costPer1MInputTokens: 3.00,
    costPer1MOutputTokens: 15.00,
    contextWindow: 200000,
    maxOutputTokens: 8192,
  },
  "meta-llama/llama-3.3-70b-instruct": {
    id: "meta-llama/llama-3.3-70b-instruct",
    name: "Llama 3.3 70B",
    provider: "openrouter",
    costPer1MInputTokens: 0.40,
    costPer1MOutputTokens: 0.40,
    contextWindow: 131000,
    maxOutputTokens: 4096,
  },
  "openai/text-embedding-3-small": {
    id: "openai/text-embedding-3-small",
    name: "Text Embedding 3 Small",
    provider: "openrouter",
    costPer1MInputTokens: 0.02,
    costPer1MOutputTokens: 0.00,
    contextWindow: 8191,
    maxOutputTokens: 0,
  },
};

/**
 * Task-based Model Router
 */
export function routeModelForTask(task: TaskCategory, preferredModel?: string | undefined): ModelConfig {
  if (preferredModel && MODEL_CATALOG[preferredModel]) {
    return MODEL_CATALOG[preferredModel]!;
  }

  switch (task) {
    case "embedding":
      return MODEL_CATALOG["openai/text-embedding-3-small"]!;
    case "extraction":
    case "ats_audit":
    case "reranking":
      return MODEL_CATALOG["openai/gpt-4o-mini"]!;
    case "planning":
    case "synthesis":
    case "critic_reflection":
    default:
      return MODEL_CATALOG["openai/gpt-4o-mini"]!;
  }
}

/**
 * Calculates estimated USD cost for model token usage
 */
export function calculateEstimatedCostUsd(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const model = MODEL_CATALOG[modelId] || MODEL_CATALOG["openai/gpt-4o-mini"]!;
  const inputCost = (inputTokens / 1_000_000) * model.costPer1MInputTokens;
  const outputCost = (outputTokens / 1_000_000) * model.costPer1MOutputTokens;
  return Number((inputCost + outputCost).toFixed(6));
}

/**
 * Heuristic token estimation (approx ~4 characters per token for English/Code)
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 3.8);
}
