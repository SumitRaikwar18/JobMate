import { createFileRoute } from "@tanstack/react-router";
import {
  Bot,
  Check,
  Code2,
  Copy,
  FileCheck2,
  HelpCircle,
  Loader2,
  Mail,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Target,
  Trash2,
  User,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AppLayout } from "@/components/layout/app-layout";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { callOpenRouter } from "@/lib/ai/openrouter";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "AI Career Copilot — JobMate" },
      { name: "description", content: "Interactive AI Career Assistant for resume optimization, XYZ bullet transformation, and mock technical interviews." },
      { property: "og:title", content: "AI Career Copilot — JobMate" },
      { property: "og:description", content: "Interactive career copilot and interview simulator." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: AssistantPage,
});

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const PRESET_PROMPTS = [
  {
    icon: Target,
    label: "Google XYZ Bullet",
    prompt: "Here is one of my resume bullets: 'Responsible for building backend services and optimizing database queries.' Please rewrite it into 3 strong, measurable Google XYZ-format bullets (Accomplished [X] as measured by [Y] by doing [Z]).",
  },
  {
    icon: Sparkles,
    label: "Simulate Technical Interview",
    prompt: "I am interviewing for a Senior Full-Stack / AI Engineer role. Give me 3 challenging technical scenario questions and 2 behavioral questions (STAR format) that top tier tech companies ask.",
  },
  {
    icon: Mail,
    label: "Cold Outreach Email",
    prompt: "Draft a concise, high-converting cold email (under 120 words) to an Engineering Manager at Stripe for a Senior Backend Engineer opening, highlighting high-throughput distributed systems experience.",
  },
  {
    icon: FileCheck2,
    label: "Audit Passive Language",
    prompt: "What are the top 10 weak or passive resume phrases that hurt ATS parseability and recruiter interest, and what active impact verbs should I replace them with?",
  },
];

function AssistantPage() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "assistant",
      content: `👋 Hello ${profile?.full_name || "there"}! I'm your dedicated **JobMate AI Career Copilot**.\n\nI can help you with:\n- **Transforming bullets into Google XYZ format** (Accomplished X, measured by Y, doing Z)\n- **Simulating realistic technical & behavioral interviews**\n- **Tailoring candidate evidence to specific job requirements**\n- **Drafting high-conversion hiring manager outreach messages**\n\nHow can I help accelerate your job hunt today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (customPrompt?: string) => {
    const text = (customPrompt || input).trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInput("");
    setIsLoading(true);

    try {
      const candidateContext = `Candidate Name: ${profile?.full_name || "Candidate"}
Target Role: ${profile?.target_role || "Software Engineer"}
Headline: ${profile?.headline || "Experienced Technical Practitioner"}
Years of Experience: ${profile?.years_of_experience || "3+"}`;

      const response = await callOpenRouter(
        [
          {
            role: "system",
            content: `You are JobMate AI, an elite career engineering agent and hiring consultant.
Candidate Profile:
${candidateContext}

Guidelines:
1. Ground all resume advice in measurable outcomes, active verbs, and evidence-grounded accomplishments (Google XYZ formula).
2. Avoid generic cliches, buzzword stuffing, or unproven claims.
3. For interview prep, provide realistic rubric assessments and follow-up probes.
4. Keep answers highly structured with markdown headings, bullet points, and code blocks where helpful.`,
          },
          ...messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          { role: "user", content: text },
        ],
        0.4
      );

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response || "I encountered an issue generating a response. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("Assistant chat error:", err);
      toast.error("Failed to connect to AI assistant.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: "assistant",
        content: "Conversation cleared. What would you like to work on next?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <AppLayout activeNav="assistant">
      <div className="flex flex-col h-[calc(100vh-8rem)] max-w-5xl mx-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 px-6 py-4 rounded-t-2xl shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white shadow-button">
              <Bot className="size-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                JobMate AI Career Copilot
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              </h1>
              <p className="text-xs text-slate-500">
                Evidence-Grounded Resume Coach & Mock Interview Simulator
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearHistory}
              className="gap-1.5 text-xs text-slate-600 dark:text-slate-400"
            >
              <RefreshCw className="size-3.5" />
              Clear Chat
            </Button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/40 space-y-6">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex gap-3 max-w-3xl",
                m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-xl text-xs font-bold shadow-sm",
                  m.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400"
                )}
              >
                {m.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
              </div>

              {/* Bubble Content */}
              <div
                className={cn(
                  "rounded-2xl p-4 text-xs leading-relaxed space-y-2 shadow-sm",
                  m.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                )}
              >
                <div className="whitespace-pre-wrap font-sans text-xs">{m.content}</div>

                <div
                  className={cn(
                    "flex items-center justify-between pt-1 border-t text-[10px]",
                    m.role === "user"
                      ? "border-indigo-500/40 text-indigo-200"
                      : "border-slate-100 dark:border-slate-800 text-slate-400"
                  )}
                >
                  <span>{m.timestamp}</span>
                  {m.role === "assistant" && (
                    <button
                      onClick={() => handleCopy(m.content, m.id)}
                      className="inline-flex items-center gap-1 text-[10px] hover:text-indigo-600 transition-colors"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check className="size-3 text-emerald-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3 mr-auto">
              <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600">
                <Bot className="size-4" />
              </div>
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="size-4 animate-spin text-indigo-600" />
                Synthesizing career advice...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Preset Prompts Bar */}
        <div className="bg-white dark:bg-slate-900 px-6 py-2.5 border-t border-slate-200/60 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0">Suggestions:</span>
          {PRESET_PROMPTS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSendMessage(item.prompt)}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:border-indigo-300 hover:text-indigo-600 transition-all shrink-0"
              >
                <Icon className="size-3 text-indigo-500" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Input Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-b-2xl border-t border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              placeholder="Ask anything about resumes, ATS algorithms, interview questions, or cold outreach..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-button px-5 text-xs py-3"
            >
              <Send className="size-3.5" />
              Send
            </Button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
