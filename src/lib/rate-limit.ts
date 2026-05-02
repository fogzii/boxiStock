/**
 * Global rate limiter backed by Upstash Redis (via @upstash/ratelimit).
 *
 * Why Upstash:
 *   - Shared across all Vercel serverless instances (unlike an in-process Map),
 *     so limits are enforced globally per user, not per lambda.
 *   - Sliding window algorithm gives smoother throttling than fixed windows.
 *
 * Required env vars (set in .env.local and in Vercel Project Settings):
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 *
 * If either var is missing we fail open (allow the request) rather than
 * bricking the app, but we log loudly so it's obvious in dev/prod logs.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetAt: number;
};

export type LimiterConfig = { limit: number; windowMs: number };

/**
 * Named tiers so callers don't sprinkle magic numbers everywhere. Tune here
 * and every call site gets the new value on next deploy.
 *
 *   mutation    – normal write endpoints (addProduct, sellLotUnits, etc.)
 *   bulk        – bulk imports / seed; expensive, so tighter.
 *   export      – CSV exports; cheap to run but heavy in Supabase egress.
 *   destructive – wipes / deletes-all-user-data; very tight ceiling.
 *   ai          – Gemini calls; gated separately in src/actions/ai.ts.
 */
export const RATE_LIMITS = {
  mutation: { limit: 60, windowMs: 60 * 1000 },
  bulk: { limit: 10, windowMs: 5 * 60 * 1000 },
  export: { limit: 20, windowMs: 5 * 60 * 1000 },
  destructive: { limit: 5, windowMs: 60 * 60 * 1000 },
  ai: { limit: 20, windowMs: 5 * 60 * 1000 },
  contact: { limit: 5, windowMs: 60 * 60 * 1000 },
  sharePassword: { limit: 10, windowMs: 15 * 60 * 1000 },
} as const satisfies Record<string, LimiterConfig>;

const redis = createRedis();
const limiters = new Map<string, Ratelimit>();

function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.warn(
      "[rate-limit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set. " +
        "Rate limiting is DISABLED (failing open).",
    );
    return null;
  }
  return new Redis({ url, token });
}

function getLimiter(config: LimiterConfig): Ratelimit | null {
  if (!redis) return null;
  const cacheKey = `${config.limit}:${config.windowMs}`;
  let limiter = limiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      // Sliding window: up to `limit` requests in any rolling windowMs span.
      limiter: Ratelimit.slidingWindow(config.limit, `${config.windowMs} ms`),
      analytics: true,
      prefix: "boxistock/ratelimit",
    });
    limiters.set(cacheKey, limiter);
  }
  return limiter;
}

export async function rateLimit(
  key: string,
  config: LimiterConfig,
): Promise<RateLimitResult> {
  const limiter = getLimiter(config);

  // Fail open if Upstash isn't configured (dev convenience; warning already
  // logged at module load).
  if (!limiter) {
    return {
      success: true,
      remaining: config.limit,
      resetAt: Date.now() + config.windowMs,
    };
  }

  const { success, remaining, reset } = await limiter.limit(key);
  return { success, remaining, resetAt: reset };
}

/**
 * Throw a user-visible error if `key` is over its limit. Use this at the top
 * of server actions right after `auth()` so the userId is already known.
 *
 *   await enforceRateLimit(`stock:mutation:${userId}`, RATE_LIMITS.mutation);
 */
export async function enforceRateLimit(
  key: string,
  config: LimiterConfig,
  label = "request",
): Promise<void> {
  const result = await rateLimit(key, config);
  if (result.success) return;
  const waitSeconds = Math.max(
    1,
    Math.ceil((result.resetAt - Date.now()) / 1000),
  );
  throw new Error(
    `Too many ${label}s. Please wait ${waitSeconds}s before trying again.`,
  );
}
