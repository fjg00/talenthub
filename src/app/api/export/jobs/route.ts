import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { jobs, applications } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { buildCsv, csvResponse } from "@/lib/csv";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type Row = {
  title: string;
  status: string;
  job_type: string;
  experience_level: string;
  location: string;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
  skills: string[];
  views: number;
  applicants: number;
  deadline: Date | null;
  created_at: Date | null;
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const rl = await checkRateLimit("exportData", user.id);
  if (!rl.allowed) return rateLimitResponse(rl);

  const rows = await db
    .select({
      title: jobs.title,
      status: jobs.status,
      jobType: jobs.jobType,
      experienceLevel: jobs.experienceLevel,
      location: jobs.location,
      salaryMin: jobs.salaryMin,
      salaryMax: jobs.salaryMax,
      currency: jobs.currency,
      skills: jobs.skills,
      views: jobs.views,
      applicants: sql<number>`count(${applications.id})::int`,
      deadline: jobs.deadline,
      createdAt: jobs.createdAt,
    })
    .from(jobs)
    .leftJoin(applications, eq(applications.jobId, jobs.id))
    .where(eq(jobs.employerId, user.id))
    .groupBy(jobs.id);

  const csvRows: Row[] = rows.map((r) => ({
    title: r.title,
    status: r.status,
    job_type: r.jobType ?? "",
    experience_level: r.experienceLevel ?? "",
    location: r.location ?? "",
    salary_min: r.salaryMin,
    salary_max: r.salaryMax,
    currency: r.currency ?? "",
    skills: r.skills ?? [],
    views: r.views,
    applicants: r.applicants,
    deadline: r.deadline,
    created_at: r.createdAt,
  }));

  const headers = [
    { key: "title" as const, label: "Title" },
    { key: "status" as const, label: "Status" },
    { key: "job_type" as const, label: "Type" },
    { key: "experience_level" as const, label: "Experience Level" },
    { key: "location" as const, label: "Location" },
    { key: "salary_min" as const, label: "Salary Min" },
    { key: "salary_max" as const, label: "Salary Max" },
    { key: "currency" as const, label: "Currency" },
    { key: "skills" as const, label: "Skills" },
    { key: "views" as const, label: "Views" },
    { key: "applicants" as const, label: "Applicants" },
    { key: "deadline" as const, label: "Deadline" },
    { key: "created_at" as const, label: "Created" },
  ];

  const body = buildCsv<Row>(headers, csvRows);
  const date = new Date().toISOString().split("T")[0];
  return csvResponse(body, `jobs-${date}.csv`);
}
