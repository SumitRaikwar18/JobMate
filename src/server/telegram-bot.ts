/**
 * JobMate AI — Autonomous Telegram Bot Service
 * Production Ready for Render Deployment (Web Service or Background Worker)
 * 
 * Features:
 * - Direct Supabase & OpenRouter AI Integration
 * - Inline Keyboard Menus & Rich Markdown Formatting
 * - Webhook/Polling Engine with HTTP Healthcheck Server for Render (PORT 8080/3000)
 * - /start, /link, /audit, /tailor, /skills, /stats, /help
 */

import http from "node:http";
import { createClient } from "@supabase/supabase-js";
import { checkAndConsumeAiQuota, getAiQuotaStatus } from "../lib/ai/rate-limiter";

// Configuration from Environment Variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const PORT = process.env.PORT || 8080;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
      first_name?: string;
      username?: string;
    };
    text?: string;
  };
  callback_query?: {
    id: string;
    from: { id: number; username?: string };
    message?: { chat: { id: number }; message_id: number };
    data: string;
  };
}

/**
 * Sends a message via Telegram Bot API
 */
async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  replyMarkup?: any
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn("[Telegram Bot] Cannot send message: TELEGRAM_BOT_TOKEN is missing.");
    return false;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        reply_markup: replyMarkup,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[Telegram Bot Send Error]:", err);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Telegram Bot Network Error]:", err);
    return false;
  }
}

/**
 * Direct OpenRouter AI Call with Model Fallbacks
 */
async function queryAi(prompt: string, systemPrompt?: string): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    return "⚠️ AI service is currently unavailable. Please configure OPENROUTER_API_KEY on Render.";
  }

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://jobmate-ebon.vercel.app",
        "X-Title": "JobMate Telegram Bot",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              systemPrompt ||
              "You are JobMate AI, an expert technical career advisor and ATS resume engineer. Provide concise, high-impact responses formatted cleanly for Telegram.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      return "⚠️ AI request failed. Please try again shortly.";
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "No response received.";
  } catch (err: any) {
    return `⚠️ Error calling AI: ${err.message}`;
  }
}

/**
 * Handle incoming Telegram message
 */
async function handleTelegramMessage(msg: NonNullable<TelegramUpdate["message"]>) {
  const chatId = msg.chat.id;
  const rawText = (msg.text || "").trim();
  const firstName = msg.from.first_name || "Candidate";
  const username = msg.from.username || "";

  console.log(`[Telegram Msg from @${username || chatId}]: ${rawText}`);

  // Rate limit check per Telegram user
  const quota = checkAndConsumeAiQuota(`tg_${chatId}`, "free");

  // 1. /start command
  if (rawText.startsWith("/start")) {
    const welcome = `
🚀 <b>Welcome to JobMate AI, ${firstName}!</b>

Your autonomous AI Career Copilot and ATS Resume Engineer.

<b>Quick Commands:</b>
🎯 <code>/audit &lt;resume_text&gt;</code> — Instant ATS Parse Score (0-100%)
📄 <code>/tailor &lt;job_description&gt;</code> — Tailor resume bullet points to any JD
🔗 <code>/link &lt;token&gt;</code> — Link your JobMate Web account
💡 <code>/skills &lt;role&gt;</code> — Get in-demand technical stack skills
📊 <code>/stats</code> — Check your linked profile and daily quota
❓ <code>/help</code> — View all commands and tips

<i>Or simply message me your career question or bullet point to optimize!</i>
`;
    const keyboard = {
      inline_keyboard: [
        [
          { text: "🎯 Audit Resume", callback_data: "cmd_audit" },
          { text: "📄 Tailor for JD", callback_data: "cmd_tailor" },
        ],
        [
          { text: "🔗 Link Web Account", callback_data: "cmd_link" },
          { text: "📊 My Quota & Stats", callback_data: "cmd_stats" },
        ],
        [{ text: "🌐 Open JobMate Web App", url: "https://jobmate-ebon.vercel.app" }],
      ],
    };

    await sendTelegramMessage(chatId, welcome, keyboard);
    return;
  }

  // 2. /help command
  if (rawText.startsWith("/help")) {
    const helpText = `
📖 <b>JobMate AI Telegram Cheatsheet</b>

• <code>/audit &lt;text&gt;</code> — Paste bullet points or summary to audit ATS score, action verbs, and quantifiable metrics.
• <code>/tailor &lt;job description&gt;</code> — Tailors XYZ-formatted bullet points for your target job posting.
• <code>/skills &lt;target role&gt;</code> — e.g. <code>/skills Senior Backend Engineer</code>
• <code>/link &lt;8-char-code&gt;</code> — Link with web settings to sync resumes.
• <code>/stats</code> — View your daily AI quota and account status.
`;
    await sendTelegramMessage(chatId, helpText);
    return;
  }

  // 3. /stats command
  if (rawText.startsWith("/stats")) {
    const quotaStatus = getAiQuotaStatus(`tg_${chatId}`, "free");

    // Check if user is linked in Supabase
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, target_role, email")
      .eq("telegram_chat_id", String(chatId))
      .maybeSingle();

    const statsText = `
📊 <b>Your JobMate Profile & AI Quota</b>

• <b>Linked Web Account:</b> ${profile ? `✅ ${profile.full_name || profile.email}` : "❌ Not linked (use <code>/link &lt;code&gt;</code>)"}
• <b>Target Role:</b> ${profile?.target_role || "Software Engineer"}
• <b>Daily AI Quota:</b> ${quotaStatus.remaining} / ${quotaStatus.limit} requests remaining
• <b>Quota Resets At:</b> ${quotaStatus.resetAt.toLocaleTimeString()}
`;
    await sendTelegramMessage(chatId, statsText);
    return;
  }

  // 4. /link <code> command
  if (rawText.startsWith("/link")) {
    const parts = rawText.split(" ");
    const token = parts[1]?.trim();

    if (!token) {
      await sendTelegramMessage(
        chatId,
        "⚠️ Please provide your pairing code.\nExample: <code>/link a1b2c3d4</code>\n\nYou can find your code in JobMate Web -> Settings."
      );
      return;
    }

    try {
      // Find matching profile by prefix of user ID or telegram_handle
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .limit(10);

      const matched = profiles?.find((p) => p.id.toLowerCase().startsWith(token.toLowerCase()));

      if (matched) {
        await supabase
          .from("profiles")
          .update({
            telegram_chat_id: String(chatId),
            telegram_username: username || null,
            telegram_handle: username || null,
          })
          .eq("id", matched.id);

        await sendTelegramMessage(
          chatId,
          `🎉 <b>Successfully linked!</b>\n\nYour Telegram account is now connected to <b>${matched.full_name || matched.email}</b>. You can now build, audit, and tailor resumes on the go.`
        );
      } else {
        await sendTelegramMessage(
          chatId,
          `❌ Pairing code <code>${token}</code> not found. Please verify your code on https://jobmate-ebon.vercel.app/settings.`
        );
      }
    } catch (err: any) {
      await sendTelegramMessage(chatId, `⚠️ Error linking account: ${err.message}`);
    }
    return;
  }

  // Check quota for AI operations
  if (!quota.allowed) {
    await sendTelegramMessage(
      chatId,
      `⚠️ <b>Daily AI Quota Limit Reached</b>\n\n${quota.reason}\nPlease upgrade on the web app or try again tomorrow.`
    );
    return;
  }

  // 5. /audit command
  if (rawText.startsWith("/audit")) {
    const textToAudit = rawText.replace("/audit", "").trim();
    if (!textToAudit) {
      await sendTelegramMessage(
        chatId,
        "🎯 <b>How to use /audit:</b>\n\nType <code>/audit &lt;paste your resume text or bullet points&gt;</code>\n\nExample:\n<code>/audit Built scalable React microservices resulting in 40% latency reduction.</code>"
      );
      return;
    }

    await sendTelegramMessage(chatId, "🔍 <i>Analyzing resume against 2026 ATS parsers and Google XYZ criteria...</i>");

    const prompt = `Perform a rapid ATS Audit on this candidate resume text:
"${textToAudit}"

Return clean HTML output formatted for Telegram:
1. ATS Compliance Score (0-100%)
2. Strong Action Verbs Detected
3. Quantifiable Impact & Metrics Analysis (Google XYZ format)
4. 2-3 Actionable Fixes to improve score`;

    const aiAudit = await queryAi(prompt);
    await sendTelegramMessage(chatId, `🎯 <b>ATS Audit Result:</b>\n\n${aiAudit}`);
    return;
  }

  // 6. /skills command
  if (rawText.startsWith("/skills")) {
    const role = rawText.replace("/skills", "").trim() || "Software Engineer";
    await sendTelegramMessage(chatId, `💡 <i>Fetching in-demand technical stack for <b>${role}</b>...</i>`);

    const prompt = `Provide the top high-demand technical skills taxonomy for the role "${role}" in 2026.
Format as:
• Languages:
• Frameworks & Libraries:
• Cloud & Infrastructure:
• Databases & Tooling:`;

    const aiSkills = await queryAi(prompt);
    await sendTelegramMessage(chatId, `💡 <b>Recommended Skills for ${role}:</b>\n\n${aiSkills}`);
    return;
  }

  // 7. /tailor command
  if (rawText.startsWith("/tailor")) {
    const jdText = rawText.replace("/tailor", "").trim();
    if (!jdText) {
      await sendTelegramMessage(
        chatId,
        "📄 <b>How to use /tailor:</b>\n\nType <code>/tailor &lt;paste job description&gt;</code>\n\nJobMate will generate 3 customized Google XYZ bullet points matching the JD requirements."
      );
      return;
    }

    await sendTelegramMessage(chatId, "⚡ <i>Running Multi-Agent tailoring pipeline against JD requirements...</i>");

    const prompt = `Job Description:
"${jdText}"

Generate 3 high-impact, ATS-optimized resume bullet points tailored to this job posting using Google's XYZ formula:
"Accomplished [X] as measured by [Y], by doing [Z]"`;

    const tailoredBullets = await queryAi(prompt);
    await sendTelegramMessage(
      chatId,
      `📄 <b>Tailored Resume Bullet Points:</b>\n\n${tailoredBullets}\n\n<i>👉 Copy these into your live canvas on <a href="https://jobmate-ebon.vercel.app/builder">JobMate Web</a>!</i>`
    );
    return;
  }

  // 8. Natural Language Career Chat Fallback
  const reply = await queryAi(
    rawText,
    "You are JobMate AI Assistant on Telegram. Help this candidate with their career, resume optimization, or interview prep. Keep responses concise and engaging."
  );
  await sendTelegramMessage(chatId, reply);
}

/**
 * Handle Inline Keyboard Callbacks
 */
async function handleCallbackQuery(cb: NonNullable<TelegramUpdate["callback_query"]>) {
  const chatId = cb.message?.chat.id;
  if (!chatId) return;

  if (cb.data === "cmd_audit") {
    await sendTelegramMessage(chatId, "🎯 Send <code>/audit &lt;paste your resume text&gt;</code> to check your ATS score!");
  } else if (cb.data === "cmd_tailor") {
    await sendTelegramMessage(chatId, "📄 Send <code>/tailor &lt;paste job description&gt;</code> to tailor bullet points!");
  } else if (cb.data === "cmd_link") {
    await sendTelegramMessage(chatId, "🔗 Copy your 8-char code from https://jobmate-ebon.vercel.app/settings and reply with:\n<code>/link &lt;code&gt;</code>");
  } else if (cb.data === "cmd_stats") {
    const quotaStatus = getAiQuotaStatus(`tg_${chatId}`, "free");
    await sendTelegramMessage(
      chatId,
      `📊 <b>Daily Quota:</b> ${quotaStatus.remaining} / ${quotaStatus.limit} AI requests remaining.`
    );
  }
}

/**
 * Long Polling Loop for Telegram Bot
 */
async function startTelegramPolling() {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn("⚠️ [Telegram Bot] TELEGRAM_BOT_TOKEN not provided. Polling disabled.");
    return;
  }

  console.log("🤖 [Telegram Bot] Starting long polling worker...");
  let offset = 0;

  while (true) {
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${offset}&timeout=30`,
        { method: "GET" }
      );

      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result as TelegramUpdate[]) {
            offset = update.update_id + 1;
            if (update.message) {
              await handleTelegramMessage(update.message);
            } else if (update.callback_query) {
              await handleCallbackQuery(update.callback_query);
            }
          }
        }
      } else {
        await new Promise((r) => setTimeout(r, 5000));
      }
    } catch (err) {
      console.error("[Telegram Bot Polling Error]:", err);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

/**
 * Render Liveness & Healthcheck HTTP Server
 * Listens on PORT (8080/3000) for Render Web Service healthchecks
 */
const server = http.createServer((req, res) => {
  if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        service: "JobMate Telegram Bot & AI Quota Engine",
        uptimeSeconds: process.uptime(),
        timestamp: new Date().toISOString(),
        supabaseConfigured: Boolean(SUPABASE_URL && SUPABASE_KEY),
        telegramConfigured: Boolean(TELEGRAM_BOT_TOKEN),
        openRouterConfigured: Boolean(OPENROUTER_API_KEY),
      })
    );
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
});

server.listen(PORT, () => {
  console.log(`🌐 [Healthcheck Server] Listening on port ${PORT} for Render liveness probes.`);
  startTelegramPolling();
});
