import { describe, it, expect } from "vitest";
import { extractJsonFromText } from "../../src/lib/ai/structured-output";

describe("Phase 1: Robust Structured JSON Extraction", () => {
  it("extracts pure JSON string", () => {
    const raw = '{"roleTitle": "Software Engineer", "matchScore": 90}';
    const parsed = extractJsonFromText(raw) as any;
    expect(parsed.roleTitle).toBe("Software Engineer");
    expect(parsed.matchScore).toBe(90);
  });

  it("extracts JSON wrapped in ```json ... ``` markdown code fences", () => {
    const raw = `Here is the requested analysis:
\`\`\`json
{
  "roleTitle": "AI Systems Architect",
  "seniority": "senior",
  "requiredSkills": []
}
\`\`\`
Hope this helps!`;
    const parsed = extractJsonFromText(raw) as any;
    expect(parsed.roleTitle).toBe("AI Systems Architect");
    expect(parsed.seniority).toBe("senior");
  });

  it("extracts JSON wrapped in generic ``` code fences", () => {
    const raw = `\`\`\`
[
  { "id": "claim-1", "text": "Built PostgreSQL API" }
]
\`\`\``;
    const parsed = extractJsonFromText(raw) as any;
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].id).toBe("claim-1");
  });

  it("throws explicit AIExecutionError on non-JSON text", () => {
    const raw = "I am an AI assistant and I cannot return JSON right now.";
    expect(() => extractJsonFromText(raw)).toThrow();
  });
});
