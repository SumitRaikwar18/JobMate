import { describe, it, expect } from "vitest";
import { runCriticGuardrailAgent } from "../../src/lib/ai/agents/critic-guardrail-agent";
import { runSynthesizerAgent } from "../../src/lib/ai/agents/synthesizer-agent";

describe("Phase 1: Anti-Hallucination & Safe Failure Behavior", () => {
  it("never returns isPassed: true when verification execution fails or is unavailable", async () => {
    const fakeResume = {
      summary: "Senior Engineer with 10 years experience",
      experiences: [],
    };
    const emptyEvidenceBank = {
      candidateId: "user-test",
      fullName: "Test Candidate",
      targetRole: "Engineer",
      evidenceItems: [],
    };

    // When OpenRouter is unavailable in unit testing, Critic must fail safely
    const report = await runCriticGuardrailAgent(fakeResume, emptyEvidenceBank);
    
    // PRD Section 27 Rule 3 & Invariant 3:
    // "If verification fails: verification_unavailable. Never isPassed: true as an error fallback."
    expect(report.passed).toBe(false);
    expect(report.status).toBe("verification_unavailable");
  });

  it("synthesizer baseline does NOT invent fake companies (e.g. Stripe) or fake metrics (e.g. 1.2M transactions) when LLM fails", async () => {
    const realEvidenceBank = {
      candidateId: "user-test-2",
      fullName: "Jane Doe",
      targetRole: "Full Stack Engineer",
      evidenceItems: [
        {
          id: "ev-1",
          candidateId: "user-test-2",
          sourceType: "experience" as const,
          category: "experience",
          title: "Full Stack Developer",
          organization: "Local Startup Inc",
          technologiesUsed: ["React", "TypeScript", "PostgreSQL"],
          verifiedClaims: ["Developed customer-facing dashboard in React and TypeScript"],
          metrics: [],
          verified: true,
          confidence: 1.0,
          dateRange: "2023 - Present",
          content: "Built customer dashboard",
          technologies: ["React", "TypeScript"],
          concepts: [],
        },
      ],
    };

    const jobAnalysis = {
      roleTitle: "Full Stack Engineer",
      company: "Acme Corp",
      seniority: "Mid-Level" as const,
      requiredHardSkills: ["React", "TypeScript", "PostgreSQL"],
      requiredSoftSkills: ["Collaboration"],
      domainKeywords: ["Web Applications"],
      responsibilities: ["Build features"],
      keyChallenges: ["Performance"],
      overallMatchScore: 85,
      mustHaveSkills: ["React", "TypeScript"],
      coreResponsibilities: ["Build features"],
    };

    const resumePlan = {
      strategySummary: "Focus on React experience",
      recommendedTemplate: "modern" as const,
      sectionOrder: ["personal", "summary", "experience", "skills"],
      selectedEvidenceIds: ["ev-1"],
      keywordTargetingMap: {
        summary: ["React"],
        experience: ["TypeScript"],
        projects: [],
        skills: ["React", "TypeScript"],
      },
    };

    const draft = await runSynthesizerAgent(realEvidenceBank, jobAnalysis, resumePlan);

    // Verify factual grounding:
    // 1. Must use the candidate's real company (Local Startup Inc), NEVER a fabricated name like Stripe
    expect(draft.experience[0]?.company).toBe("Local Startup Inc");
    // 2. Must NOT contain fabricated 1.2M transaction metrics or 99.999% uptime
    const allBulletText = draft.experience.flatMap((e) => e.bullets).join(" ");
    expect(allBulletText).not.toContain("1.2M");
    expect(allBulletText).not.toContain("99.99%");
    expect(allBulletText).not.toContain("UC Berkeley");
  });
});
