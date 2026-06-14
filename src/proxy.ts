import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { supabaseAnonKey, supabaseUrl } from "./lib/supabase/env";

// Routes reachable without a session. "/" must be exact-matched (every path
// starts with "/"); the rest are prefix-matched against their own segment
// boundary. "/ingest" is the PostHog reverse proxy (middleware runs before
// next.config rewrites, so logged-out pages still need it).
const PUBLIC_EXACT = ["/"];
const PUBLIC_PREFIXES = [
  "/auth/callback",
  "/auth/confirm",
  "/contact",
  "/forgot-password",
  "/ingest",
  "/privacy",
  "/reset-password",
  "/share",
  "/sign-in",
  "/sign-up",
  "/terms",
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = isPublicPath(pathname);

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        supabaseResponse = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          supabaseResponse.cookies.set(name, value, options);
        }
      },
    },
  });

  // Verify the access-token JWT locally (cached JWKS) instead of calling the
  // Supabase Auth server on every request — see src/lib/supabase/auth.ts.
  // This still triggers a token refresh (written back via setAll) when the
  // access token has expired.
  let isAuthenticated = false;
  try {
    const { data, error } = await supabase.auth.getClaims();
    isAuthenticated = !error && Boolean(data?.claims);
  } catch {
    // Network failure (e.g. the one-time JWKS fetch on a flaky connection).
    // Fail open rather than 500 every route: ProtectedShell and all server
    // actions re-verify auth themselves, so this gate is defense-in-depth.
    return supabaseResponse;
  }

  if (!isPublic && !isAuthenticated) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
