/** @type {import('next').NextConfig} */

// Security headers applied to every route.
// CSP notes:
// - Google Fonts serves CSS from fonts.googleapis.com and woff2 from fonts.gstatic.com.
// - Supabase REST/Realtime calls go to your project subdomain of supabase.co.
// - Anthropic API calls go to api.anthropic.com from the server,
//   so they don't need to be in the browser CSP.
// - PostHog events and JS assets (web-vitals, toolbar, surveys, etc.) go through
//   the managed reverse proxy at check.boxistock.au — needs both script-src and connect-src.
// - The PostHog Toolbar (launched from the PostHog app for staff debugging,
//   not something end users trigger) bypasses that proxy and loads its own
//   JS/CSS and posts its own analytics straight from PostHog's cloud domains
//   (*.posthog.com), so those need to be allowed too.
const isDev = process.env.NODE_ENV === "development";
const isPreview = process.env.VERCEL_ENV === "preview";

const ContentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https://lh3.googleusercontent.com https://*.posthog.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.posthog.com",
  // React dev mode requires 'unsafe-eval' for call stack reconstruction
  // Vercel Speed Insights serves a first-party script (/_vercel/speed-insights)
  // in production, but a debug build from va.vercel-scripts.com in dev only.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval' https://va.vercel-scripts.com" : ""}${isPreview ? " https://vercel.live https://vercel.com" : ""} https://challenges.cloudflare.com https://check.boxistock.au https://*.posthog.com`,
  // Local `supabase start` serves the API on 127.0.0.1:54321 (and localhost).
  // Without these, the browser CSP blocks auth/data calls and surfaces as
  // TypeError: Failed to fetch on sign-in.
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com https://check.boxistock.au https://*.posthog.com${isDev ? " http://127.0.0.1:54321 http://localhost:54321 ws://127.0.0.1:54321 ws://localhost:54321" : ""}${isPreview ? " https://vercel.live wss://ws-us3.pusher.com https://*.pusher.com" : ""}`,
  "worker-src 'self' blob:",
  "frame-src 'self' https://challenges.cloudflare.com",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: ContentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig = {
  poweredByHeader: false,
  skipTrailingSlashRedirect: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
