import { relations } from "drizzle-orm";
import { profiles } from "./profiles";
import { candidateProfiles } from "./candidate-profiles";
import { employerProfiles } from "./employer-profiles";
import { jobs } from "./jobs";
import { applications } from "./applications";
import { interviews, interviewResponses } from "./interviews";
import { aiCache } from "./ai-cache";
import { notifications } from "./notifications";
import { savedJobs } from "./saved-jobs";
import { candidateNotes } from "./candidate-notes";
import { jobTemplates } from "./job-templates";
import { applicationStatusHistory } from "./application-status-history";
import { interviewSchedules } from "./interview-schedules";

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
  notifications: many(notifications),
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

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  job: one(jobs, {
    fields: [applications.jobId],
    references: [jobs.id],
  }),
  candidate: one(profiles, {
    fields: [applications.candidateId],
    references: [profiles.id],
  }),
  statusHistory: many(applicationStatusHistory),
}));

export const applicationStatusHistoryRelations = relations(
  applicationStatusHistory,
  ({ one }) => ({
    application: one(applications, {
      fields: [applicationStatusHistory.applicationId],
      references: [applications.id],
    }),
    changedByProfile: one(profiles, {
      fields: [applicationStatusHistory.changedBy],
      references: [profiles.id],
    }),
  })
);

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

// ai_cache has no relations — standalone table
export const aiCacheRelations = relations(aiCache, () => ({}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(profiles, {
    fields: [notifications.userId],
    references: [profiles.id],
  }),
}));

export const savedJobsRelations = relations(savedJobs, ({ one }) => ({
  candidate: one(profiles, {
    fields: [savedJobs.candidateId],
    references: [profiles.id],
  }),
  job: one(jobs, {
    fields: [savedJobs.jobId],
    references: [jobs.id],
  }),
}));

export const candidateNotesRelations = relations(candidateNotes, ({ one }) => ({
  employer: one(profiles, {
    fields: [candidateNotes.employerId],
    references: [profiles.id],
    relationName: "noteEmployer",
  }),
  candidate: one(profiles, {
    fields: [candidateNotes.candidateId],
    references: [profiles.id],
    relationName: "noteCandidate",
  }),
}));

export const jobTemplatesRelations = relations(jobTemplates, ({ one }) => ({
  employer: one(profiles, {
    fields: [jobTemplates.employerId],
    references: [profiles.id],
  }),
}));

export const interviewSchedulesRelations = relations(
  interviewSchedules,
  ({ one }) => ({
    application: one(applications, {
      fields: [interviewSchedules.applicationId],
      references: [applications.id],
    }),
    employer: one(profiles, {
      fields: [interviewSchedules.employerId],
      references: [profiles.id],
      relationName: "scheduleEmployer",
    }),
    candidate: one(profiles, {
      fields: [interviewSchedules.candidateId],
      references: [profiles.id],
      relationName: "scheduleCandidate",
    }),
  })
);
