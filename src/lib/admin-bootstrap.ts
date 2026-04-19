import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";

/**
 * Env-var driven admin bootstrap. Set `ADMIN_EMAILS` in your env to a
 * comma-separated list of email addresses that should automatically be
 * promoted to admin the next time they authenticate.
 *
 * Called from login + OAuth callback. Idempotent, cheap — a no-op when
 * the list is empty or the user's email isn't on it.
 */
export function getAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

export async function ensureAdminFromEnv(
  userId: string,
  email: string | null | undefined
): Promise<void> {
  if (!email) return;
  const allowed = getAdminEmails();
  if (allowed.size === 0) return;
  if (!allowed.has(email.toLowerCase())) return;

  try {
    await db
      .update(profiles)
      .set({ role: "admin", updatedAt: new Date() })
      .where(and(eq(profiles.id, userId), ne(profiles.role, "admin")));
  } catch {
    // Best-effort — never block the auth flow.
  }
}
