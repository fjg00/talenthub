import { db } from "@/db";
import { rateLimitBuckets } from "@/db/schema";
import { sql } from "drizzle-orm";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
};

export type RateLimitPreset = {
  /** Max allowed requests per window. */
  limit: number;
  /** Window duration in seconds. */
  windowSec: number;
};

/**
 * Pre-defined policies. Keep conservative defaults; tighten if abuse shows up.
 */
export const RATE_LIMITS = {
  // Auth — prevent brute force
  login: { limit: 8, windowSec: 300 }, // 8 per 5min per email+ip
  signup: { limit: 5, windowSec: 3600 }, // 5 per hour per ip
  passwordReset: { limit: 5, windowSec: 3600 },

  // Mutations
  applyToJob: { limit: 30, windowSec: 3600 }, // 30 apps/hour/user
  postJob: { limit: 20, windowSec: 3600 }, // 20 posts/hour/employer

  // AI — expensive
  aiInterviewGenerate: { limit: 10, windowSec: 3600 },
  aiEvaluate: { limit: 50, windowSec: 3600 },
  aiMatchScore: { limit: 100, windowSec: 3600 },

  // Data export
  exportData: { limit: 20, windowSec: 3600 },

  // Public contact / message forms
  contactForm: { limit: 3, windowSec: 3600 },
} as const satisfies Record<string, RateLimitPreset>;

export type RateLimitAction = keyof typeof RATE_LIMITS;

/**
 * Atomically increments the bucket for `${action}:${subject}`. Returns whether
 * the call is permitted. When the current bucket has expired, it is reset.
 *
 * Uses a single UPSERT so concurrent callers can't both slip past the limit.
 */
export async function checkRateLimit(
  action: RateLimitAction | RateLimitPreset,
  subject: string
): Promise<RateLimitResult> {
  const preset =
    typeof action === "string" ? RATE_LIMITS[action] : action;
  const key =
    typeof action === "string"
      ? `${action}:${subject}`
      : `custom:${subject}`;

  // Upsert: reset if the existing row has expired, otherwise increment.
  const rows = await db.execute<{ count: number; expires_at: Date }>(sql`
    INSERT INTO rate_limit_buckets (bucket_key, count, expires_at)
    VALUES (${key}, 1, now() + (${preset.windowSec}::int * interval '1 second'))
    ON CONFLICT (bucket_key) DO UPDATE SET
      count = CASE
        WHEN rate_limit_buckets.expires_at < now() THEN 1
        ELSE rate_limit_buckets.count + 1
      END,
      expires_at = CASE
        WHEN rate_limit_buckets.expires_at < now()
          THEN now() + (${preset.windowSec}::int * interval '1 second')
        ELSE rate_limit_buckets.expires_at
      END
    RETURNING count, expires_at
  `);

  const row = rows[0];
  if (!row) {
    // Fail-open on unexpected driver result
    return {
      allowed: true,
      remaining: preset.limit,
      resetInSeconds: preset.windowSec,
    };
  }

  const count = Number(row.count);
  const expiresAt = new Date(row.expires_at);
  const resetInSeconds = Math.max(
    0,
    Math.ceil((expiresAt.getTime() - Date.now()) / 1000)
  );

  return {
    allowed: count <= preset.limit,
    remaining: Math.max(0, preset.limit - count),
    resetInSeconds,
  };
}

/**
 * Reads the client IP from standard forwarding headers. Falls back to "unknown".
 */
export function getClientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

/**
 * Standard 429 JSON response with Retry-After.
 */
export function rateLimitResponse(r: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: "Too many requests",
      retryAfter: r.resetInSeconds,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(r.resetInSeconds),
      },
    }
  );
}

/**
 * Best-effort cleanup of expired buckets. Call from a cron endpoint.
 */
export async function purgeExpiredRateLimitBuckets() {
  await db.execute(sql`
    DELETE FROM rate_limit_buckets WHERE expires_at < now() - interval '1 hour'
  `);
}
