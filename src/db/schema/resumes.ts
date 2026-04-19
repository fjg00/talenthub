import { pgTable, uuid, jsonb, timestamp } from "drizzle-orm/pg-core";
import { profiles } from "./profiles";

export type ExperienceEntry = {
  id: string;
  title: string;
  company: string;
  location: string;
  start: string; // YYYY-MM
  end: string; // YYYY-MM or "" for present
  description: string;
};

export type EducationEntry = {
  id: string;
  school: string;
  degree: string;
  field: string;
  start: string;
  end: string;
};

export type LanguageEntry = { id: string; name: string; proficiency: string };
export type CertificationEntry = {
  id: string;
  name: string;
  issuer: string;
  year: string;
};
export type LinkEntry = { id: string; label: string; url: string };

export type ResumeData = {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: string[];
  languages: LanguageEntry[];
  certifications: CertificationEntry[];
  links: LinkEntry[];
};

export const EMPTY_RESUME: ResumeData = {
  fullName: "",
  headline: "",
  email: "",
  phone: "",
  location: "",
  summary: "",
  experience: [],
  education: [],
  skills: [],
  languages: [],
  certifications: [],
  links: [],
};

/**
 * One resume blob per candidate. JSONB keeps the schema flexible and the
 * whole document is saved atomically on each edit.
 */
export const resumes = pgTable("resumes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => profiles.id, { onDelete: "cascade" }),
  data: jsonb("data").$type<ResumeData>().notNull().default(EMPTY_RESUME),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
