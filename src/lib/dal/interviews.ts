import { db } from "@/db";
import { interviews, interviewResponses, jobs } from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { isUuid } from "@/lib/utils/uuid";

export async function getInterviewById(interviewId: string) {
  if (!isUuid(interviewId)) return null;
  return (
    (await db.query.interviews.findFirst({
      where: eq(interviews.id, interviewId),
      with: {
        job: true,
        candidate: { with: { candidateProfile: true } },
        responses: true,
      },
    })) ?? null
  );
}

export async function getInterviewsByJob(jobId: string) {
  return db.query.interviews.findMany({
    where: eq(interviews.jobId, jobId),
    orderBy: desc(interviews.createdAt),
    with: {
      candidate: { with: { candidateProfile: true } },
      responses: true,
    },
  });
}

export async function getInterviewsByCandidate(candidateId: string) {
  return db.query.interviews.findMany({
    where: eq(interviews.candidateId, candidateId),
    orderBy: desc(interviews.createdAt),
    with: {
      job: { with: { employer: { with: { employerProfile: true } } } },
      responses: true,
    },
  });
}

export async function getInterviewForJobCandidate(
  jobId: string,
  candidateId: string
) {
  return (
    (await db.query.interviews.findFirst({
      where: and(
        eq(interviews.jobId, jobId),
        eq(interviews.candidateId, candidateId)
      ),
      with: { responses: true },
    })) ?? null
  );
}

export async function getInterviewResponses(interviewId: string) {
  return db.query.interviewResponses.findMany({
    where: eq(interviewResponses.interviewId, interviewId),
  });
}

export async function getInterviewsByEmployer(employerId: string) {
  // Get all jobs for this employer, then all interviews for those jobs
  const employerJobs = await db.query.jobs.findMany({
    where: eq(jobs.employerId, employerId),
    columns: { id: true },
  });
  const jobIds = employerJobs.map((j) => j.id);
  if (jobIds.length === 0) return [];

  return db.query.interviews.findMany({
    where: inArray(interviews.jobId, jobIds),
    orderBy: desc(interviews.createdAt),
    with: {
      job: true,
      candidate: { with: { candidateProfile: true } },
      responses: true,
    },
  });
}
