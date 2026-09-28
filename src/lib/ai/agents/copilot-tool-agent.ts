import { callOpenRouter, parseJsonFromLlm } from "../openrouter";
import type { ResumeDataState } from "@/routes/builder";

export type CopilotActionType =
  | "add_experience"
  | "update_experience"
  | "delete_experience"
  | "add_project"
  | "update_project"
  | "delete_project"
  | "update_summary"
  | "update_skills"
  | "update_personal_info"
  | "set_template"
  | "clear_resume";

export interface CopilotAction {
  type: CopilotActionType;
  data: any;
}

export interface CopilotToolExecutionResult {
  reply: string;
  actions: CopilotAction[];
  suggestedFollowUps?: string[];
}

const COPILOT_SYSTEM_PROMPT = `You are JobMate's Autonomous Resume Architect Copilot.
You have DIRECT TOOL-CALLING capabilities to mutate, build, and optimize the candidate's live ATS resume in real time based on natural chat instructions.

SUPPORTED ACTIONS:
1. add_experience: { role, company, location, startDate, endDate, current, bullets: string[] }
2. update_experience: { id, role, company, bullets: string[] }
3. add_project: { name, technologies, link, bullets: string[] }
4. update_summary: { summary: string }
5. update_skills: { languages?: string[], frameworks?: string[], tools?: string[], softSkills?: string[] }
6. update_personal_info: { name?: string, targetRole?: string, email?: string, phone?: string, location?: string, github?: string, linkedin?: string, portfolio?: string }
7. set_template: { template: "modern" | "classic" | "minimal" | "technical" }
8. clear_resume: {}

CRITICAL PRINCIPLES:
1. If the user tells you about their background, experiences, skills, projects, or desires to change something, formulate exact, high-impact action objects.
2. Formulate all accomplishment bullets using the Google XYZ formula: "Accomplished [X] as measured by [Y], by doing [Z]".
3. Always respond in valid JSON matching this schema:
{
  "reply": "Friendly concise explanation of what was added or modified.",
  "actions": [
    { "type": "add_experience", "data": { ... } }
  ],
  "suggestedFollowUps": ["Suggested next prompt 1", "Suggested next prompt 2"]
}`;

/**
 * Executes a conversational copilot turn with tool-calling actions
 */
export async function executeCopilotChatTurn(params: {
  userMessage: string;
  currentResume: ResumeDataState;
  conversationHistory: Array<{ role: "assistant" | "user"; content: string }>;
}): Promise<CopilotToolExecutionResult> {
  const { userMessage, currentResume, conversationHistory } = params;

  const prompt = `Current Resume State:
${JSON.stringify({
  personal: currentResume.personal,
  summary: currentResume.summary,
  experienceCount: currentResume.experiences.length,
  projectCount: currentResume.projects.length,
  skills: currentResume.skills,
})}

User Request: "${userMessage}"

Generate conversational reply and executable tool-calling actions in strictly valid JSON format.`;

  const messages = [
    { role: "system" as const, content: COPILOT_SYSTEM_PROMPT },
    ...conversationHistory.slice(-4),
    { role: "user" as const, content: prompt },
  ];

  const raw = await callOpenRouter(messages, 0.2);
  const parsed = parseJsonFromLlm(raw);

  return {
    reply: parsed.reply || "I've updated your resume accordingly.",
    actions: Array.isArray(parsed.actions) ? parsed.actions : [],
    suggestedFollowUps: Array.isArray(parsed.suggestedFollowUps) ? parsed.suggestedFollowUps : [],
  };
}
