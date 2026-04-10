import { pgTable, uuid, text, jsonb, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const aiCacheTypeEnum = pgEnum("ai_cache_type", [
  "match_score",
  "candidate_summary",
  "job_optimization",
]);

export const aiCache = pgTable("ai_cache", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: aiCacheTypeEnum("type").notNull(),
  entityId: text("entity_id").notNull(),
  result: jsonb("result").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
