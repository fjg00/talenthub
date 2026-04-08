import { db } from "@/db";
import { applications, jobs } from "@/db/schema";
import { eq, count, desc, inArray, sql } from "drizzle-orm";

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

// Get ALL applicants across all jobs for an employer
export async function getAllApplicantsByEmployer(employerId: string) {
  // First get all job IDs for this employer
  const employerJobs = await db.query.jobs.findMany({
    where: eq(jobs.employerId, employerId),
    columns: { id: true },
  });
  const jobIds = employerJobs.map((j) => j.id);
  if (jobIds.length === 0) return [];

  return db.query.applications.findMany({
    where: inArray(applications.jobId, jobIds),
    orderBy: desc(applications.createdAt),
    with: {
      job: true,
      candidate: {
        with: { candidateProfile: true },
      },
    },
  });
}

// Employer stats for dashboard
export async function getEmployerStats(employerId: string) {
  const employerJobs = await db.query.jobs.findMany({
    where: eq(jobs.employerId, employerId),
    with: { applications: true },
  });

  const totalJobs = employerJobs.length;
  const activeJobs = employerJobs.filter((j) => j.status === "published").length;
  const allApps = employerJobs.flatMap((j) => j.applications);
  const totalApplicants = allApps.length;

  const statusCounts: Record<string, number> = {};
  for (const app of allApps) {
    statusCounts[app.status] = (statusCounts[app.status] ?? 0) + 1;
  }

  return {
    totalJobs,
    activeJobs,
    totalApplicants,
    statusCounts,
    hired: statusCounts["hired"] ?? 0,
    interviewing: statusCounts["interview"] ?? 0,
    shortlisted: statusCounts["shortlisted"] ?? 0,
    reviewed: statusCounts["reviewed"] ?? 0,
    pending: statusCounts["applied"] ?? 0,
    rejected: statusCounts["rejected"] ?? 0,
    offered: statusCounts["offered"] ?? 0,
  };
}

// Candidate stats for dashboard
export async function getCandidateStats(candidateId: string) {
  const apps = await db.query.applications.findMany({
    where: eq(applications.candidateId, candidateId),
  });

  const statusCounts: Record<string, number> = {};
  for (const app of apps) {
    statusCounts[app.status] = (statusCounts[app.status] ?? 0) + 1;
  }

  return {
    totalApplications: apps.length,
    statusCounts,
    interviewing: statusCounts["interview"] ?? 0,
    shortlisted: statusCounts["shortlisted"] ?? 0,
    offered: statusCounts["offered"] ?? 0,
    rejected: statusCounts["rejected"] ?? 0,
  };
}
