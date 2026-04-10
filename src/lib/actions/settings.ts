"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function updateNameAction(
  fullName: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  if (!fullName || fullName.trim().length < 2) {
    return { error: "Name must be at least 2 characters" };
  }

  await db
    .update(profiles)
    .set({ fullName: fullName.trim(), updatedAt: new Date() })
    .where(eq(profiles.id, user.id));

  revalidatePath("/dashboard");
  return { success: true };
}

export async function changePasswordAction(
  currentPassword: string,
  newPassword: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return { error: "Unauthorized" };

  if (newPassword.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  // Verify current password by attempting sign-in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (signInError) return { error: "Current password is incorrect" };

  // Update password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (updateError) return { error: updateError.message };

  return { success: true };
}

export async function deleteAccountAction(): Promise<{
  error?: string;
  success?: boolean;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Delete the profile (cascades to candidate/employer profiles, applications, etc.)
  await db.delete(profiles).where(eq(profiles.id, user.id));

  // Sign out
  await supabase.auth.signOut();
  redirect("/login");
}

export async function forgotPasswordAction(
  email: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/auth/callback?next=/reset-password`,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function resetPasswordAction(
  newPassword: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();

  if (newPassword.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) return { error: error.message };
  return { success: true };
}
