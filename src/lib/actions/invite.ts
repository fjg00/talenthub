"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createNotification } from "@/lib/dal/notifications";

export async function inviteToApplyAction(
  jobId: string,
  candidateId: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Verify employer owns the job
  const job = await db.query.jobs.findFirst({
    where: and(eq(jobs.id, jobId), eq(jobs.employerId, user.id)),
  });
  if (!job) return { error: "Unauthorized" };

  await createNotification({
    userId: candidateId,
    type: "invite_to_apply",
    title: "You've Been Invited to Apply!",
    message: `An employer invited you to apply for ${job.title}`,
    relatedUrl: `/dashboard/jobs/${jobId}`,
  });

  return { success: true };
}
