import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { signToken, signRefreshToken } from "@/lib/auth";
import { JWT_ROLES, JWT_COOKIE_NAMES } from "@lenstrack/config";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from "@/lib/api-response";

const loginSchema = z.object({
  email: z
    .string()
    .email()
    .transform((s) => s.trim().toLowerCase()),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as unknown;
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.errors[0].message);
    }

    const { email, password } = parsed.data;
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      console.warn("[Admin Login] No admin row for email:", email);
      return errorResponse("Invalid credentials", "INVALID_CREDENTIALS", 401);
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      console.warn("[Admin Login] Password mismatch for:", email);
      return errorResponse("Invalid credentials", "INVALID_CREDENTIALS", 401);
    }

    const expiresIn = process.env.ADMIN_JWT_EXPIRES || "15m";
    const refreshExpiresIn = "7d";

    const token = signToken(
      { sub: admin.id, email: admin.email, name: admin.name, role: JWT_ROLES.admin },
      expiresIn
    );
    const refreshToken = signRefreshToken({ sub: admin.id, role: JWT_ROLES.admin }, refreshExpiresIn);

    const res = successResponse({ admin: { id: admin.id, email: admin.email, name: admin.name } });

    res.cookies.set(JWT_COOKIE_NAMES.admin, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    res.cookies.set(`${JWT_COOKIE_NAMES.admin}_refresh`, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return res;
  } catch (err) {
    console.error("[Admin Login]", err);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}
