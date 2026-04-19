"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { applications, applicationStatusHistory, jobs, profiles, interviews } from "@/db/schema";
import { eq, and, inArray, ne } from "drizzle-orm";
import { createNotification } from "@/lib/dal/notifications";
import { sendEmail } from "@/lib/email";
import { statusChangeEmail, hiredEmail } from "@/lib/email-templates";
import { generateInterviewQuestions } from "@/lib/ai/interview";
import { employerProfiles } from "@/db/schema";

export type BulkActionState = {
  error?: string;
  success?: boolean;
  count?: number;
};

const bulkStatusSchema = z.object({
  applicationIds: z.array(z.string().uuid()).min(1).max(100),
  status: z.enum([
    "reviewed",
    "shortlisted",
    "interview",
    "offered",
    "rejected",
  ]),
});

export async function bulkUpdateStatusAction(
  applicationIds: string[],
  newStatus: string
): Promise<BulkActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const parsed = bulkStatusSchema.safeParse({
    applicationIds,
    status: newStatus,
  });
  if (!parsed.success) return { error: "validationError" };

  // Fetch all applications and verify ownership
  const apps = await db.query.applications.findMany({
    where: inArray(applications.id, parsed.data.applicationIds),
    with: { job: true },
  });

  // Verify every application belongs to this employer's jobs
  const unauthorized = apps.filter((a) => a.job.employerId !== user.id);
  if (unauthorized.length > 0) {
    return { error: "Unauthorized" };
  }

  if (apps.length === 0) return { error: "noApplicationsFound" };

  // Filter out apps already in the target status
  const toUpdate = apps.filter((a) => a.status !== parsed.data.status);
  if (toUpdate.length === 0) return { success: true, count: 0 };

  const ids = toUpdate.map((a) => a.id);

  // Batch update
  await db
    .update(applications)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(inArray(applications.id, ids));

  // Record timeline entries for each update
  await db
    .insert(applicationStatusHistory)
    .values(
      ids.map((id) => ({
        applicationId: id,
        status: parsed.data.status,
        changedBy: user.id,
      }))
    )
    .catch(() => {});

  // If status is "interview", create interviews for each candidate
  if (parsed.data.status === "interview") {
    for (const app of toUpdate) {
      const existing = await db.query.interviews.findFirst({
        where: and(
          eq(interviews.jobId, app.jobId),
          eq(interviews.candidateId, app.candidateId)
        ),
      });
      if (!existing) {
        try {
          const questions = await generateInterviewQuestions({
            title: app.job.title,
            description: app.job.description,
            skills: app.job.skills as string[] | null,
            experienceLevel: app.job.experienceLevel,
          });
          await db.insert(interviews).values({
            jobId: app.jobId,
            candidateId: app.candidateId,
            questions,
            status: "pending",
          });
        } catch {
          // Continue with others if one fails
        }
      }
    }
  }

  // Notify and email candidates (fire-and-forget)
  const statusLabels: Record<string, string> = {
    reviewed: "Application Reviewed",
    shortlisted: "You've Been Shortlisted!",
    interview: "Interview Requested",
    offered: "You Received an Offer!",
    rejected: "Application Update",
  };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  for (const app of toUpdate) {
    const notifTitle = statusLabels[parsed.data.status];
    if (notifTitle) {
      const notifType =
        parsed.data.status === "interview"
          ? ("interview_requested" as const)
          : ("status_change" as const);

      createNotification({
        userId: app.candidateId,
        type: notifType,
        title: notifTitle,
        message: `Your application for ${app.job.title} has been updated`,
        relatedUrl: `/dashboard/applications`,
      }).catch(() => {});

      // Email candidate
      db.query.profiles
        .findFirst({ where: eq(profiles.id, app.candidateId) })
        .then((candidate) => {
          if (candidate?.email) {
            sendEmail({
              to: candidate.email,
              subject: `Application update: ${app.job.title}`,
              html: statusChangeEmail(
                app.job.title,
                parsed.data.status,
                `${siteUrl}/dashboard/applications`
              ),
            }).catch(() => {});
          }
        })
        .catch(() => {});
    }
  }

  // Collect unique job IDs to revalidate
  const jobIds = [...new Set(toUpdate.map((a) => a.jobId))];
  for (const jid of jobIds) {
    revalidatePath(`/dashboard/jobs/${jid}`);
  }
  revalidatePath("/dashboard/applications");
  revalidatePath("/dashboard/candidates");
  revalidatePath("/dashboard/interviews");

  return { success: true, count: toUpdate.length };
}

const bulkEmailSchema = z.object({
  applicationIds: z.array(z.string().uuid()).min(1).max(100),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
});

export async function bulkEmailAction(
  applicationIds: string[],
  subject: string,
  message: string
): Promise<BulkActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const parsed = bulkEmailSchema.safeParse({
    applicationIds,
    subject,
    message,
  });
  if (!parsed.success) return { error: "validationError" };

  // Fetch applications and verify ownership
  const apps = await db.query.applications.findMany({
    where: inArray(applications.id, parsed.data.applicationIds),
    with: { job: true },
  });

  const unauthorized = apps.filter((a) => a.job.employerId !== user.id);
  if (unauthorized.length > 0) return { error: "Unauthorized" };
  if (apps.length === 0) return { error: "noApplicationsFound" };

  // Get employer info for sender name
  const empProfile = await db.query.employerProfiles.findFirst({
    where: eq(employerProfiles.userId, user.id),
  });
  const senderName = empProfile?.companyName ?? "An employer";

  // Get candidate emails
  const candidateIds = [...new Set(apps.map((a) => a.candidateId))];
  const candidates = await db.query.profiles.findMany({
    where: inArray(profiles.id, candidateIds),
  });
  const emailMap = new Map(candidates.map((c) => [c.id, c.email]));

  let sent = 0;
  for (const app of apps) {
    const email = emailMap.get(app.candidateId);
    if (!email) continue;

    sendEmail({
      to: email,
      subject: parsed.data.subject,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="background: #f5f5f5; margin: 0; padding: 20px;">
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
            <div style="text-align: center; margin-bottom: 32px;">
              <span style="font-size: 24px; font-weight: 700; color: #7c3aed;">TalentHub</span>
            </div>
            <div style="background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e5e5e5;">
              <h2 style="margin: 0 0 16px; font-size: 20px;">Message from ${senderName}</h2>
              <p style="color: #555; line-height: 1.6;">
                Regarding your application for <strong>${app.job.title}</strong>:
              </p>
              <div style="color: #333; line-height: 1.6; font-size: 15px; white-space: pre-wrap;">${parsed.data.message}</div>
            </div>
            <p style="text-align: center; font-size: 12px; color: #999; margin-top: 24px;">
              You received this email because of your TalentHub account settings.
            </p>
          </div>
        </body>
        </html>
      `,
    }).catch(() => {});
    sent++;
  }

  return { success: true, count: sent };
}
