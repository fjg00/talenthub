"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { jobs, applications, candidateProfiles, profiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getMatchScore, type MatchResult } from "@/lib/ai/match-score";
import {
  generateCandidateSummary,
  type CandidateSummary,
} from "@/lib/ai/candidate-summary";
import {
  optimizeJobDescription,
  type JobOptimization,
} from "@/lib/ai/job-optimizer";
import { parseCVText, type ParsedCV } from "@/lib/ai/cv-parser";
import { getCachedResult, setCachedResult } from "@/lib/dal/ai-cache";

// --- Match Score ---

export async function getMatchScoreAction(
  applicationId: string,
  jobId: string
): Promise<{ data?: MatchResult; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Verify employer owns this job
  const job = await db.query.jobs.findFirst({
    where: and(eq(jobs.id, jobId), eq(jobs.employerId, user.id)),
  });
  if (!job) return { error: "Unauthorized" };

  // Check cache first
  const cacheKey = `${applicationId}:${jobId}`;
  const cached = await getCachedResult("match_score", cacheKey);
  if (cached) return { data: cached as MatchResult };

  const application = await db.query.applications.findFirst({
    where: eq(applications.id, applicationId),
    with: {
      candidate: {
        with: { candidateProfile: true },
      },
    },
  });
  if (!application) return { error: "Not found" };

  const cp = application.candidate.candidateProfile;

  const result = await getMatchScore(
    {
      fullName: application.candidate.fullName,
      headline: cp?.headline ?? null,
      skills: cp?.skills ?? null,
      experienceYears: cp?.experienceYears ?? null,
      education: cp?.education ?? null,
      location: cp?.location ?? null,
      bio: cp?.bio ?? null,
      coverLetter: application.coverLetter,
    },
    {
      title: job.title,
      description: job.description,
      location: job.location,
      jobType: job.jobType,
      experienceLevel: job.experienceLevel,
      skills: job.skills as string[] | null,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
    }
  );

  await setCachedResult("match_score", cacheKey, result);
  return { data: result };
}

// --- Candidate Summary ---

export async function getCandidateSummaryAction(
  candidateId: string
): Promise<{ data?: CandidateSummary; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Only employers can generate summaries
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, user.id),
  });
  if (!profile || profile.role !== "employer") return { error: "Unauthorized" };

  // Check cache first
  const cached = await getCachedResult("candidate_summary", candidateId);
  if (cached) return { data: cached as CandidateSummary };

  const candidate = await db.query.profiles.findFirst({
    where: eq(profiles.id, candidateId),
    with: { candidateProfile: true },
  });
  if (!candidate) return { error: "Not found" };

  const cp = candidate.candidateProfile;

  const result = await generateCandidateSummary({
    fullName: candidate.fullName,
    headline: cp?.headline ?? null,
    skills: cp?.skills ?? null,
    experienceYears: cp?.experienceYears ?? null,
    education: cp?.education ?? null,
    location: cp?.location ?? null,
    bio: cp?.bio ?? null,
  });

  await setCachedResult("candidate_summary", candidateId, result);
  return { data: result };
}

// --- Job Optimizer ---

export async function optimizeJobAction(
  jobId: string
): Promise<{ data?: JobOptimization; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Check cache first
  const cached = await getCachedResult("job_optimization", jobId);
  if (cached) return { data: cached as JobOptimization };

  const job = await db.query.jobs.findFirst({
    where: and(eq(jobs.id, jobId), eq(jobs.employerId, user.id)),
  });
  if (!job) return { error: "Unauthorized" };

  const result = await optimizeJobDescription({
    title: job.title,
    description: job.description,
    location: job.location,
    jobType: job.jobType,
    experienceLevel: job.experienceLevel,
    skills: job.skills as string[] | null,
  });

  await setCachedResult("job_optimization", jobId, result);
  return { data: result };
}

// --- CV Parsing ---

export async function parseCVAction(
  cvText: string
): Promise<{ data?: ParsedCV; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  if (!cvText || cvText.trim().length < 50) {
    return { error: "CV text is too short to parse" };
  }

  const result = await parseCVText(cvText);
  return { data: result };
}

export async function parseCVAndUpdateProfileAction(
  cvText: string
): Promise<{ data?: ParsedCV; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  if (!cvText || cvText.trim().length < 50) {
    return { error: "CV text is too short to parse" };
  }

  const result = await parseCVText(cvText);

  // Update candidate profile with parsed data
  const existing = await db.query.candidateProfiles.findFirst({
    where: eq(candidateProfiles.userId, user.id),
  });

  if (existing) {
    await db
      .update(candidateProfiles)
      .set({
        headline: result.headline || existing.headline,
        skills:
          result.skills.length > 0 ? result.skills : existing.skills,
        experienceYears:
          result.experienceYears || existing.experienceYears,
        education: result.education || existing.education,
        location: result.location || existing.location,
        bio: result.bio || existing.bio,
        updatedAt: new Date(),
      })
      .where(eq(candidateProfiles.userId, user.id));
  }

  return { data: result };
}
