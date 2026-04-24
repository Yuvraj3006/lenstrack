import { NextResponse } from "next/server";
import { JWT_COOKIE_NAMES } from "@lenstrack/config";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete(JWT_COOKIE_NAMES.customer);
  return res;
}
