import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { JWT_COOKIE_NAMES, JWT_ROLES } from "@lenstrack/config";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export interface AdminJwtPayload {
  sub: string;
  email: string;
  name: string;
  role: typeof JWT_ROLES.admin;
  iat: number;
  exp: number;
}

export interface StoreUserJwtPayload {
  sub: string;
  email: string;
  name: string;
  storeId: string;
  role: typeof JWT_ROLES.store;
  iat: number;
  exp: number;
}

export interface CustomerJwtPayload {
  sub: string;
  mobile: string;
  role: typeof JWT_ROLES.customer;
  iat: number;
  exp: number;
}

export type JwtPayload = AdminJwtPayload | StoreUserJwtPayload | CustomerJwtPayload;

export function signToken(payload: Record<string, unknown>, expiresIn: string): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

export function signRefreshToken(payload: { sub: string; role: string }, expiresIn: string): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): { sub: string; role: string } {
  return jwt.verify(token, JWT_REFRESH_SECRET) as { sub: string; role: string };
}

export function getAdminFromRequest(req: NextRequest): AdminJwtPayload | null {
  const token = req.cookies.get(JWT_COOKIE_NAMES.admin)?.value;
  if (!token) return null;
  try {
    const payload = verifyToken(token) as AdminJwtPayload;
    if (payload.role !== JWT_ROLES.admin) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getStoreUserFromRequest(req: NextRequest): StoreUserJwtPayload | null {
  const token = req.cookies.get(JWT_COOKIE_NAMES.store)?.value;
  if (!token) return null;
  try {
    const payload = verifyToken(token) as StoreUserJwtPayload;
    if (payload.role !== JWT_ROLES.store) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getCustomerFromRequest(req: NextRequest): CustomerJwtPayload | null {
  const token = req.cookies.get(JWT_COOKIE_NAMES.customer)?.value;
  if (!token) return null;
  try {
    const payload = verifyToken(token) as CustomerJwtPayload;
    if (payload.role !== JWT_ROLES.customer) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getAdminFromCookies(): AdminJwtPayload | null {
  const cookieStore = cookies();
  const token = cookieStore.get(JWT_COOKIE_NAMES.admin)?.value;
  if (!token) return null;
  try {
    return verifyToken(token) as AdminJwtPayload;
  } catch {
    return null;
  }
}

export function getStoreUserFromCookies(): StoreUserJwtPayload | null {
  const cookieStore = cookies();
  const token = cookieStore.get(JWT_COOKIE_NAMES.store)?.value;
  if (!token) return null;
  try {
    return verifyToken(token) as StoreUserJwtPayload;
  } catch {
    return null;
  }
}
