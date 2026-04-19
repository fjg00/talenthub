import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import {
  applications,
  jobs,
  profiles,
  candidateProfiles,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { buildCsv, csvResponse, slugifyForFilename } from "@/lib/csv";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type Row = {
  candidate_name: string;
  email: string;
  status: string;
  headline: string;
  location: string;
  experience_years: number | null;
  skills: string[];
  phone: string;
  linkedin_url: string;
  availability: string;
  cv_url: string;
  applied_at: Date | null;
  updated_at: Date | null;
  cover_letter: string;
};

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await ctx.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const rl = await checkRateLimit("exportData", user.id);
  if (!rl.allowed) return rateLimitResponse(rl);

  // Verify job ownership.
  const job = await db.query.jobs.findFirst({
    where: and(eq(jobs.id, jobId), eq(jobs.employerId, user.id)),
  });
  if (!job) {
    return new Response("Not found", { status: 404 });
  }

  const rows = await db
    .select({
      candidateName: profiles.fullName,
      email: profiles.email,
      status: applications.status,
      headline: candidateProfiles.headline,
      location: candidateProfiles.location,
      experienceYears: candidateProfiles.experienceYears,
      skills: candidateProfiles.skills,
      phone: candidateProfiles.phone,
      linkedinUrl: candidateProfiles.linkedinUrl,
      availability: candidateProfiles.availabilityStatus,
      cvUrl: applications.cvUrl,
      appliedAt: applications.createdAt,
      updatedAt: applications.updatedAt,
      coverLetter: applications.coverLetter,
    })
    .from(applications)
    .innerJoin(profiles, eq(profiles.id, applications.candidateId))
    .leftJoin(
      candidateProfiles,
      eq(candidateProfiles.userId, applications.candidateId)
    )
    .where(eq(applications.jobId, jobId));

  const csvRows: Row[] = rows.map((r) => ({
    candidate_name: r.candidateName,
    email: r.email,
    status: r.status,
    headline: r.headline ?? "",
    location: r.location ?? "",
    experience_years: r.experienceYears,
    skills: r.skills ?? [],
    phone: r.phone ?? "",
    linkedin_url: r.linkedinUrl ?? "",
    availability: r.availability ?? "",
    cv_url: r.cvUrl ?? "",
    applied_at: r.appliedAt,
    updated_at: r.updatedAt,
    cover_letter: r.coverLetter ?? "",
  }));

  const headers = [
    { key: "candidate_name" as const, label: "Candidate" },
    { key: "email" as const, label: "Email" },
    { key: "status" as const, label: "Status" },
    { key: "headline" as const, label: "Headline" },
    { key: "location" as const, label: "Location" },
    { key: "experience_years" as const, label: "Years of Experience" },
    { key: "skills" as const, label: "Skills" },
    { key: "phone" as const, label: "Phone" },
    { key: "linkedin_url" as const, label: "LinkedIn" },
    { key: "availability" as const, label: "Availability" },
    { key: "cv_url" as const, label: "CV URL" },
    { key: "applied_at" as const, label: "Applied At" },
    { key: "updated_at" as const, label: "Updated At" },
    { key: "cover_letter" as const, label: "Cover Letter" },
  ];

  const body = buildCsv<Row>(headers, csvRows);
  const date = new Date().toISOString().split("T")[0];
  const filename = `applicants-${slugifyForFilename(job.title)}-${date}.csv`;

  return csvResponse(body, filename);
}
