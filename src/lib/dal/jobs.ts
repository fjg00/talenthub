import { db } from "@/db";
import { jobs, applications } from "@/db/schema";
import { eq, and, ilike, or, sql, desc, count } from "drizzle-orm";

export async function getJobsByEmployer(userId: string) {
  const result = await db.query.jobs.findMany({
    where: eq(jobs.employerId, userId),
    orderBy: desc(jobs.createdAt),
    with: {
      applications: true,
    },
  });
  return result;
}

export async function getJobById(jobId: string) {
  const result = await db.query.jobs.findFirst({
    where: eq(jobs.id, jobId),
    with: {
      employer: {
        with: {
          employerProfile: true,
        },
      },
    },
  });
  return result ?? null;
}

export async function getPublishedJobs({
  keyword,
  jobType,
  experienceLevel,
  page = 1,
  pageSize = 10,
}: {
  keyword?: string;
  jobType?: string;
  experienceLevel?: string;
  page?: number;
  pageSize?: number;
}) {
  const conditions = [eq(jobs.status, "published")];

  if (keyword) {
    const search = `%${keyword}%`;
    conditions.push(
      or(
        ilike(jobs.title, search),
        ilike(jobs.description, search),
        ilike(jobs.location, search)
      )!
    );
  }

  if (jobType) {
    conditions.push(eq(jobs.jobType, jobType as typeof jobs.jobType.enumValues[number]));
  }

  if (experienceLevel) {
    conditions.push(
      eq(jobs.experienceLevel, experienceLevel as typeof jobs.experienceLevel.enumValues[number])
    );
  }

  const where = and(...conditions);
  const offset = (page - 1) * pageSize;

  const [jobResults, countResult] = await Promise.all([
    db.query.jobs.findMany({
      where,
      orderBy: desc(jobs.createdAt),
      limit: pageSize,
      offset,
      with: {
        employer: {
          with: {
            employerProfile: true,
          },
        },
      },
    }),
    db
      .select({ total: count() })
      .from(jobs)
      .where(where),
  ]);

  return {
    jobs: jobResults,
    totalCount: countResult[0]?.total ?? 0,
  };
}

export async function getJobWithApplications(
  jobId: string,
  employerId: string
) {
  const result = await db.query.jobs.findFirst({
    where: and(eq(jobs.id, jobId), eq(jobs.employerId, employerId)),
    with: {
      applications: {
        orderBy: desc(applications.createdAt),
        with: {
          candidate: {
            with: {
              candidateProfile: true,
            },
          },
        },
      },
    },
  });
  return result ?? null;
}

export async function hasApplied(jobId: string, candidateId: string) {
  const result = await db.query.applications.findFirst({
    where: and(
      eq(applications.jobId, jobId),
      eq(applications.candidateId, candidateId)
    ),
  });
  return !!result;
}
