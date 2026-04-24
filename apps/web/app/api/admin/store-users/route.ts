import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import {
  successResponse,
  createdResponse,
  validationErrorResponse,
  unauthorizedResponse,
  conflictResponse,
  errorResponse,
} from "@/lib/api-response";
import { PAGINATION_DEFAULT } from "@lenstrack/config";

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
  storeId: z.string().min(1, "Store is required"),
  isActive: z.boolean().optional().default(true),
});

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorizedResponse();

  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || String(PAGINATION_DEFAULT));
  const search = searchParams.get("search") || "";
  const storeId = searchParams.get("storeId") || "";
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (storeId) where.storeId = storeId;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.storeUser.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { store: { select: { id: true, name: true, city: true } } },
    }),
    prisma.storeUser.count({ where }),
  ]);

  return successResponse({ users, total, page, limit, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorizedResponse();

  try {
    const body = await req.json() as unknown;
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error.errors[0].message);

    const { password, ...rest } = parsed.data;
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.storeUser.create({
      data: { ...rest, passwordHash },
      select: { id: true, name: true, email: true, phone: true, isActive: true, storeId: true, createdAt: true },
    });

    await createAuditLog({
      action: "CREATE",
      entityType: "StoreUser",
      entityId: user.id,
      after: { name: user.name, email: user.email, storeId: user.storeId },
      adminId: admin.sub,
    });

    return createdResponse(user);
  } catch (err) {
    const e = err as { code?: string };
    if (e.code === "P2002") return conflictResponse("Email already in use");
    return errorResponse("Failed to create store user", "INTERNAL_ERROR", 500);
  }
}
