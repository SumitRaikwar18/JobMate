/**
 * JobMate AI Rate Limiter & Supabase Credits Engine
 * 
 * Synchronizes real credit consumption directly with Supabase `profiles` table
 * and handles automatic daily midnight rollover based on real dates.
 */

import { supabase } from "@/lib/supabase";

interface RateLimitRecord {
  count: number;
  dateStr: string; // YYYY-MM-DD
}

const memoryStore = new Map<string, RateLimitRecord>();

export const TIER_LIMITS = {
  free: {
    dailyRequests: 25,
    maxTokensPerRequest: 4000,
  },
  pro: {
    dailyRequests: 250,
    maxTokensPerRequest: 16000,
  },
} as const;

export interface RateLimitCheckResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
  tier: "free" | "pro";
  reason?: string;
}

function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

function getNextMidnight(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

/**
 * Event-based Realtime Credit Updates for UI
 */
const CREDIT_UPDATE_EVENT = "jobmate_credit_update";

export function dispatchCreditUpdate(remaining: number, limit: number) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(CREDIT_UPDATE_EVENT, {
        detail: { remaining, limit, timestamp: Date.now() },
      })
    );
  }
}

export function subscribeCreditUpdates(
  callback: (data: { remaining: number; limit: number }) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  const handler = (event: Event) => {
    const custom = event as CustomEvent;
    if (custom.detail) {
      callback(custom.detail);
    }
  };

  window.addEventListener(CREDIT_UPDATE_EVENT, handler);
  return () => window.removeEventListener(CREDIT_UPDATE_EVENT, handler);
}

/**
 * Checks and increments the daily AI quota for a user.
 * Connects with Supabase `consume_ai_credits` RPC when available.
 */
export async function consumeAiCreditRealtime(
  userId?: string | null,
  tier: "free" | "pro" = "free",
  cost = 1
): Promise<RateLimitCheckResult> {
  const limit = TIER_LIMITS[tier].dailyRequests;
  const resetAt = getNextMidnight();

  // If valid Supabase User ID, perform atomic database transaction
  if (userId && userId.length > 10 && !userId.startsWith("local-") && !userId.startsWith("anonymous")) {
    try {
      const { data, error } = await supabase.rpc("consume_ai_credits", {
        target_user_id: userId,
        credit_cost: cost,
      });

      if (!error && data) {
        const remaining = typeof data.remaining === "number" ? data.remaining : limit;
        const allowed = Boolean(data.allowed);
        dispatchCreditUpdate(remaining, data.limit || limit);

        return {
          allowed,
          limit: data.limit || limit,
          remaining,
          resetAt,
          tier: (data.plan_tier as any) || tier,
          reason: data.reason,
        };
      }
    } catch (err) {
      console.warn("[RateLimiter] Supabase RPC fallback to memory:", err);
    }
  }

  // Local / Anonymous in-memory check
  const todayStr = getTodayDateString();
  const identifier = userId || "anonymous-client";
  const record = memoryStore.get(identifier);

  if (!record || record.dateStr !== todayStr) {
    // New Day! Reset count to cost
    memoryStore.set(identifier, {
      count: cost,
      dateStr: todayStr,
    });

    const remaining = Math.max(0, limit - cost);
    dispatchCreditUpdate(remaining, limit);

    return {
      allowed: true,
      limit,
      remaining,
      resetAt,
      tier,
    };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt,
      tier,
      reason: `Daily limit of ${limit} requests reached. Your quota automatically refreshes tomorrow at midnight.`,
    };
  }

  record.count += cost;
  memoryStore.set(identifier, record);

  const remaining = Math.max(0, limit - record.count);
  dispatchCreditUpdate(remaining, limit);

  return {
    allowed: true,
    limit,
    remaining,
    resetAt,
    tier,
  };
}

/**
 * Sync check quota (for server functions and sync fallbacks)
 */
export function checkAndConsumeAiQuota(
  identifier: string,
  tier: "free" | "pro" = "free",
  cost = 1
): RateLimitCheckResult {
  const limit = TIER_LIMITS[tier].dailyRequests;
  const todayStr = getTodayDateString();
  const resetAt = getNextMidnight();

  const record = memoryStore.get(identifier);

  if (!record || record.dateStr !== todayStr) {
    memoryStore.set(identifier, {
      count: cost,
      dateStr: todayStr,
    });

    const remaining = Math.max(0, limit - cost);
    dispatchCreditUpdate(remaining, limit);

    return {
      allowed: true,
      limit,
      remaining,
      resetAt,
      tier,
    };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt,
      tier,
      reason: `Daily AI quota of ${limit} requests reached for ${tier} tier. Quota refreshes tomorrow at midnight.`,
    };
  }

  record.count += cost;
  memoryStore.set(identifier, record);

  const remaining = Math.max(0, limit - record.count);
  dispatchCreditUpdate(remaining, limit);

  return {
    allowed: true,
    limit,
    remaining,
    resetAt,
    tier,
  };
}

/**
 * Get current quota usage without consuming a token.
 */
export function getAiQuotaStatus(
  identifier: string,
  tier: "free" | "pro" = "free"
): { limit: number; remaining: number; resetAt: Date } {
  const limit = TIER_LIMITS[tier].dailyRequests;
  const todayStr = getTodayDateString();
  const resetAt = getNextMidnight();
  const record = memoryStore.get(identifier);

  if (!record || record.dateStr !== todayStr) {
    return {
      limit,
      remaining: limit,
      resetAt,
    };
  }

  return {
    limit,
    remaining: Math.max(0, limit - record.count),
    resetAt,
  };
}
