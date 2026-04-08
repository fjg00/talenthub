import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { jobs } from "./jobs";
import { profiles } from "./profiles";

export const interviewStatusEnum = pgEnum("interview_status", [
  "pending",
  "in_progress",
  "completed",
  "evaluated",
]);

export const interviews = pgTable("interviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id")
    .notNull()
    .references(() => jobs.id, { onDelete: "cascade" }),
  candidateId: uuid("candidate_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  questions: jsonb("questions")
    .$type<{ text: string; category: string }[]>()
    .notNull(),
  status: interviewStatusEnum("status").notNull().default("pending"),
  overallScore: integer("overall_score"),
  overallFeedback: text("overall_feedback"),
  overallImprovements: jsonb("overall_improvements").$type<string[]>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const interviewResponses = pgTable("interview_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  interviewId: uuid("interview_id")
    .notNull()
    .references(() => interviews.id, { onDelete: "cascade" }),
  questionIndex: integer("question_index").notNull(),
  videoUrl: text("video_url"),
  transcript: text("transcript"),
  durationSeconds: integer("duration_seconds"),
  aiScore: integer("ai_score"),
  aiFeedback: text("ai_feedback"),
  aiImprovements: jsonb("ai_improvements").$type<string[]>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
