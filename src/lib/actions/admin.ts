"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { jobs, profiles } from "@/db/schema";
import { isAdmin } from "@/lib/dal/admin";

export type AdminActionState = { error?: string; success?: boolean };

async function requireAdmin(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const ok = await isAdmin(user.id);
  return ok ? user.id : null;
}

export async function setUserSuspendedAction(
  userId: string,
  suspended: boolean
): Promise<AdminActionState> {
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Unauthorized" };
  if (userId === adminId)
    return { error: "You cannot suspend your own account." };

  await db
    .update(profiles)
    .set({ suspended, updatedAt: new Date() })
    .where(eq(profiles.id, userId));

  revalidatePath("/admin/users");
  return { success: true };
}

export async function adminUnpublishJobAction(
  jobId: string
): Promise<AdminActionState> {
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Unauthorized" };

  await db
    .update(jobs)
    .set({ status: "closed", updatedAt: new Date() })
    .where(eq(jobs.id, jobId));

  revalidatePath("/admin/jobs");
  return { success: true };
}

export async function adminDeleteJobAction(
  jobId: string
): Promise<AdminActionState> {
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Unauthorized" };

  await db.delete(jobs).where(eq(jobs.id, jobId));

  revalidatePath("/admin/jobs");
  return { success: true };
}

export async function promoteToAdminAction(
  userId: string
): Promise<AdminActionState> {
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Unauthorized" };

  await db
    .update(profiles)
    .set({ role: "admin", updatedAt: new Date() })
    .where(eq(profiles.id, userId));

  revalidatePath("/admin/users");
  return { success: true };
}
