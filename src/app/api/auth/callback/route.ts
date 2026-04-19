import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureAdminFromEnv } from "@/lib/admin-bootstrap";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/ar/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (data.user) {
        await ensureAdminFromEnv(data.user.id, data.user.email);
      }
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(new URL("/ar/login?error=auth_failed", origin));
}
