"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { savedJobs } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function toggleSaveJobAction(
  jobId: string
): Promise<{ saved: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { saved: false, error: "Unauthorized" };

  const existing = await db.query.savedJobs.findFirst({
    where: and(
      eq(savedJobs.candidateId, user.id),
      eq(savedJobs.jobId, jobId)
    ),
  });

  if (existing) {
    await db.delete(savedJobs).where(eq(savedJobs.id, existing.id));
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/jobs");
    return { saved: false };
  }

  await db.insert(savedJobs).values({
    candidateId: user.id,
    jobId,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/jobs");
  return { saved: true };
}
