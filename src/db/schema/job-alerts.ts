import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  boolean,
  jsonb,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles";
import { jobTypeEnum, experienceLevelEnum, currencyEnum } from "./jobs";

export const alertFrequencyEnum = pgEnum("alert_frequency", [
  "daily",
  "weekly",
]);

/**
 * A candidate's saved search that emails them a digest of matching new jobs
 * on the chosen cadence (daily or weekly).
 */
export const jobAlerts = pgTable(
  "job_alerts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    keyword: text("keyword"),
    location: text("location"),
    jobType: jobTypeEnum("job_type"),
    experienceLevel: experienceLevelEnum("experience_level"),
    skills: jsonb("skills").$type<string[]>().default([]),
    salaryMin: integer("salary_min"),
    currency: currencyEnum("currency"),
    frequency: alertFrequencyEnum("frequency").notNull().default("daily"),
    enabled: boolean("enabled").notNull().default(true),
    lastSentAt: timestamp("last_sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("job_alerts_candidate_idx").on(t.candidateId)]
);
