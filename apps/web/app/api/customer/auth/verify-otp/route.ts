import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { JWT_ROLES, JWT_COOKIE_NAMES } from "@lenstrack/config";
import { successResponse, validationErrorResponse, errorResponse } from "@/lib/api-response";

const schema = z.object({
  mobile: z.string().length(10),
  otp: z.string().length(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as unknown;
    const parsed = schema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error.errors[0].message);

    const { mobile, otp } = parsed.data;

    // Find the most recent unused OTP
    const record = await prisma.otpRecord.findFirst({
      where: { mobile, otp, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return errorResponse("Invalid or expired OTP", "OTP_INVALID", 400);
    }

    // Mark OTP as used
    await prisma.otpRecord.update({ where: { id: record.id }, data: { used: true } });

    // Find or create customer
    let customer = await prisma.customer.findUnique({ where: { mobile } });
    if (!customer) {
      customer = await prisma.customer.create({ data: { mobile } });
    }

    const expiresIn = process.env.CUSTOMER_JWT_EXPIRES || "24h";
    const token = signToken(
      { sub: customer.id, mobile: customer.mobile, role: JWT_ROLES.customer },
      expiresIn
    );

    const res = successResponse({ customer: { id: customer.id, mobile: customer.mobile } });

    res.cookies.set(JWT_COOKIE_NAMES.customer, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return res;
  } catch (err) {
    console.error("[Verify OTP]", err);
    return errorResponse("Failed to verify OTP", "INTERNAL_ERROR", 500);
  }
}
