/** @type {import('next').NextConfig} */

// Security headers applied to every route.
// CSP notes:
// - Google Fonts serves CSS from fonts.googleapis.com and woff2 from fonts.gstatic.com.
// - Supabase REST/Realtime calls go to your project subdomain of supabase.co.
// - Anthropic API calls go to api.anthropic.com from the server,
//   so they don't need to be in the browser CSP.
// - PostHog events and JS assets (web-vitals, toolbar, surveys, etc.) go through
//   the managed reverse proxy at check.boxistock.au — needs both script-src and connect-src.
const isDev = process.env.NODE_ENV === "development";
const isPreview = process.env.VERCEL_ENV === "preview";

const ContentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https://lh3.googleusercontent.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // React dev mode requires 'unsafe-eval' for call stack reconstruction
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}${isPreview ? " https://vercel.live https://vercel.com" : ""} https://challenges.cloudflare.com https://check.boxistock.au`,
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com https://check.boxistock.au${isPreview ? " https://vercel.live wss://ws-us3.pusher.com https://*.pusher.com" : ""}`,
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
