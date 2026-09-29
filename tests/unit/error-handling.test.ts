import { describe, it, expect } from "vitest";
import { classifyAIError, AIExecutionError } from "../../src/lib/ai/errors";

describe("Phase 1: AI Error Taxonomy & Classification", () => {
  it("correctly classifies rate limit errors (429)", () => {
    const error = new Error("OpenRouter API returned 429: Rate limit exceeded");
    const classified = classifyAIError(error);
    expect(classified.code).toBe("RATE_LIMIT");
    expect(classified.retryable).toBe(true);
    expect(classified.statusCode).toBe(429);
  });

  it("correctly classifies timeout errors", () => {
    const error = new Error("Request timed out after 15000ms: ETIMEDOUT");
    const classified = classifyAIError(error);
    expect(classified.code).toBe("TIMEOUT");
    expect(classified.retryable).toBe(true);
    expect(classified.statusCode).toBe(408);
  });

  it("correctly classifies schema validation errors", () => {
    const error = new Error("Zod validation failure: invalid schema");
    const classified = classifyAIError(error);
    expect(classified.code).toBe("SCHEMA_ERROR");
    expect(classified.retryable).toBe(true);
    expect(classified.statusCode).toBe(422);
  });

  it("preserves existing AIExecutionError instances", () => {
    const original = new AIExecutionError({
      code: "VERIFICATION_FAILED",
      message: "Unsupported metric in resume bullet",
      retryable: false,
    });
    const classified = classifyAIError(original);
    expect(classified).toBe(original);
    expect(classified.code).toBe("VERIFICATION_FAILED");
  });
});
