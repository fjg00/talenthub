import { db } from "@/db";
import { interviewSchedules } from "@/db/schema";
import { and, asc, eq, gte } from "drizzle-orm";

export async function getScheduleById(id: string) {
  return (
    (await db.query.interviewSchedules.findFirst({
      where: eq(interviewSchedules.id, id),
      with: {
        application: { with: { job: true } },
        employer: { with: { employerProfile: true } },
        candidate: { with: { candidateProfile: true } },
      },
    })) ?? null
  );
}

/** Employer's scheduled interviews, upcoming first. */
export async function getSchedulesByEmployer(
  employerId: string,
  opts?: { upcomingOnly?: boolean }
) {
  const conds = [eq(interviewSchedules.employerId, employerId)];
  if (opts?.upcomingOnly) {
    conds.push(gte(interviewSchedules.scheduledAt, new Date()));
  }
  return db.query.interviewSchedules.findMany({
    where: and(...conds),
    orderBy: asc(interviewSchedules.scheduledAt),
    with: {
      application: { with: { job: true } },
      candidate: { with: { candidateProfile: true } },
    },
  });
}

/** Candidate's scheduled interviews, upcoming first. */
export async function getSchedulesByCandidate(
  candidateId: string,
  opts?: { upcomingOnly?: boolean }
) {
  const conds = [eq(interviewSchedules.candidateId, candidateId)];
  if (opts?.upcomingOnly) {
    conds.push(gte(interviewSchedules.scheduledAt, new Date()));
  }
  return db.query.interviewSchedules.findMany({
    where: and(...conds),
    orderBy: asc(interviewSchedules.scheduledAt),
    with: {
      application: { with: { job: true } },
      employer: { with: { employerProfile: true } },
    },
  });
}

export async function getSchedulesForApplication(applicationId: string) {
  return db.query.interviewSchedules.findMany({
    where: eq(interviewSchedules.applicationId, applicationId),
    orderBy: asc(interviewSchedules.scheduledAt),
  });
}
