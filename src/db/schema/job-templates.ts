import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles";
import {
  jobTypeEnum,
  experienceLevelEnum,
  currencyEnum,
} from "./jobs";

/**
 * Reusable job-posting templates owned by an employer.
 * Mirrors the editable fields of the `jobs` table (excluding id/employer/views/status/timestamps).
 */
export const jobTemplates = pgTable(
  "job_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employerId: uuid("employer_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    location: text("location"),
    jobType: jobTypeEnum("job_type"),
    experienceLevel: experienceLevelEnum("experience_level"),
    skills: jsonb("skills").$type<string[]>().default([]),
    salaryMin: integer("salary_min"),
    salaryMax: integer("salary_max"),
    currency: currencyEnum("currency").default("USD"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("job_templates_employer_idx").on(t.employerId)]
);
