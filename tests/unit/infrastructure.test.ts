import { describe, it, expect } from "vitest";
import { PROMPT_REGISTRY, getPromptDefinition } from "../../src/lib/ai/prompts/registry";
import {
  routeModelForTask,
  calculateEstimatedCostUsd,
  estimateTokenCount,
  MODEL_CATALOG,
} from "../../src/lib/ai/model-router";

describe("Phase 3: AI Engineering Infrastructure", () => {
  describe("Prompt Versioning Registry", () => {
    it("contains versioned prompts for all primary agents", () => {
      expect(PROMPT_REGISTRY["jd_analyzer:v1.2"]).toBeDefined();
      expect(PROMPT_REGISTRY["planner:v1.1"]).toBeDefined();
      expect(PROMPT_REGISTRY["synthesizer:v2.0"]).toBeDefined();
      expect(PROMPT_REGISTRY["critic_guardrail:v1.3"]).toBeDefined();
      expect(PROMPT_REGISTRY["ats_auditor:v1.1"]).toBeDefined();
    });

    it("retrieves prompt definitions by agent name and version", () => {
      const prompt = getPromptDefinition("synthesizer", "v2.0");
      expect(prompt.agentName).toBe("synthesizer");
      expect(prompt.version).toBe("v2.0");
      expect(prompt.systemPrompt).toContain("Google XYZ formula");
    });

    it("throws a descriptive error when prompt is not registered", () => {
      expect(() => getPromptDefinition("non_existent_agent", "v9.9")).toThrow(
        /Prompt definition not found/
      );
    });
  });

  describe("Model Router & Cost Estimator", () => {
    it("routes embedding tasks to text-embedding-3-small", () => {
      const model = routeModelForTask("embedding");
      expect(model.id).toBe("openai/text-embedding-3-small");
    });

    it("routes extraction and synthesis tasks to configured models", () => {
      const synthModel = routeModelForTask("synthesis");
      expect(synthModel.id).toBe("openai/gpt-4o-mini");
    });

    it("accurately estimates token count from text", () => {
      const text = "Senior Full-Stack Engineer with React and Go experience.";
      const count = estimateTokenCount(text);
      expect(count).toBeGreaterThan(10);
      expect(count).toBeLessThan(30);
    });

    it("calculates realistic USD cost based on token volume", () => {
      // 10,000 input tokens, 2,000 output tokens for gpt-4o-mini
      // input: 10,000 * 0.15 / 1,000,000 = $0.0015
      // output: 2,000 * 0.60 / 1,000,000 = $0.0012
      // total: $0.0027
      const cost = calculateEstimatedCostUsd("openai/gpt-4o-mini", 10000, 2000);
      expect(cost).toBeCloseTo(0.0027, 4);
    });
  });
});
