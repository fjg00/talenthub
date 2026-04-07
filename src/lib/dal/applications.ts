import { db } from "@/db";
import { applications } from "@/db/schema";
import { eq, count, desc } from "drizzle-orm";

export async function getApplicationsByCandidate(userId: string) {
  const result = await db.query.applications.findMany({
    where: eq(applications.candidateId, userId),
    orderBy: desc(applications.createdAt),
    with: {
      job: {
        with: {
          employer: {
            with: {
              employerProfile: true,
            },
          },
        },
      },
    },
  });
  return result;
}

export async function getApplicationCountByJob(jobId: string) {
  const result = await db
    .select({ total: count() })
    .from(applications)
    .where(eq(applications.jobId, jobId));
  return result[0]?.total ?? 0;
}
