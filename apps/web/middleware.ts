import { NextRequest, NextResponse } from "next/server";
import { JWT_COOKIE_NAMES, JWT_ROLES } from "@lenstrack/config";

// Lightweight JWT payload decoder (no verification — verification happens in API routes)
function decodeJwtPayload(token: string): { role?: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const padded = payload + "=".repeat((4 - payload.length % 4) % 4);
    const decoded = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded) as { role?: string };
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin portal routes (page-level guard)
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const token = req.cookies.get(JWT_COOKIE_NAMES.admin)?.value;
    if (!token) return NextResponse.redirect(new URL("/admin/login", req.url));
    const payload = decodeJwtPayload(token);
    if (!payload || payload.role !== JWT_ROLES.admin) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  // Store portal routes
  if (pathname.startsWith("/store") && !pathname.startsWith("/store/login")) {
    const token = req.cookies.get(JWT_COOKIE_NAMES.store)?.value;
    if (!token) return NextResponse.redirect(new URL("/store/login", req.url));
    const payload = decodeJwtPayload(token);
    if (!payload || payload.role !== JWT_ROLES.store) {
      return NextResponse.redirect(new URL("/store/login", req.url));
    }
  }

  // Customer account routes
  if (pathname.startsWith("/account")) {
    const token = req.cookies.get(JWT_COOKIE_NAMES.customer)?.value;
    if (!token) return NextResponse.redirect(new URL("/verify", req.url));
    const payload = decodeJwtPayload(token);
    if (!payload || payload.role !== JWT_ROLES.customer) {
      return NextResponse.redirect(new URL("/verify", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/store/:path*",
    "/account/:path*",
  ],
};
