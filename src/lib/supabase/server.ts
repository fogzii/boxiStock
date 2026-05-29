import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Server-only Supabase client.
 *
 * Uses a Supabase Secret API key (prefixed `sb_secret_`), which bypasses
 * Row Level Security. This is safe because every server action
 * authenticates the caller via Supabase Auth and scopes queries by
 * `userId` before hitting the DB.
 *
 * Never import this file from client components. The secret key is
 * server-only — it must NOT be prefixed with NEXT_PUBLIC_ and must never
 * be sent to the browser. If it leaks, rotate it in the Supabase
 * dashboard (Project Settings -> API Keys -> Secret keys).
 */
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error(
      "Supabase server client is misconfigured: missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY.",
    );
  }

  return createSupabaseClient<Database>(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
