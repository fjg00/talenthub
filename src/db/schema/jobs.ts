import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles";

export const jobTypeEnum = pgEnum("job_type", [
  "full_time",
  "part_time",
  "contract",
  "remote",
]);

export const experienceLevelEnum = pgEnum("experience_level", [
  "entry",
  "mid",
  "senior",
  "lead",
]);

export const jobStatusEnum = pgEnum("job_status", [
  "draft",
  "published",
  "closed",
]);

export const currencyEnum = pgEnum("currency", [
  "USD",
  "SAR",
  "AED",
  "QAR",
  "KWD",
  "BHD",
  "OMR",
  "EGP",
]);

export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  employerId: uuid("employer_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location"),
  jobType: jobTypeEnum("job_type"),
  experienceLevel: experienceLevelEnum("experience_level"),
  skills: jsonb("skills").$type<string[]>().default([]),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  currency: currencyEnum("currency").default("USD"),
  deadline: timestamp("deadline", { withTimezone: true }),
  status: jobStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
