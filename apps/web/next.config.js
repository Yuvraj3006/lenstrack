/** @type {import('next').NextConfig} */

/** Public origin without trailing slash (for links / QR helpers). */
function normalizeOrigin(value) {
  if (!value || typeof value !== "string") return "";
  const u = value.trim().replace(/\/$/, "");
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return `https://${u}`;
}

/**
 * Values in `env` are inlined at **build** time into client + server bundles.
 * Order: explicit NEXT_PUBLIC_BASE_URL → Vercel production host → this deployment → local dev.
 */
function buildTimePublicEnv() {
  const base =
    normalizeOrigin(process.env.NEXT_PUBLIC_BASE_URL) ||
    normalizeOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
    normalizeOrigin(process.env.VERCEL_URL) ||
    "http://localhost:3000";

  const env = { NEXT_PUBLIC_BASE_URL: base };

  const firebaseKeys = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
  ];
  for (const k of firebaseKeys) {
    if (process.env[k]) env[k] = process.env[k];
  }

  return env;
}

const nextConfig = {
  env: buildTimePublicEnv(),
  transpilePackages: ["@lenstrack/ui", "@lenstrack/config"],
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "prisma", "bcryptjs", "puppeteer"],
  },
};

module.exports = nextConfig;
