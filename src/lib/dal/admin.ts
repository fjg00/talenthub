import { db } from "@/db";
import {
  applications,
  employerProfiles,
  interviews,
  jobs,
  profiles,
} from "@/db/schema";
import { and, desc, eq, gte, ilike, sql } from "drizzle-orm";

export type AdminStats = {
  totalUsers: number;
  totalCandidates: number;
  totalEmployers: number;
  totalJobs: number;
  publishedJobs: number;
  totalApplications: number;
  totalInterviews: number;
  usersLast30Days: number;
  jobsLast30Days: number;
  applicationsLast30Days: number;
};

export async function getAdminStats(): Promise<AdminStats> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  // Raw sql templates don't know column types, so the postgres-js driver
  // tries to coerce Date -> Buffer and throws. Pass an ISO string instead.
  const thirtyDaysAgoIso = thirtyDaysAgo.toISOString();

  const [userRow] = await db
    .select({
      total: sql<number>`count(*)::int`,
      candidates: sql<number>`count(*) filter (where ${profiles.role} = 'candidate')::int`,
      employers: sql<number>`count(*) filter (where ${profiles.role} = 'employer')::int`,
      recent: sql<number>`count(*) filter (where ${profiles.createdAt} >= ${thirtyDaysAgoIso})::int`,
    })
    .from(profiles);

  const [jobRow] = await db
    .select({
      total: sql<number>`count(*)::int`,
      published: sql<number>`count(*) filter (where ${jobs.status} = 'published')::int`,
      recent: sql<number>`count(*) filter (where ${jobs.createdAt} >= ${thirtyDaysAgoIso})::int`,
    })
    .from(jobs);

  const [appRow] = await db
    .select({
      total: sql<number>`count(*)::int`,
      recent: sql<number>`count(*) filter (where ${applications.createdAt} >= ${thirtyDaysAgoIso})::int`,
    })
    .from(applications);

  const [interviewRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(interviews);

  return {
    totalUsers: userRow.total,
    totalCandidates: userRow.candidates,
    totalEmployers: userRow.employers,
    totalJobs: jobRow.total,
    publishedJobs: jobRow.published,
    totalApplications: appRow.total,
    totalInterviews: interviewRow.total,
    usersLast30Days: userRow.recent,
    jobsLast30Days: jobRow.recent,
    applicationsLast30Days: appRow.recent,
  };
}

export async function listUsers(opts?: {
  keyword?: string;
  role?: "candidate" | "employer" | "admin";
  page?: number;
  pageSize?: number;
}) {
  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 25;
  const offset = (page - 1) * pageSize;

  const conds = [];
  if (opts?.keyword) {
    conds.push(
      sql`(${ilike(profiles.fullName, `%${opts.keyword}%`)} OR ${ilike(
        profiles.email,
        `%${opts.keyword}%`
      )})`
    );
  }
  if (opts?.role) conds.push(eq(profiles.role, opts.role));

  const where = conds.length > 0 ? and(...conds) : undefined;

  const rows = await db
    .select({
      id: profiles.id,
      fullName: profiles.fullName,
      email: profiles.email,
      role: profiles.role,
      suspended: profiles.suspended,
      createdAt: profiles.createdAt,
      companyName: employerProfiles.companyName,
    })
    .from(profiles)
    .leftJoin(employerProfiles, eq(employerProfiles.userId, profiles.id))
    .where(where)
    .orderBy(desc(profiles.createdAt))
    .limit(pageSize)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(profiles)
    .where(where);

  return { users: rows, totalCount: count };
}

export async function listJobsAdmin(opts?: {
  keyword?: string;
  status?: "draft" | "published" | "closed";
  page?: number;
  pageSize?: number;
}) {
  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 25;
  const offset = (page - 1) * pageSize;

  const conds = [];
  if (opts?.keyword) conds.push(ilike(jobs.title, `%${opts.keyword}%`));
  if (opts?.status) conds.push(eq(jobs.status, opts.status));
  const where = conds.length > 0 ? and(...conds) : undefined;

  const rows = await db
    .select({
      id: jobs.id,
      title: jobs.title,
      status: jobs.status,
      createdAt: jobs.createdAt,
      views: jobs.views,
      employerId: jobs.employerId,
      employerName: profiles.fullName,
      companyName: employerProfiles.companyName,
      applicants: sql<number>`count(${applications.id})::int`,
    })
    .from(jobs)
    .leftJoin(profiles, eq(profiles.id, jobs.employerId))
    .leftJoin(employerProfiles, eq(employerProfiles.userId, jobs.employerId))
    .leftJoin(applications, eq(applications.jobId, jobs.id))
    .where(where)
    .groupBy(
      jobs.id,
      jobs.title,
      jobs.status,
      jobs.createdAt,
      jobs.views,
      jobs.employerId,
      profiles.fullName,
      employerProfiles.companyName
    )
    .orderBy(desc(jobs.createdAt))
    .limit(pageSize)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(jobs)
    .where(where);

  return { jobs: rows, totalCount: count };
}

/**
 * Guard: returns true when the given user id is an admin and not suspended.
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const row = await db
    .select({ role: profiles.role, suspended: profiles.suspended })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  if (row.length === 0) return false;
  return row[0].role === "admin" && !row[0].suspended;
}

/**
 * Growth — daily signups + job posts over the last 30 days.
 */
export async function getAdminGrowth() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const userRows = await db
    .select({
      day: sql<string>`to_char(${profiles.createdAt}, 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(profiles)
    .where(gte(profiles.createdAt, thirtyDaysAgo))
    .groupBy(sql`to_char(${profiles.createdAt}, 'YYYY-MM-DD')`);

  const jobRows = await db
    .select({
      day: sql<string>`to_char(${jobs.createdAt}, 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(jobs)
    .where(gte(jobs.createdAt, thirtyDaysAgo))
    .groupBy(sql`to_char(${jobs.createdAt}, 'YYYY-MM-DD')`);

  const userMap = new Map(userRows.map((r) => [r.day, r.count]));
  const jobMap = new Map(jobRows.map((r) => [r.day, r.count]));

  const days: { date: string; users: number; jobs: number }[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    days.push({
      date: key,
      users: userMap.get(key) ?? 0,
      jobs: jobMap.get(key) ?? 0,
    });
  }
  return days;
}
