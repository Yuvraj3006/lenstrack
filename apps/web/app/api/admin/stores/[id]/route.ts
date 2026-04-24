import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import {
  successResponse,
  validationErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
  errorResponse,
} from "@/lib/api-response";

const updateStoreSchema = z.object({
  name: z.string().min(2).optional(),
  city: z.string().min(2).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorizedResponse();

  const store = await prisma.store.findUnique({
    where: { id: params.id },
    include: {
      users: { select: { id: true, name: true, email: true, isActive: true } },
      _count: { select: { orders: true } },
    },
  });

  if (!store) return notFoundResponse("Store not found");
  return successResponse(store);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorizedResponse();

  try {
    const body = await req.json() as unknown;
    const parsed = updateStoreSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error.errors[0].message);

    const before = await prisma.store.findUnique({ where: { id: params.id } });
    if (!before) return notFoundResponse("Store not found");

    const updated = await prisma.store.update({
      where: { id: params.id },
      data: parsed.data,
    });

    await createAuditLog({
      action: "UPDATE",
      entityType: "Store",
      entityId: params.id,
      before: before as unknown as Record<string, unknown>,
      after: parsed.data as Record<string, unknown>,
      adminId: admin.sub,
    });

    return successResponse(updated);
  } catch (err) {
    console.error("[Update Store]", err);
    return errorResponse("Failed to update store", "INTERNAL_ERROR", 500);
  }
}
