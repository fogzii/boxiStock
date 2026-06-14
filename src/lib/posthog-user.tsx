"use client";

import posthog from "posthog-js";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function PostHogUserIdentifier() {
  useEffect(() => {
    const supabase = createClient();
    // getClaims() verifies the session JWT locally — no network round trip to
    // the Supabase Auth server on every shell mount (unlike getUser()).
    supabase.auth.getClaims().then(({ data, error }) => {
      const claims = data?.claims;
      if (error || !claims?.sub) return;
      posthog.identify(claims.sub, {
        email: claims.email,
        name: (claims.user_metadata as Record<string, unknown> | undefined)
          ?.full_name,
      });
    });
  }, []);

  return null;
}
