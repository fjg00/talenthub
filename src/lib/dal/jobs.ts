import { db } from "@/db";
import { jobs, applications, candidateProfiles, profiles } from "@/db/schema";
import { eq, and, ne, ilike, or, sql, desc, count, sum } from "drizzle-orm";
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
  location,
  salaryMin,
  salaryMax,
  currency,
  skills,
  excludeAppliedByCandidateId,
  page = 1,
  pageSize = 10,
}: {
  keyword?: string;
  jobType?: string;
  experienceLevel?: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  skills?: string[];
  excludeAppliedByCandidateId?: string;
  page?: number;
  pageSize?: number;
}) {
  const conditions = [eq(jobs.status, "published")];

  if (excludeAppliedByCandidateId) {
    conditions.push(
      sql`NOT EXISTS (SELECT 1 FROM ${applications} WHERE ${applications.jobId} = ${jobs.id} AND ${applications.candidateId} = ${excludeAppliedByCandidateId})`
    );
  }

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

  if (location) {
    conditions.push(ilike(jobs.location, `%${location}%`));
  }

  if (currency) {
    conditions.push(eq(jobs.currency, currency as typeof jobs.currency.enumValues[number]));
  }

  if (salaryMin != null) {
    conditions.push(sql`${jobs.salaryMax} >= ${salaryMin}`);
  }

  if (salaryMax != null) {
    conditions.push(sql`${jobs.salaryMin} <= ${salaryMax}`);
  }

  if (skills && skills.length > 0) {
    for (const skill of skills) {
      conditions.push(
        sql`EXISTS (SELECT 1 FROM jsonb_array_elements_text(${jobs.skills}) AS s WHERE LOWER(s) = LOWER(${skill}))`
      );
    }
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

// ─── Employer: recommended candidates for a job ──────────────────────────────

export async function getRecommendedCandidates(jobId: string, limit = 10) {
  const job = await db.query.jobs.findFirst({
    where: eq(jobs.id, jobId),
  });
  if (!job) return [];

  const jobSkills = (job.skills ?? []) as string[];

  // Get all candidates who are open to work and haven't already applied to this job
  const appliedIds = await db
    .select({ candidateId: applications.candidateId })
    .from(applications)
    .where(eq(applications.jobId, jobId));
  const appliedSet = new Set(appliedIds.map((a) => a.candidateId));

  const candidates = await db.query.candidateProfiles.findMany({
    where: ne(candidateProfiles.availabilityStatus, "not_looking"),
    with: {
      profile: true,
    },
  });

  const normalise = (s: string) => s.toLowerCase().trim();

  const scored = candidates
    .filter((c) => !appliedSet.has(c.userId))
    .map((c) => {
      const { matchPct, matchedSkills, missingSkills } = computeSkillMatch(
        jobSkills,
        c.skills ?? []
      );
      const locationBonus =
        c.location && job.location
          ? normalise(c.location).includes(normalise(job.location)) ||
            normalise(job.location).includes(normalise(c.location))
            ? 5
            : 0
          : 0;
      const expBonus =
        job.experienceLevel && c.experienceYears != null
          ? matchExperienceLevel(job.experienceLevel, c.experienceYears)
          : 0;
      return {
        candidate: c,
        matchPct,
        matchedSkills,
        missingSkills,
        signals: matchPct + locationBonus + expBonus,
      };
    })
    .filter((c) => c.matchPct > 0);

  scored.sort((a, b) => b.signals - a.signals);
  return scored.slice(0, limit);
}

function matchExperienceLevel(level: string, years: number): number {
  const ranges: Record<string, [number, number]> = {
    entry: [0, 2],
    mid: [2, 5],
    senior: [5, 10],
    lead: [8, 99],
  };
  const range = ranges[level];
  if (!range) return 0;
  return years >= range[0] && years <= range[1] ? 5 : 0;
}

// ─── Candidate: recommended jobs for dashboard ───────────────────────────────

export async function getRecommendedJobs(
  candidateSkills: string[],
  candidateLocation: string | null | undefined,
  limit = 6
) {
  if (candidateSkills.length === 0) return [];

  const allPublished = await db.query.jobs.findMany({
    where: eq(jobs.status, "published"),
    orderBy: desc(jobs.createdAt),
    limit: 50,
    with: {
      employer: { with: { employerProfile: true } },
    },
  });

  const normalise = (s: string) => s.toLowerCase().trim();

  const scored = allPublished.map((job) => {
    const { matchPct, matchedSkills } = computeSkillMatch(
      job.skills ?? [],
      candidateSkills
    );
    const locationBonus =
      candidateLocation && job.location
        ? normalise(job.location).includes(normalise(candidateLocation)) ||
          normalise(candidateLocation).includes(normalise(job.location))
          ? 5
          : 0
        : 0;
    return { job, matchPct, matchedSkills, signals: matchPct + locationBonus };
  });

  scored.sort((a, b) => b.signals - a.signals);
  return scored.filter((s) => s.matchPct > 0).slice(0, limit);
}
