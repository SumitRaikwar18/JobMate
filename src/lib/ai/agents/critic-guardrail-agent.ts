import { generateStructuredOutput } from "../structured-output";
import { CriticResultSchema, type CriticResult } from "../schemas/critic-schema";
import type { CandidateEvidenceBank } from "../types";

const SYSTEM_PROMPT = `You are JobMate's Anti-Hallucination & Evidence Grounding Critic Agent.
Your role is to protect the candidate by maintaining strict factual truthfulness.

CRITICAL PRINCIPLES:
1. Compare every claim and metric in the generated resume AGAINST the Candidate Ground-Truth Evidence.
2. The AI is allowed to rephrase and format achievements, BUT it MUST NOT invent new degrees, unworked employers, fake metrics, unlisted cloud infrastructure, or ungrounded statistics.
3. If any claim lacks ground-truth evidence, mark it "unsupported" or "partially_supported".
4. Set passed=true ONLY if all material claims are supported by candidate evidence.
5. If evidence is missing, do not assume or invent evidence.`;

export async function runCriticGuardrailAgent(
  generatedResume: any,
  evidenceBank: CandidateEvidenceBank
): Promise<CriticResult> {
  const userPrompt = `Audit this generated resume against the candidate's verified ground-truth evidence.

Candidate Evidence Bank (Ground Truth):
${JSON.stringify(evidenceBank, null, 2)}

Generated Resume Draft to Audit:
${JSON.stringify(generatedResume, null, 2)}

Return a strict JSON verification report.`;

  try {
    const result = await generateStructuredOutput({
      schema: CriticResultSchema,
      schemaName: "CriticResult",
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      temperature: 0.1,
      maxRetries: 1,
    });

    return {
      ...result.data,
      status: result.data.passed ? "verified" : "reflection_required",
    };
  } catch (err) {
    console.warn("[CriticGuardrailAgent] Live verification unavailable:", err);
    // Safe Failure State: PRD Section 27 Rule 3 explicitly mandates verification_unavailable on failure. Never isPassed: true.
    return {
      passed: false,
      overallGroundingScore: 0,
      verifiedClaimsCount: 0,
      unsupportedClaimsCount: 0,
      claims: [],
      critique: "Automated AI verification was unavailable due to an execution failure. Claims have not been verified.",
      status: "verification_unavailable",
    };
  }
}
