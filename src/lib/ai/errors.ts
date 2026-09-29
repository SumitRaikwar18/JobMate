export type AIErrorCode =
  | "TIMEOUT"
  | "RATE_LIMIT"
  | "PROVIDER_ERROR"
  | "INVALID_OUTPUT"
  | "SCHEMA_ERROR"
  | "RETRIEVAL_FAILURE"
  | "AUTH_ERROR"
  | "DATABASE_ERROR"
  | "VERIFICATION_FAILED"
  | "VERIFICATION_UNAVAILABLE"
  | "UNKNOWN";

export interface AIErrorDetails {
  code: AIErrorCode;
  message: string;
  statusCode?: number | undefined;
  retryable: boolean;
  model?: string | undefined;
  provider?: string | undefined;
  rawResponse?: string | undefined;
  cause?: unknown;
}

export class AIExecutionError extends Error {
  public readonly code: AIErrorCode;
  public readonly retryable: boolean;
  public readonly statusCode?: number | undefined;
  public readonly model?: string | undefined;
  public readonly provider?: string | undefined;
  public readonly rawResponse?: string | undefined;

  constructor(details: AIErrorDetails) {
    super(details.message);
    this.name = "AIExecutionError";
    this.code = details.code;
    this.retryable = details.retryable;
    this.statusCode = details.statusCode;
    this.model = details.model;
    this.provider = details.provider;
    this.rawResponse = details.rawResponse;
    if (details.cause !== undefined) {
      this.cause = details.cause;
    }
  }
}

export function classifyAIError(error: unknown): AIExecutionError {
  if (error instanceof AIExecutionError) {
    return error;
  }

  const errString = String(error || "");
  const errObj = typeof error === "object" && error !== null ? (error as any) : {};

  if (errString.includes("429") || errString.toLowerCase().includes("rate limit") || errString.toLowerCase().includes("quota")) {
    return new AIExecutionError({
      code: "RATE_LIMIT",
      message: errObj.message || "Model provider rate limit or quota exceeded.",
      statusCode: 429,
      retryable: true,
      cause: error,
    });
  }

  if (errString.toLowerCase().includes("timeout") || errString.toLowerCase().includes("abort") || errString.toLowerCase().includes("etimedout")) {
    return new AIExecutionError({
      code: "TIMEOUT",
      message: errObj.message || "Model request timed out.",
      statusCode: 408,
      retryable: true,
      cause: error,
    });
  }

  if (errString.toLowerCase().includes("schema") || errString.toLowerCase().includes("zod") || errString.toLowerCase().includes("validation")) {
    return new AIExecutionError({
      code: "SCHEMA_ERROR",
      message: errObj.message || "Structured output failed schema validation.",
      statusCode: 422,
      retryable: true,
      cause: error,
    });
  }

  if (errString.toLowerCase().includes("unauthorized") || errString.toLowerCase().includes("auth") || errString.toLowerCase().includes("jwt")) {
    return new AIExecutionError({
      code: "AUTH_ERROR",
      message: errObj.message || "Authentication or authorization failure.",
      statusCode: 401,
      retryable: false,
      cause: error,
    });
  }

  return new AIExecutionError({
    code: "PROVIDER_ERROR",
    message: errObj.message || "Unknown error during AI model execution.",
    retryable: false,
    cause: error,
  });
}
