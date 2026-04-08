import { db } from "@/db";
import { interviews, interviewResponses } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function getInterviewById(interviewId: string) {
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
