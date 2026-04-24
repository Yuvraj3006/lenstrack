import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { sendOtp } from "@/lib/sms";
import { successResponse, validationErrorResponse, errorResponse } from "@/lib/api-response";

const schema = z.object({ mobile: z.string().length(10, "Mobile must be 10 digits") });

const OTP_TTL = parseInt(process.env.OTP_TTL_SECONDS || "300");
const RATE_LIMIT_MAX = parseInt(process.env.OTP_RATE_LIMIT_MAX || "5");
const RATE_WINDOW = parseInt(process.env.OTP_RATE_LIMIT_WINDOW_SECONDS || "900");

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as unknown;
    const parsed = schema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error.errors[0].message);

    const { mobile } = parsed.data;

    // Rate limiting
    const rateLimitKey = `otp_rate:${mobile}`;
    const current = await redis.incr(rateLimitKey);
    if (current === 1) await redis.expire(rateLimitKey, RATE_WINDOW);
    if (current > RATE_LIMIT_MAX) {
      return errorResponse(
        `Too many OTP requests. Try again in ${Math.ceil(RATE_WINDOW / 60)} minutes.`,
        "OTP_RATE_LIMITED",
        429
      );
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL * 1000);

    await prisma.otpRecord.create({ data: { mobile, otp, expiresAt } });
    await sendOtp(mobile, otp);

    const isDev = process.env.NODE_ENV === "development";
    return successResponse({
      message: "OTP sent successfully",
      expiresIn: OTP_TTL,
      ...(isDev ? { devOtp: otp } : {}),
    });
  } catch (err) {
    console.error("[Send OTP]", err);
    return errorResponse("Failed to send OTP", "INTERNAL_ERROR", 500);
  }
}
