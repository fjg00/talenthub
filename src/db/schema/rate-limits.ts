import { pgTable, text, integer, timestamp, index } from "drizzle-orm/pg-core";

/**
 * Fixed-window rate-limit buckets. A bucket is keyed by `${action}:${subject}`
 * where subject is a user id, IP, or email. The bucket resets when now > expiresAt.
 */
export const rateLimitBuckets = pgTable(
  "rate_limit_buckets",
  {
    bucketKey: text("bucket_key").primaryKey(),
    count: integer("count").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("rate_limit_buckets_expires_idx").on(t.expiresAt)]
);
