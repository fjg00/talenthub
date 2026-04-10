import { db } from "@/db";
import { savedJobs } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function getSavedJobs(userId: string) {
  return db.query.savedJobs.findMany({
    where: eq(savedJobs.candidateId, userId),
    with: {
      job: {
        with: {
          employer: { with: { employerProfile: true } },
        },
      },
    },
    orderBy: (sj, { desc }) => desc(sj.createdAt),
  });
}

export async function getSavedJobIds(userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ jobId: savedJobs.jobId })
    .from(savedJobs)
    .where(eq(savedJobs.candidateId, userId));
  return new Set(rows.map((r) => r.jobId));
}

export async function isJobSaved(
  userId: string,
  jobId: string
): Promise<boolean> {
  const row = await db.query.savedJobs.findFirst({
    where: and(eq(savedJobs.candidateId, userId), eq(savedJobs.jobId, jobId)),
  });
  return !!row;
}
