import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/proxy";

const intlMiddleware = createMiddleware(routing);

const protectedPaths = ["/dashboard"];
const authPaths = ["/login", "/signup"];

function getPathnameWithoutLocale(pathname: string): string {
  const localePattern = /^\/(en|ar)(\/|$)/;
  return pathname.replace(localePattern, "/");
}

function getLocaleFromPathname(pathname: string): string {
  const match = pathname.match(/^\/(en|ar)(\/|$)/);
  return match ? match[1] : routing.defaultLocale;
}

export async function proxy(request: NextRequest) {
  // 1. Refresh Supabase session and get user
  const { user, supabaseResponse } = await updateSession(request);

  const pathname = request.nextUrl.pathname;
  const strippedPath = getPathnameWithoutLocale(pathname);
  const locale = getLocaleFromPathname(pathname);

  // 2. Protected routes: redirect to login if not authenticated
  const isProtected = protectedPaths.some(
    (path) => strippedPath === path || strippedPath.startsWith(path + "/")
  );

  if (isProtected && !user) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Auth pages: redirect to dashboard if already authenticated
  const isAuthPage = authPaths.some(
    (path) => strippedPath === path || strippedPath.startsWith(path + "/")
  );

  if (isAuthPage && user) {
    return NextResponse.redirect(
      new URL(`/${locale}/dashboard`, request.url)
    );
  }

  // 4. Run next-intl middleware for locale routing
  const intlResponse = intlMiddleware(request);

  // 5. Merge Supabase cookies into the intl response
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value);
  });

  return intlResponse;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
