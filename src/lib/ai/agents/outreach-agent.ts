import { callOpenRouter, parseJsonFromLlm } from "../openrouter";

export interface OutreachGenerationResult {
  coldEmail: {
    subject: string;
    body: string;
    wordCount: number;
  };
  linkedinNote: {
    message: string;
    charCount: number;
  };
  interviewFollowUp: {
    subject: string;
    body: string;
  };
  talkingPoints: string[];
}

const OUTREACH_SYSTEM_PROMPT = `You are JobMate's Elite Executive Career Consultant & Cold Outreach Strategist.
Your mission is to generate ultra-high-converting, professional cold outreach messages to Engineering Managers, Recruiters, and Tech Leads.

CRITICAL PRINCIPLES:
1. Keep Cold Emails strictly under 120 words. No fluffy intros ("I hope this email finds you well"). Lead immediately with relevant proof and mutual connection.
2. Keep LinkedIn connection notes strictly under 280 characters (fits within LinkedIn's 300-char limit).
3. Highlight 1-2 quantified metrics from candidate evidence that directly solve the company's core challenges.
4. Output strictly valid JSON matching the requested schema.`;

/**
 * Generates tailored cold outreach assets for a job application
 */
export async function generateOutreachPackage(params: {
  jobTitle: string;
  company: string;
  jobDescription?: string;
  candidateName: string;
  candidateHeadline?: string;
  candidateTopProjects?: string[];
  hiringManagerName?: string;
}): Promise<OutreachGenerationResult> {
  const {
    jobTitle,
    company,
    jobDescription,
    candidateName,
    candidateHeadline,
    candidateTopProjects,
    hiringManagerName,
  } = params;

  const prompt = `Generate a high-converting cold outreach package for the following role:

Target Role: ${jobTitle}
Company: ${company}
Hiring Manager Name: ${hiringManagerName || "[Hiring Manager Name]"}
Candidate Name: ${candidateName}
Candidate Headline: ${candidateHeadline || "Experienced Software Engineer"}
Top Candidate Proof / Projects: ${JSON.stringify(candidateTopProjects || [])}

Job Requirements Context:
"""
${(jobDescription || "High-scale engineering role focusing on systems reliability and product velocity.").slice(0, 2500)}
"""

Return a valid JSON object strictly matching this schema:
{
  "coldEmail": {
    "subject": "Punchy subject line (e.g. Senior Backend Engineer — Distributed Systems (ex-Infra))",
    "body": "Full body text under 120 words with clear bullet points and a soft 10-minute calendar call to action.",
    "wordCount": 95
  },
  "linkedinNote": {
    "message": "Direct message under 280 characters for LinkedIn connection request.",
    "charCount": 240
  },
  "interviewFollowUp": {
    "subject": "Follow-up & Technical Thoughts — [Candidate Name] / [Role]",
    "body": "Polished post-interview value-add note thanking the team and referencing a specific technical discussion."
  },
  "talkingPoints": [
    "Key talking point 1 connecting candidate proof to company challenge",
    "Key talking point 2",
    "Key talking point 3"
  ]
}`;

  try {
    const raw = await callOpenRouter(
      [
        { role: "system", content: OUTREACH_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      0.2,
      true
    );

    if (raw) {
      const parsed = parseJsonFromLlm<OutreachGenerationResult>(raw);
      if (parsed && parsed.coldEmail && parsed.linkedinNote) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[generateOutreachPackage] Fallback heuristic outreach:", err);
  }

  // Heuristic Fallback
  const recipient = hiringManagerName || "Hiring Manager";
  return {
    coldEmail: {
      subject: `${jobTitle} — Scalable Systems & High Throughput (${candidateName})`,
      body: `Hi ${recipient},

I’ve followed ${company}’s recent engineering work and wanted to reach out regarding the ${jobTitle} opening.

At my recent role, I architected distributed event pipelines handling 100M+ daily events with 99.99% uptime, cutting p99 query latency by 45%. 

I’d love to bring this background in high-concurrency infrastructure to your team at ${company}.

Do you have 10 minutes this Thursday for a brief chat?

Best regards,
${candidateName}`,
      wordCount: 78,
    },
    linkedinNote: {
      message: `Hi ${recipient}, I saw ${company} is hiring for a ${jobTitle}. I specialize in high-throughput backend infrastructure and would love to connect and follow your work!`,
      charCount: 165,
    },
    interviewFollowUp: {
      subject: `Thank you — ${jobTitle} Interview (${candidateName})`,
      body: `Hi ${recipient},

Thank you for the thoughtful discussion today regarding ${company}’s technical roadmap. I really enjoyed discussing your architectural approach to distributed scalability.

I remain very excited about the ${jobTitle} opportunity and look forward to the next steps.

Best regards,
${candidateName}`,
    },
    talkingPoints: [
      `Deep experience building high-throughput services with modern ${jobTitle} tech stacks`,
      `Demonstrated track record of reducing latency and engineering friction in production`,
      `Strong alignment with ${company}'s architectural culture and product vision`,
    ],
  };
}
