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
 * Values in `env` are inlined at **build** time (client + server).
 * Only **NEXT_PUBLIC_*** belongs here — never add secrets (DB/JWT/Redis/SMS keys).
 *
 * Every listed `NEXT_PUBLIC_*` key is always set to a string (`""` if unset) so
 * `process.env.*` is never `undefined` after build.
 */
function buildTimePublicEnv() {
  const base =
    normalizeOrigin(process.env.NEXT_PUBLIC_BASE_URL) ||
    normalizeOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
    normalizeOrigin(process.env.VERCEL_URL) ||
    "http://localhost:3000";

  const firebaseKeys = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
  ];

  const env = { NEXT_PUBLIC_BASE_URL: base };
  for (const k of firebaseKeys) {
    env[k] = process.env[k] ?? "";
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
