import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import type { Database } from "./database.types";
import { fetchWithJwtClockRetry } from "./jwt-clock";

/**
 * Server-only Supabase client.
 *
 * Uses a Supabase Secret API key (prefixed `sb_secret_`), which bypasses
 * Row Level Security. This is safe because every server action
 * authenticates the caller via Supabase Auth and scopes queries by
 * `userId` before hitting the DB.
 *
 * Never import this file from client components. The secret key is
 * server-only - it must NOT be prefixed with NEXT_PUBLIC_ and must never
 * be sent to the browser. If it leaks, rotate it in the Supabase
 * dashboard (Project Settings -> API Keys -> Secret keys).
 */
function createSecretClient(
  url: string,
  secretKey: string,
  forwardedFor?: string | null,
) {
  return createSupabaseClient<Database>(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    // Pin Authorization to the secret key so a user session JWT cannot
    // ride along on this client. Combined with apikey, this is how
    // supabase-js sends `sb_secret_` keys to PostgREST.
    accessToken: async () => secretKey,
    global: {
      fetch: fetchWithJwtClockRetry,
      headers: forwardedFor ? { "sb-forwarded-for": forwardedFor } : undefined,
    },
  });
}

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error(
      "Supabase server client is misconfigured: missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY.",
    );
  }

  // Forwards the real end-user IP so Supabase Auth's rate limiting keys off
  // the caller rather than Vercel's shared egress IP. Requires "Enable IP
  // address forwarding" under Auth > Rate Limits in the Supabase dashboard.
  const forwardedFor = (await headers()).get("x-forwarded-for");

  return createSecretClient(url, secretKey, forwardedFor);
}

/**
 * Supabase client for use inside `unstable_cache()`-wrapped functions, where
 * Next.js forbids calling `headers()`/`cookies()` (dynamic data sources
 * can't be read inside a cache scope). Skips the x-forwarded-for forwarding
 * that `createClient()` does: that header only affects Supabase Auth's IP
 * rate limiting, and cached readers never call Auth endpoints, only
 * RPC/select reads via the secret key.
 */
export async function createCachedClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error(
      "Supabase server client is misconfigured: missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY.",
    );
  }

  return createSecretClient(url, secretKey);
}
