import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { verifyFirebaseToken } from "@/lib/firebase-verify";
import { JWT_ROLES, JWT_COOKIE_NAMES } from "@lenstrack/config";
import {
  successResponse,
  validationErrorResponse,
  errorResponse,
} from "@/lib/api-response";

const schema = z.object({
  idToken: z.string().min(1, "ID token is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as unknown;
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.errors[0].message);
    }

    const { idToken } = parsed.data;

    // Verify the token against Firebase's public JWKS — no service account needed
    let phoneNumber: string | undefined;
    try {
      const payload = await verifyFirebaseToken(idToken);
      phoneNumber = payload.phone_number;
    } catch (err) {
      console.error("[Firebase JWKS verify]", err);
      return errorResponse("Invalid or expired Firebase token", "TOKEN_INVALID", 401);
    }

    if (!phoneNumber) {
      return errorResponse(
        "Phone number not found in token — make sure Phone Auth is enabled in Firebase Console.",
        "TOKEN_INVALID",
        401
      );
    }

    // Strip country code → keep last 10 digits (handles +91XXXXXXXXXX)
    const mobile = phoneNumber.replace(/\D/g, "").slice(-10);

    if (mobile.length !== 10) {
      return errorResponse("Could not extract a valid 10-digit mobile number.", "VALIDATION_ERROR", 400);
    }

    // Find or create the customer record
    let customer = await prisma.customer.findUnique({ where: { mobile } });
    if (!customer) {
      customer = await prisma.customer.create({ data: { mobile } });
    }

    // Issue our own app JWT
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
    console.error("[verify-firebase-token]", err);
    return errorResponse("Authentication failed", "INTERNAL_ERROR", 500);
  }
}
