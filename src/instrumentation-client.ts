import posthog from "posthog-js";

// Single PostHog client init (Next.js instrumentation-client convention).
// Supports both env var names: NEXT_PUBLIC_POSTHOG_KEY (Vercel) and
// NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN (older local env files).
posthog.init(
  process.env.NEXT_PUBLIC_POSTHOG_KEY ??
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ??
    "",
  {
    api_host: "/ingest",
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.posthog.com",
    defaults: "2026-01-30",
    capture_exceptions: true,
    debug: process.env.NODE_ENV === "development",
  },
);
