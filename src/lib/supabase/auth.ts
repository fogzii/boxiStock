import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { cache } from "react";
import { supabaseAnonKey, supabaseUrl } from "./env";

/**
 * Resolves the authenticated user for the current request.
 *
 * Uses `auth.getClaims()`, which verifies the access-token JWT *locally* against
 * the project's asymmetric (ES256) signing keys. The JWKS is fetched once per
 * warm function instance and cached, so steady-state verification makes NO
 * network round-trip to the Supabase Auth server. This replaces the previous
 * `auth.getUser()` call, which hit `/auth/v1/user` on every render and every
 * server action — a cross-region round-trip to Supabase (Tokyo) each time.
 *
 * Wrapped in React `cache()` so repeated calls within a single request — e.g.
 * the protected layout plus several server actions on the same page — are
 * deduplicated into a single verification.
 *
 * Returns the same `{ data: { user } }` shape as the old helper so all call
 * sites stay unchanged. The JWT carries `sub`, `email`, and `user_metadata`,
 * which are the only fields the app reads; remaining `User` fields are filled
 * best-effort from the claims.
 */
export const getAuthUser = cache(
  async (): Promise<{ data: { user: User | null } }> => {
    const cookieStore = await cookies();
    const client = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    });

    const { data, error } = await client.auth.getClaims();
    if (error || !data?.claims) {
      return { data: { user: null } };
    }

    const claims = data.claims;
    // Map JWT claims onto the supabase-js `User` shape. Only id/email/
    // user_metadata are consumed by the app; the rest are populated
    // best-effort from the token.
    const user = {
      id: claims.sub,
      email: claims.email,
      phone: claims.phone ?? "",
      aud: claims.aud,
      role: claims.role,
      app_metadata: claims.app_metadata ?? {},
      user_metadata: claims.user_metadata ?? {},
      created_at: "",
      is_anonymous: claims.is_anonymous ?? false,
    } as unknown as User;

    return { data: { user } };
  },
);
