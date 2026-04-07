import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";
import { jobs } from "./jobs";
import { profiles } from "./profiles";

export const applicationStatusEnum = pgEnum("application_status", [
  "applied",
  "reviewed",
  "shortlisted",
  "interview",
  "offered",
  "rejected",
  "hired",
]);

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    coverLetter: text("cover_letter"),
    cvUrl: text("cv_url"),
    status: applicationStatusEnum("status").notNull().default("applied"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique().on(table.jobId, table.candidateId)]
);
