"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { applications, interviewSchedules, jobs } from "@/db/schema";
import { createNotification } from "@/lib/dal/notifications";
import { sendEmail } from "@/lib/email";
import { interviewScheduledEmail } from "@/lib/email-templates";

export type ScheduleActionState = {
  error?: string;
  success?: boolean;
  scheduleId?: string;
};

const scheduleTypeSchema = z.enum(["video", "phone", "onsite"]);

const createSchema = z.object({
  applicationId: z.string().uuid(),
  scheduledAt: z.string().min(1),
  durationMinutes: z.coerce.number().int().min(5).max(480),
  type: scheduleTypeSchema,
  location: z.string().trim().max(500).optional(),
  meetingUrl: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(2000).optional(),
});

async function requireEmployerOwnsApplication(
  userId: string,
  applicationId: string
) {
  const row = await db
    .select({
      applicationId: applications.id,
      candidateId: applications.candidateId,
      jobId: applications.jobId,
      jobTitle: jobs.title,
      employerId: jobs.employerId,
    })
    .from(applications)
    .innerJoin(jobs, eq(jobs.id, applications.jobId))
    .where(eq(applications.id, applicationId))
    .limit(1);
  if (row.length === 0 || row[0].employerId !== userId) return null;
  return row[0];
}

function baseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL || "https://talenthub.com";
}

export async function createScheduleAction(
  _prev: ScheduleActionState | undefined,
  formData: FormData
): Promise<ScheduleActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const parsed = createSchema.safeParse({
    applicationId: formData.get("applicationId"),
    scheduledAt: formData.get("scheduledAt"),
    durationMinutes: formData.get("durationMinutes"),
    type: formData.get("type"),
    location: formData.get("location") || undefined,
    meetingUrl: formData.get("meetingUrl") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { error: "Invalid input" };

  const owned = await requireEmployerOwnsApplication(
    user.id,
    parsed.data.applicationId
  );
  if (!owned) return { error: "Unauthorized" };

  const scheduledAt = new Date(parsed.data.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime()))
    return { error: "Invalid date" };

  const [row] = await db
    .insert(interviewSchedules)
    .values({
      applicationId: parsed.data.applicationId,
      employerId: user.id,
      candidateId: owned.candidateId,
      scheduledAt,
      durationMinutes: parsed.data.durationMinutes,
      type: parsed.data.type,
      location: parsed.data.location ?? null,
      meetingUrl: parsed.data.meetingUrl ?? null,
      notes: parsed.data.notes ?? null,
    })
    .returning({ id: interviewSchedules.id });

  // Move application to "interview" stage
  await db
    .update(applications)
    .set({ status: "interview", updatedAt: new Date() })
    .where(eq(applications.id, parsed.data.applicationId));

  // Notify candidate + email
  const candidateRecord = await db.query.profiles.findFirst({
    where: (p, { eq }) => eq(p.id, owned.candidateId),
  });
  const employerRecord = await db.query.profiles.findFirst({
    where: (p, { eq }) => eq(p.id, user.id),
    with: { employerProfile: true },
  });
  const companyName =
    employerRecord?.employerProfile?.companyName ??
    employerRecord?.fullName ??
    "TalentHub";

  await createNotification({
    userId: owned.candidateId,
    type: "interview_requested",
    title: "Interview scheduled",
    message: `${companyName} scheduled an interview for ${owned.jobTitle}.`,
    relatedUrl: `/dashboard/interviews`,
  });

  if (candidateRecord?.email) {
    sendEmail({
      to: candidateRecord.email,
      subject: `Interview scheduled — ${owned.jobTitle}`,
      html: interviewScheduledEmail({
        jobTitle: owned.jobTitle,
        companyName,
        scheduledAt,
        durationMinutes: parsed.data.durationMinutes,
        type: parsed.data.type,
        meetingUrl: parsed.data.meetingUrl ?? null,
        location: parsed.data.location ?? null,
        notes: parsed.data.notes ?? null,
        dashboardUrl: `${baseUrl()}/dashboard/interviews`,
        action: "scheduled",
      }),
    }).catch(() => {});
  }

  revalidatePath("/dashboard/interviews");
  revalidatePath("/dashboard/candidates");
  return { success: true, scheduleId: row.id };
}

const updateSchema = createSchema.omit({ applicationId: true });

export async function updateScheduleAction(
  scheduleId: string,
  _prev: ScheduleActionState | undefined,
  formData: FormData
): Promise<ScheduleActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const existing = await db.query.interviewSchedules.findFirst({
    where: and(
      eq(interviewSchedules.id, scheduleId),
      eq(interviewSchedules.employerId, user.id)
    ),
  });
  if (!existing) return { error: "Unauthorized" };

  const parsed = updateSchema.safeParse({
    scheduledAt: formData.get("scheduledAt"),
    durationMinutes: formData.get("durationMinutes"),
    type: formData.get("type"),
    location: formData.get("location") || undefined,
    meetingUrl: formData.get("meetingUrl") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { error: "Invalid input" };

  const scheduledAt = new Date(parsed.data.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime()))
    return { error: "Invalid date" };

  await db
    .update(interviewSchedules)
    .set({
      scheduledAt,
      durationMinutes: parsed.data.durationMinutes,
      type: parsed.data.type,
      location: parsed.data.location ?? null,
      meetingUrl: parsed.data.meetingUrl ?? null,
      notes: parsed.data.notes ?? null,
      status: "rescheduled",
      updatedAt: new Date(),
    })
    .where(eq(interviewSchedules.id, scheduleId));

  // Notify + email
  const app = await db
    .select({ jobTitle: jobs.title })
    .from(applications)
    .innerJoin(jobs, eq(jobs.id, applications.jobId))
    .where(eq(applications.id, existing.applicationId))
    .limit(1);
  const jobTitle = app[0]?.jobTitle ?? "your interview";

  const employerRecord = await db.query.profiles.findFirst({
    where: (p, { eq }) => eq(p.id, user.id),
    with: { employerProfile: true },
  });
  const companyName =
    employerRecord?.employerProfile?.companyName ??
    employerRecord?.fullName ??
    "TalentHub";

  const candidateRecord = await db.query.profiles.findFirst({
    where: (p, { eq }) => eq(p.id, existing.candidateId),
  });

  await createNotification({
    userId: existing.candidateId,
    type: "interview_requested",
    title: "Interview rescheduled",
    message: `${companyName} rescheduled the interview for ${jobTitle}.`,
    relatedUrl: `/dashboard/interviews`,
  });

  if (candidateRecord?.email) {
    sendEmail({
      to: candidateRecord.email,
      subject: `Interview rescheduled — ${jobTitle}`,
      html: interviewScheduledEmail({
        jobTitle,
        companyName,
        scheduledAt,
        durationMinutes: parsed.data.durationMinutes,
        type: parsed.data.type,
        meetingUrl: parsed.data.meetingUrl ?? null,
        location: parsed.data.location ?? null,
        notes: parsed.data.notes ?? null,
        dashboardUrl: `${baseUrl()}/dashboard/interviews`,
        action: "rescheduled",
      }),
    }).catch(() => {});
  }

  revalidatePath("/dashboard/interviews");
  return { success: true };
}

export async function cancelScheduleAction(
  scheduleId: string
): Promise<ScheduleActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const existing = await db.query.interviewSchedules.findFirst({
    where: and(
      eq(interviewSchedules.id, scheduleId),
      eq(interviewSchedules.employerId, user.id)
    ),
  });
  if (!existing) return { error: "Unauthorized" };

  await db
    .update(interviewSchedules)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(interviewSchedules.id, scheduleId));

  const app = await db
    .select({ jobTitle: jobs.title })
    .from(applications)
    .innerJoin(jobs, eq(jobs.id, applications.jobId))
    .where(eq(applications.id, existing.applicationId))
    .limit(1);
  const jobTitle = app[0]?.jobTitle ?? "your interview";

  const employerRecord = await db.query.profiles.findFirst({
    where: (p, { eq }) => eq(p.id, user.id),
    with: { employerProfile: true },
  });
  const companyName =
    employerRecord?.employerProfile?.companyName ??
    employerRecord?.fullName ??
    "TalentHub";

  const candidateRecord = await db.query.profiles.findFirst({
    where: (p, { eq }) => eq(p.id, existing.candidateId),
  });

  await createNotification({
    userId: existing.candidateId,
    type: "interview_requested",
    title: "Interview cancelled",
    message: `${companyName} cancelled the interview for ${jobTitle}.`,
    relatedUrl: `/dashboard/interviews`,
  });

  if (candidateRecord?.email) {
    sendEmail({
      to: candidateRecord.email,
      subject: `Interview cancelled — ${jobTitle}`,
      html: interviewScheduledEmail({
        jobTitle,
        companyName,
        scheduledAt: existing.scheduledAt,
        durationMinutes: existing.durationMinutes,
        type: existing.type,
        meetingUrl: existing.meetingUrl,
        location: existing.location,
        notes: existing.notes,
        dashboardUrl: `${baseUrl()}/dashboard/interviews`,
        action: "cancelled",
      }),
    }).catch(() => {});
  }

  revalidatePath("/dashboard/interviews");
  return { success: true };
}

export async function completeScheduleAction(
  scheduleId: string
): Promise<ScheduleActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const existing = await db.query.interviewSchedules.findFirst({
    where: and(
      eq(interviewSchedules.id, scheduleId),
      eq(interviewSchedules.employerId, user.id)
    ),
  });
  if (!existing) return { error: "Unauthorized" };

  await db
    .update(interviewSchedules)
    .set({ status: "completed", updatedAt: new Date() })
    .where(eq(interviewSchedules.id, scheduleId));

  revalidatePath("/dashboard/interviews");
  return { success: true };
}
