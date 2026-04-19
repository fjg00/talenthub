import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles";

/**
 * Private notes written by an employer about a candidate.
 * Visible ONLY to the employer who wrote them.
 * A single employer can have multiple notes per candidate (a log).
 */
export const candidateNotes = pgTable(
  "candidate_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employerId: uuid("employer_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("candidate_notes_employer_candidate_idx").on(
      t.employerId,
      t.candidateId
    ),
  ]
);
