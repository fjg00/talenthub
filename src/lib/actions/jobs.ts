"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export type JobState = {
  error?: string;
  success?: boolean;
};

const jobSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  location: z.string().max(200).optional(),
  jobType: z.enum(["full_time", "part_time", "contract", "remote"]).optional(),
  experienceLevel: z.enum(["entry", "mid", "senior", "lead"]).optional(),
  skills: z.string().optional(),
  salaryMin: z.coerce.number().int().min(0).optional(),
  salaryMax: z.coerce.number().int().min(0).optional(),
  currency: z
    .enum(["USD", "SAR", "AED", "QAR", "KWD", "BHD", "OMR", "EGP"])
    .optional(),
  deadline: z.string().optional(),
  status: z.enum(["draft", "published"]).optional(),
});

function parseJobFormData(formData: FormData) {
  return {
    title: formData.get("title"),
    description: formData.get("description"),
    location: formData.get("location") ?? undefined,
    jobType: formData.get("jobType") ?? undefined,
    experienceLevel: formData.get("experienceLevel") ?? undefined,
    skills: formData.get("skills") ?? undefined,
    salaryMin: formData.get("salaryMin") || undefined,
    salaryMax: formData.get("salaryMax") || undefined,
    currency: formData.get("currency") ?? undefined,
    deadline: formData.get("deadline") ?? undefined,
    status: formData.get("status") ?? undefined,
  };
}

export async function createJobAction(
  _prevState: JobState,
  formData: FormData
): Promise<JobState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const parsed = jobSchema.safeParse(parseJobFormData(formData));
  if (!parsed.success) return { error: "validationError" };

  const skillsArray = parsed.data.skills
    ? parsed.data.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const [newJob] = await db
    .insert(jobs)
    .values({
      employerId: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      location: parsed.data.location,
      jobType: parsed.data.jobType,
      experienceLevel: parsed.data.experienceLevel,
      skills: skillsArray,
      salaryMin: parsed.data.salaryMin,
      salaryMax: parsed.data.salaryMax,
      currency: parsed.data.currency,
      deadline: parsed.data.deadline
        ? new Date(parsed.data.deadline)
        : undefined,
      status: parsed.data.status ?? "draft",
    })
    .returning({ id: jobs.id });

  revalidatePath("/dashboard/jobs");
  redirect(`/dashboard/jobs/${newJob.id}`);
}

export async function updateJobAction(
  _prevState: JobState,
  formData: FormData
): Promise<JobState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const jobId = formData.get("jobId") as string;
  if (!jobId) return { error: "validationError" };

  // Verify ownership
  const existing = await db.query.jobs.findFirst({
    where: and(eq(jobs.id, jobId), eq(jobs.employerId, user.id)),
  });
  if (!existing) return { error: "Unauthorized" };

  const parsed = jobSchema.safeParse(parseJobFormData(formData));
  if (!parsed.success) return { error: "validationError" };

  const skillsArray = parsed.data.skills
    ? parsed.data.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  await db
    .update(jobs)
    .set({
      title: parsed.data.title,
      description: parsed.data.description,
      location: parsed.data.location,
      jobType: parsed.data.jobType,
      experienceLevel: parsed.data.experienceLevel,
      skills: skillsArray,
      salaryMin: parsed.data.salaryMin,
      salaryMax: parsed.data.salaryMax,
      currency: parsed.data.currency,
      deadline: parsed.data.deadline
        ? new Date(parsed.data.deadline)
        : null,
      status: parsed.data.status ?? existing.status,
      updatedAt: new Date(),
    })
    .where(eq(jobs.id, jobId));

  revalidatePath("/dashboard/jobs");
  revalidatePath(`/dashboard/jobs/${jobId}`);
  return { success: true };
}

export async function deleteJobAction(jobId: string): Promise<JobState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const existing = await db.query.jobs.findFirst({
    where: and(eq(jobs.id, jobId), eq(jobs.employerId, user.id)),
  });
  if (!existing) return { error: "Unauthorized" };

  await db.delete(jobs).where(eq(jobs.id, jobId));
  revalidatePath("/dashboard/jobs");
  redirect("/dashboard/jobs");
}

export async function toggleJobStatusAction(
  jobId: string,
  newStatus: "published" | "closed"
): Promise<JobState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const existing = await db.query.jobs.findFirst({
    where: and(eq(jobs.id, jobId), eq(jobs.employerId, user.id)),
  });
  if (!existing) return { error: "Unauthorized" };

  await db
    .update(jobs)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(jobs.id, jobId));

  revalidatePath("/dashboard/jobs");
  revalidatePath(`/dashboard/jobs/${jobId}`);
  return { success: true };
}
