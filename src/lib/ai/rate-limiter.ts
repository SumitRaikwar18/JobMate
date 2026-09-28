/**
 * JobMate AI Rate Limiter & Token Protection Engine
 * 
 * Enforces daily usage quotas on all AI operations to protect
 * OpenRouter API limits and prevent automated spam or cost spikes.
 */

interface RateLimitRecord {
  count: number;
  resetTime: number; // Unix timestamp in ms
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

/**
 * Checks and increments the daily AI quota for a user or client identifier.
 * Automatically resets quota when the 24-hour window rolls over.
 */
export function checkAndConsumeAiQuota(
  identifier: string,
  tier: "free" | "pro" = "free"
): RateLimitCheckResult {
  const now = Date.now();
  const limit = TIER_LIMITS[tier].dailyRequests;
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  const record = memoryStore.get(identifier);

  if (!record || now >= record.resetTime) {
    // New window or expired window
    const newResetTime = now + ONE_DAY_MS;
    memoryStore.set(identifier, {
      count: 1,
      resetTime: newResetTime,
    });

    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetAt: new Date(newResetTime),
      tier,
    };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt: new Date(record.resetTime),
      tier,
      reason: `Daily AI quota of ${limit} requests reached for ${tier} tier. Window resets at ${new Date(record.resetTime).toLocaleTimeString()}.`,
    };
  }

  record.count += 1;
  memoryStore.set(identifier, record);

  return {
    allowed: true,
    limit,
    remaining: limit - record.count,
    resetAt: new Date(record.resetTime),
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
  const now = Date.now();
  const limit = TIER_LIMITS[tier].dailyRequests;
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const record = memoryStore.get(identifier);

  if (!record || now >= record.resetTime) {
    return {
      limit,
      remaining: limit,
      resetAt: new Date(now + ONE_DAY_MS),
    };
  }

  return {
    limit,
    remaining: Math.max(0, limit - record.count),
    resetAt: new Date(record.resetTime),
  };
}
