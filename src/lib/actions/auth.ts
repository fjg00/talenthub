"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod/v4";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { ensureAdminFromEnv } from "@/lib/admin-bootstrap";

export type AuthState = {
  error?: string;
  success?: boolean;
};

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

const signupSchema = z.object({
  fullName: z.string().min(2),
  email: z.email(),
  password: z.string().min(6),
  role: z.enum(["candidate", "employer"]),
  companyName: z.string().optional(),
});

export async function loginAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "validationError" };
  }

  // Rate limit by email+ip to slow down credential stuffing
  const ip = getClientIp(await headers());
  const rl = await checkRateLimit("login", `${parsed.data.email}:${ip}`);
  if (!rl.allowed) return { error: "tooManyAttempts" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: "invalidCredentials" };
  }

  // Promote to admin if their email is on the ADMIN_EMAILS allowlist.
  if (data.user) {
    await ensureAdminFromEnv(data.user.id, data.user.email);
  }

  redirect("/dashboard");
}

export async function signupAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = signupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    companyName: formData.get("companyName") ?? undefined,
  });

  if (!parsed.success) {
    return { error: "validationError" };
  }

  // Rate limit signups per IP
  const ip = getClientIp(await headers());
  const rl = await checkRateLimit("signup", ip);
  if (!rl.allowed) return { error: "tooManyAttempts" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        role: parsed.data.role,
        company_name: parsed.data.companyName || null,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/confirm`,
    },
  });

  if (error) {
    return { error: "signupFailed" };
  }

  return { success: true };
}

export async function oauthAction(provider: "google" | "linkedin_oidc") {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
    },
  });

  if (error || !data.url) {
    redirect("/login?error=oauthFailed");
  }

  redirect(data.url);
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
