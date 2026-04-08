import { relations } from "drizzle-orm";
import { profiles } from "./profiles";
import { candidateProfiles } from "./candidate-profiles";
import { employerProfiles } from "./employer-profiles";
import { jobs } from "./jobs";
import { applications } from "./applications";
import { interviews, interviewResponses } from "./interviews";

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  candidateProfile: one(candidateProfiles, {
    fields: [profiles.id],
    references: [candidateProfiles.userId],
  }),
  employerProfile: one(employerProfiles, {
    fields: [profiles.id],
    references: [employerProfiles.userId],
  }),
  jobs: many(jobs),
  applications: many(applications),
  interviews: many(interviews),
}));

export const candidateProfilesRelations = relations(
  candidateProfiles,
  ({ one }) => ({
    profile: one(profiles, {
      fields: [candidateProfiles.userId],
      references: [profiles.id],
    }),
  })
);

export const employerProfilesRelations = relations(
  employerProfiles,
  ({ one }) => ({
    profile: one(profiles, {
      fields: [employerProfiles.userId],
      references: [profiles.id],
    }),
  })
);

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  employer: one(profiles, {
    fields: [jobs.employerId],
    references: [profiles.id],
  }),
  applications: many(applications),
  interviews: many(interviews),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  job: one(jobs, {
    fields: [applications.jobId],
    references: [jobs.id],
  }),
  candidate: one(profiles, {
    fields: [applications.candidateId],
    references: [profiles.id],
  }),
}));

export const interviewsRelations = relations(interviews, ({ one, many }) => ({
  job: one(jobs, {
    fields: [interviews.jobId],
    references: [jobs.id],
  }),
  candidate: one(profiles, {
    fields: [interviews.candidateId],
    references: [profiles.id],
  }),
  responses: many(interviewResponses),
}));

export const interviewResponsesRelations = relations(
  interviewResponses,
  ({ one }) => ({
    interview: one(interviews, {
      fields: [interviewResponses.interviewId],
      references: [interviews.id],
    }),
  })
);
