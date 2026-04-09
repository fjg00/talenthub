"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { applications, jobs, candidateProfiles } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { interviews } from "@/db/schema";
import { generateInterviewQuestions } from "@/lib/ai/interview";

export type ApplicationState = {
  error?: string;
  success?: boolean;
};

const applySchema = z.object({
  jobId: z.string().uuid(),
  coverLetter: z.string().max(3000).optional(),
});

export async function applyToJobAction(
  _prevState: ApplicationState,
  formData: FormData
): Promise<ApplicationState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const parsed = applySchema.safeParse({
    jobId: formData.get("jobId"),
    coverLetter: formData.get("coverLetter") ?? undefined,
  });

  if (!parsed.success) return { error: "validationError" };

  // Verify job is published
  const job = await db.query.jobs.findFirst({
    where: and(eq(jobs.id, parsed.data.jobId), eq(jobs.status, "published")),
  });
  if (!job) return { error: "jobNotFound" };

  // Get candidate's current CV for snapshot
  const candidateProfile = await db.query.candidateProfiles.findFirst({
    where: eq(candidateProfiles.userId, user.id),
  });

  try {
    await db.insert(applications).values({
      jobId: parsed.data.jobId,
      candidateId: user.id,
      coverLetter: parsed.data.coverLetter,
      cvUrl: candidateProfile?.cvUrl ?? null,
    });
  } catch (err: unknown) {
    // Unique constraint violation = already applied
    if (
      err instanceof Error &&
      err.message.includes("unique")
    ) {
      return { error: "alreadyApplied" };
    }
    return { error: "applyFailed" };
  }

  revalidatePath("/dashboard/jobs");
  revalidatePath(`/dashboard/jobs/${parsed.data.jobId}`);
  revalidatePath("/dashboard/applications");
  return { success: true };
}

const statusSchema = z.object({
  applicationId: z.string().uuid(),
  status: z.enum([
    "applied",
    "reviewed",
    "shortlisted",
    "interview",
    "offered",
    "rejected",
    "hired",
  ]),
});

export async function updateApplicationStatusAction(
  applicationId: string,
  newStatus: string
): Promise<ApplicationState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const parsed = statusSchema.safeParse({
    applicationId,
    status: newStatus,
  });
  if (!parsed.success) return { error: "validationError" };

  // Get application and verify employer owns the parent job
  const application = await db.query.applications.findFirst({
    where: eq(applications.id, parsed.data.applicationId),
    with: { job: true },
  });

  if (!application || application.job.employerId !== user.id) {
    return { error: "Unauthorized" };
  }

  await db
    .update(applications)
    .set({
      status: parsed.data.status,
      updatedAt: new Date(),
    })
    .where(eq(applications.id, parsed.data.applicationId));

  // Auto-reject all other applicants when someone is hired
  if (parsed.data.status === "hired") {
    await db
      .update(applications)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(
        and(
          eq(applications.jobId, application.jobId),
          ne(applications.id, parsed.data.applicationId),
          ne(applications.status, "hired")
        )
      );
    // Auto-close the job
    await db
      .update(jobs)
      .set({ status: "closed", updatedAt: new Date() })
      .where(eq(jobs.id, application.jobId));
  }

  // Auto-create interview when status changes to "interview"
  if (parsed.data.status === "interview") {
    const existing = await db.query.interviews.findFirst({
      where: and(
        eq(interviews.jobId, application.jobId),
        eq(interviews.candidateId, application.candidateId)
      ),
    });
    if (!existing) {
      try {
        const questions = await generateInterviewQuestions({
          title: application.job.title,
          description: application.job.description,
          skills: application.job.skills as string[] | null,
          experienceLevel: application.job.experienceLevel,
        });
        await db.insert(interviews).values({
          jobId: application.jobId,
          candidateId: application.candidateId,
          questions,
          status: "pending",
        });
      } catch {
        // Interview creation failed (quota etc.) — status still updated
      }
    }
  }

  revalidatePath(`/dashboard/jobs/${application.jobId}`);
  revalidatePath("/dashboard/applications");
  revalidatePath("/dashboard/candidates");
  revalidatePath("/dashboard/interviews");
  return { success: true };
}
