import type { NextRequest } from "next/server";

/** Public site origin (correct behind reverse proxies / Vercel). */
export function publicOriginFromRequest(req: NextRequest): string {
  const host = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const proto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (host) {
    return `${proto || "https"}://${host}`;
  }
  return req.nextUrl.origin;
}
