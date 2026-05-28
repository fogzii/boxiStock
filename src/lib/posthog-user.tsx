"use client";

import posthog from "posthog-js";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function PostHogUserIdentifier() {
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        posthog.identify(user.id, {
          email: user.email,
          name: user.user_metadata?.full_name,
        });
      }
    });
  }, []);

  return null;
}
