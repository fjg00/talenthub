import { db } from "@/db";
import { profiles, employerProfiles, jobs } from "@/db/schema";
import { and, eq, desc, sql } from "drizzle-orm";
import { isUuid } from "@/lib/utils/uuid";

export type CompanySummary = {
  employerId: string;
  companyName: string;
  industry: string | null;
  location: string | null;
  logoUrl: string | null;
  companySize: string | null;
  openJobs: number;
};

/**
 * Companies (employers) that have at least one published job. Sorted by
 * open-job count descending. Used on the /companies index.
 */
export async function getCompaniesWithOpenJobs(opts?: {
  keyword?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ companies: CompanySummary[]; totalCount: number }> {
  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 24;
  const offset = (page - 1) * pageSize;

  const conditions = [eq(jobs.status, "published")];

  if (opts?.keyword) {
    const kw = `%${opts.keyword.toLowerCase()}%`;
    conditions.push(
      sql`(lower(coalesce(${employerProfiles.companyName}, ${profiles.fullName})) LIKE ${kw}
           OR lower(coalesce(${employerProfiles.industry}, '')) LIKE ${kw})`
    );
  }

  const rows = await db
    .select({
      employerId: profiles.id,
      fullName: profiles.fullName,
      companyName: employerProfiles.companyName,
      industry: employerProfiles.industry,
      location: employerProfiles.location,
      logoUrl: employerProfiles.logoUrl,
      companySize: employerProfiles.companySize,
      openJobs: sql<number>`count(${jobs.id})::int`,
    })
    .from(profiles)
    .leftJoin(employerProfiles, eq(employerProfiles.userId, profiles.id))
    .innerJoin(jobs, eq(jobs.employerId, profiles.id))
    .where(and(...conditions))
    .groupBy(
      profiles.id,
      profiles.fullName,
      employerProfiles.companyName,
      employerProfiles.industry,
      employerProfiles.location,
      employerProfiles.logoUrl,
      employerProfiles.companySize
    )
    .orderBy(desc(sql`count(${jobs.id})`))
    .limit(pageSize)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(distinct ${profiles.id})::int` })
    .from(profiles)
    .leftJoin(employerProfiles, eq(employerProfiles.userId, profiles.id))
    .innerJoin(jobs, eq(jobs.employerId, profiles.id))
    .where(and(...conditions));

  return {
    companies: rows.map((r) => ({
      employerId: r.employerId,
      companyName: r.companyName ?? r.fullName,
      industry: r.industry,
      location: r.location,
      logoUrl: r.logoUrl,
      companySize: r.companySize,
      openJobs: r.openJobs,
    })),
    totalCount: count,
  };
}

/**
 * Public company profile with published jobs.
 */
export async function getPublicCompany(employerId: string) {
  if (!isUuid(employerId)) return null;
  const row = await db
    .select({
      employerId: profiles.id,
      fullName: profiles.fullName,
      companyName: employerProfiles.companyName,
      companyDescription: employerProfiles.companyDescription,
      companyWebsite: employerProfiles.companyWebsite,
      companySize: employerProfiles.companySize,
      industry: employerProfiles.industry,
      location: employerProfiles.location,
      logoUrl: employerProfiles.logoUrl,
    })
    .from(profiles)
    .leftJoin(employerProfiles, eq(employerProfiles.userId, profiles.id))
    .where(and(eq(profiles.id, employerId), eq(profiles.role, "employer")))
    .limit(1);

  if (row.length === 0) return null;

  const openJobs = await db.query.jobs.findMany({
    where: and(eq(jobs.employerId, employerId), eq(jobs.status, "published")),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });

  const company = row[0];
  return {
    employerId: company.employerId,
    companyName: company.companyName ?? company.fullName,
    companyDescription: company.companyDescription,
    companyWebsite: company.companyWebsite,
    companySize: company.companySize,
    industry: company.industry,
    location: company.location,
    logoUrl: company.logoUrl,
    openJobs,
  };
}
