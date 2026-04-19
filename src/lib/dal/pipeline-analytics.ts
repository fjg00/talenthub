import { db } from "@/db";
import { applications, applicationStatusHistory, jobs } from "@/db/schema";
import { and, eq, gte, sql } from "drizzle-orm";

export type PipelineAnalytics = {
  // Conversion rates between consecutive pipeline stages
  stageFunnel: Array<{ stage: string; reached: number; rate: number }>;
  // Median / avg days from first application to hired
  timeToHire: { medianDays: number | null; avgDays: number | null; sample: number };
  // Avg days a candidate spends in each stage (based on status history)
  stageDurations: Array<{ stage: string; avgDays: number | null; sample: number }>;
  // Daily application volume for the last 30 days
  trend: Array<{ date: string; count: number }>;
  // Top jobs by conversion (hired / applicants)
  topConvertingJobs: Array<{
    jobId: string;
    title: string;
    applicants: number;
    hired: number;
    conversionRate: number;
  }>;
};

const PIPELINE_STAGES = [
  "applied",
  "reviewed",
  "shortlisted",
  "interview",
  "offered",
  "hired",
] as const;

/**
 * Deep pipeline analytics for an employer. Reads `applications` for funnel
 * counts, `application_status_history` for time-based metrics, and `jobs`
 * for labels. Returns everything needed by the analytics page.
 */
export async function getPipelineAnalytics(
  employerId: string
): Promise<PipelineAnalytics> {
  // 1. Stage funnel — how many applications have ever reached each stage.
  // We approximate "ever reached" as: rows in status history with that status,
  // OR the application's current status being that stage or later in pipeline.
  const historyRows = await db
    .select({
      applicationId: applicationStatusHistory.applicationId,
      status: applicationStatusHistory.status,
      createdAt: applicationStatusHistory.createdAt,
    })
    .from(applicationStatusHistory)
    .innerJoin(
      applications,
      eq(applications.id, applicationStatusHistory.applicationId)
    )
    .innerJoin(jobs, eq(jobs.id, applications.jobId))
    .where(eq(jobs.employerId, employerId));

  const reachedByApp = new Map<string, Set<string>>();
  const enterTimes = new Map<string, Map<string, Date>>();
  for (const row of historyRows) {
    if (!reachedByApp.has(row.applicationId)) {
      reachedByApp.set(row.applicationId, new Set());
      enterTimes.set(row.applicationId, new Map());
    }
    reachedByApp.get(row.applicationId)!.add(row.status);
    const times = enterTimes.get(row.applicationId)!;
    // Keep earliest entry into each stage
    const existing = times.get(row.status);
    if (!existing || row.createdAt < existing) {
      times.set(row.status, row.createdAt);
    }
  }

  const totalApplicants = reachedByApp.size;
  const stageFunnel = PIPELINE_STAGES.map((stage) => {
    let reached = 0;
    for (const set of reachedByApp.values()) if (set.has(stage)) reached++;
    return {
      stage,
      reached,
      rate: totalApplicants > 0 ? reached / totalApplicants : 0,
    };
  });

  // 2. Time to hire — for every application that reached "hired",
  // days between earliest "applied" timestamp and "hired" timestamp.
  const hireDurations: number[] = [];
  for (const times of enterTimes.values()) {
    const applied = times.get("applied");
    const hired = times.get("hired");
    if (applied && hired) {
      const days = (hired.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24);
      if (days >= 0) hireDurations.push(days);
    }
  }
  hireDurations.sort((a, b) => a - b);
  const medianDays =
    hireDurations.length === 0
      ? null
      : hireDurations.length % 2
        ? hireDurations[Math.floor(hireDurations.length / 2)]
        : (hireDurations[hireDurations.length / 2 - 1] +
            hireDurations[hireDurations.length / 2]) /
          2;
  const avgDays =
    hireDurations.length === 0
      ? null
      : hireDurations.reduce((a, b) => a + b, 0) / hireDurations.length;

  // 3. Stage durations — avg days between consecutive stages across apps
  const stageDurations = PIPELINE_STAGES.slice(0, -1).map((from, i) => {
    const to = PIPELINE_STAGES[i + 1];
    const deltas: number[] = [];
    for (const times of enterTimes.values()) {
      const a = times.get(from);
      const b = times.get(to);
      if (a && b) {
        const d = (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
        if (d >= 0) deltas.push(d);
      }
    }
    return {
      stage: `${from}→${to}`,
      avgDays:
        deltas.length === 0
          ? null
          : deltas.reduce((x, y) => x + y, 0) / deltas.length,
      sample: deltas.length,
    };
  });

  // 4. Trend — applications per day for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const trendRows = await db
    .select({
      day: sql<string>`to_char(${applications.createdAt}, 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(applications)
    .innerJoin(jobs, eq(jobs.id, applications.jobId))
    .where(
      and(
        eq(jobs.employerId, employerId),
        gte(applications.createdAt, thirtyDaysAgo)
      )
    )
    .groupBy(sql`to_char(${applications.createdAt}, 'YYYY-MM-DD')`);

  const trendMap = new Map(trendRows.map((r) => [r.day, r.count]));
  const trend: Array<{ date: string; count: number }> = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    trend.push({ date: key, count: trendMap.get(key) ?? 0 });
  }

  // 5. Top-converting jobs
  const jobRows = await db
    .select({
      jobId: jobs.id,
      title: jobs.title,
      applicants: sql<number>`count(${applications.id})::int`,
      hired: sql<number>`count(*) filter (where ${applications.status} = 'hired')::int`,
    })
    .from(jobs)
    .leftJoin(applications, eq(applications.jobId, jobs.id))
    .where(eq(jobs.employerId, employerId))
    .groupBy(jobs.id, jobs.title);

  const topConvertingJobs = jobRows
    .filter((j) => j.applicants > 0)
    .map((j) => ({
      jobId: j.jobId,
      title: j.title,
      applicants: j.applicants,
      hired: j.hired,
      conversionRate: j.applicants > 0 ? j.hired / j.applicants : 0,
    }))
    .sort((a, b) => b.conversionRate - a.conversionRate)
    .slice(0, 5);

  return {
    stageFunnel,
    timeToHire: {
      medianDays: medianDays === null ? null : Math.round(medianDays * 10) / 10,
      avgDays: avgDays === null ? null : Math.round(avgDays * 10) / 10,
      sample: hireDurations.length,
    },
    stageDurations: stageDurations.map((s) => ({
      ...s,
      avgDays: s.avgDays === null ? null : Math.round(s.avgDays * 10) / 10,
    })),
    trend,
    topConvertingJobs,
  };
}
