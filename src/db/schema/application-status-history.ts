import { pgTable, uuid, timestamp, text, index } from "drizzle-orm/pg-core";
import { applications, applicationStatusEnum } from "./applications";
import { profiles } from "./profiles";

/**
 * Append-only log of application status changes, for the candidate-facing
 * timeline. Each row records a transition into `status` at `createdAt`.
 * `changedBy` is the actor (employer user id) when applicable.
 */
export const applicationStatusHistory = pgTable(
  "application_status_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    status: applicationStatusEnum("status").notNull(),
    note: text("note"),
    changedBy: uuid("changed_by").references(() => profiles.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("application_status_history_application_idx").on(t.applicationId),
  ]
);
