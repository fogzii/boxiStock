// Ad blockers (EasyPrivacy, AdGuard) carry domain-agnostic path rules for
// `/posthog-recorder.js` and `/dead-clicks-autocapture.js`, so the reverse proxy
// at check.boxistock.au can't get them through - the filename is what's matched,
// not the host. These standalone bundles self-register on
// `window.__PosthogExtensions__` from our own first-party JS, and posthog-js uses
// an already-registered extension instead of fetching it. Keep them as static
// imports so registration is guaranteed to happen before init() below.
import "posthog-js/dist/posthog-recorder";
import "posthog-js/dist/dead-clicks-autocapture";
import posthog from "posthog-js";

// Single PostHog client init (Next.js instrumentation-client convention).
// Supports both env var names: NEXT_PUBLIC_POSTHOG_KEY (Vercel) and
// NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN (older local env files).
// Events go through the managed reverse proxy at check.boxistock.au.
posthog.init(
  process.env.NEXT_PUBLIC_POSTHOG_KEY ??
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ??
    "",
  {
    api_host:
      process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://check.boxistock.au",
    ui_host: "https://us.posthog.com",
    defaults: "2026-05-30",
    capture_exceptions: true,
    debug: process.env.NODE_ENV === "development",
  },
);
