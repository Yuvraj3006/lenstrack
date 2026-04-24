import { NextRequest } from "next/server";
import { z } from "zod";
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

const createStoreSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  city: z.string().min(2, "City is required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorizedResponse();

  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || String(PAGINATION_DEFAULT));
  const search = searchParams.get("search") || "";
  const skip = (page - 1) * limit;

  const where = search
    ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { city: { contains: search, mode: "insensitive" as const } }] }
    : {};

  const [stores, total] = await Promise.all([
    prisma.store.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { users: true, orders: true } },
      },
    }),
    prisma.store.count({ where }),
  ]);

  return successResponse({ stores, total, page, limit, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorizedResponse();

  try {
    const body = await req.json() as unknown;
    const parsed = createStoreSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error.errors[0].message);

    const store = await prisma.store.create({ data: parsed.data });

    await createAuditLog({
      action: "CREATE",
      entityType: "Store",
      entityId: store.id,
      after: parsed.data as Record<string, unknown>,
      adminId: admin.sub,
    });

    return createdResponse(store);
  } catch (err) {
    const e = err as { code?: string };
    if (e.code === "P2002") return conflictResponse("Store with this name already exists");
    return errorResponse("Failed to create store", "INTERNAL_ERROR", 500);
  }
}
