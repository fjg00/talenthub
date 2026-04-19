import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { applications } from "./applications";
import { profiles } from "./profiles";

export const interviewScheduleTypeEnum = pgEnum("interview_schedule_type", [
  "video",
  "phone",
  "onsite",
]);

export const interviewScheduleStatusEnum = pgEnum(
  "interview_schedule_status",
  ["scheduled", "completed", "cancelled", "rescheduled"]
);

/**
 * Live interviews scheduled by an employer with a candidate. Distinct from
 * the `interviews` table which stores async AI video interviews.
 */
export const interviewSchedules = pgTable(
  "interview_schedules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    employerId: uuid("employer_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    durationMinutes: integer("duration_minutes").notNull().default(30),
    type: interviewScheduleTypeEnum("type").notNull().default("video"),
    location: text("location"), // physical address for onsite
    meetingUrl: text("meeting_url"), // zoom/meet link for video
    notes: text("notes"),
    status: interviewScheduleStatusEnum("status")
      .notNull()
      .default("scheduled"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("interview_schedules_application_idx").on(t.applicationId),
    index("interview_schedules_employer_idx").on(t.employerId),
    index("interview_schedules_candidate_idx").on(t.candidateId),
    index("interview_schedules_scheduled_at_idx").on(t.scheduledAt),
  ]
);
