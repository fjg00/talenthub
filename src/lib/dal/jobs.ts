import { db } from "@/db";
import { jobs, applications } from "@/db/schema";
import { eq, and, ilike, or, sql, desc, count, sum } from "drizzle-orm";
import { computeSkillMatch } from "@/lib/utils/skill-match";

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
  if (!result) return null;

  const jobSkills = result.skills ?? [];
  const enrichedApplications = result.applications
    .map((app) => ({
      ...app,
      ...computeSkillMatch(jobSkills, app.candidate.candidateProfile?.skills ?? []),
    }))
    .sort((a, b) => b.matchPct - a.matchPct);

  return { ...result, applications: enrichedApplications };
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

export async function incrementJobViews(jobId: string) {
  await db
    .update(jobs)
    .set({ views: sql`${jobs.views} + 1` })
    .where(eq(jobs.id, jobId));
}

export async function getSuggestedJobs(
  excludeJobId: string,
  candidateSkills: string[],
  candidateLocation: string | null | undefined,
  limit = 6
) {
  const allPublished = await db.query.jobs.findMany({
    where: and(eq(jobs.status, "published"), sql`${jobs.id} != ${excludeJobId}`),
    orderBy: desc(jobs.createdAt),
    limit: 50,
    with: {
      employer: { with: { employerProfile: true } },
    },
  });

  const normalise = (s: string) => s.toLowerCase().trim();

  const scored = allPublished.map((job) => {
    const { matchPct, matchedSkills } = computeSkillMatch(job.skills ?? [], candidateSkills);
    const locationBonus =
      candidateLocation && job.location
        ? normalise(job.location).includes(normalise(candidateLocation)) ||
          normalise(candidateLocation).includes(normalise(job.location))
          ? 5
          : 0
        : 0;
    return {
      job,
      matchPct,
      matchedSkills,
      signals: matchPct + locationBonus,
    };
  });

  scored.sort((a, b) => b.signals - a.signals);
  return scored.slice(0, limit);
}
