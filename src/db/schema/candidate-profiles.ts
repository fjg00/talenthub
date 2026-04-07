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

export const availabilityEnum = pgEnum("availability_status", [
  "open",
  "not_looking",
  "open_to_offers",
]);

export const candidateProfiles = pgTable("candidate_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => profiles.id, { onDelete: "cascade" }),
  headline: text("headline"),
  bio: text("bio"),
  skills: jsonb("skills").$type<string[]>().default([]),
  experienceYears: integer("experience_years"),
  education: text("education"),
  location: text("location"),
  cvUrl: text("cv_url"),
  linkedinUrl: text("linkedin_url"),
  phone: text("phone"),
  availabilityStatus: availabilityEnum("availability_status").default("open"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
