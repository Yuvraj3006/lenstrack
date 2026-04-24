import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { signToken, signRefreshToken } from "@/lib/auth";
import { JWT_ROLES, JWT_COOKIE_NAMES } from "@lenstrack/config";
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as unknown;
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error.errors[0].message);

    const { email, password } = parsed.data;
    const user = await prisma.storeUser.findUnique({ where: { email }, include: { store: true } });

    if (!user || !user.isActive) {
      return errorResponse("Invalid credentials", "INVALID_CREDENTIALS", 401);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return errorResponse("Invalid credentials", "INVALID_CREDENTIALS", 401);
    }

    const expiresIn = process.env.STORE_JWT_EXPIRES || "8h";
    const token = signToken(
      { sub: user.id, email: user.email, name: user.name, storeId: user.storeId, role: JWT_ROLES.store },
      expiresIn
    );
    const refreshToken = signRefreshToken({ sub: user.id, role: JWT_ROLES.store }, "7d");

    const res = successResponse({
      user: { id: user.id, email: user.email, name: user.name, storeId: user.storeId, store: user.store },
    });

    res.cookies.set(JWT_COOKIE_NAMES.store, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    res.cookies.set(`${JWT_COOKIE_NAMES.store}_refresh`, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return res;
  } catch (err) {
    console.error("[Store Login]", err);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}
