import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
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

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  storeId: z.string().optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorizedResponse();

  try {
    const body = await req.json() as unknown;
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error.errors[0].message);

    const before = await prisma.storeUser.findUnique({ where: { id: params.id } });
    if (!before) return notFoundResponse("Store user not found");

    const { password, ...rest } = parsed.data;
    const updateData: Record<string, unknown> = { ...rest };
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 12);
    }

    const updated = await prisma.storeUser.update({
      where: { id: params.id },
      data: updateData,
      select: { id: true, name: true, email: true, phone: true, isActive: true, storeId: true, createdAt: true },
    });

    await createAuditLog({
      action: "UPDATE",
      entityType: "StoreUser",
      entityId: params.id,
      before: { name: before.name, isActive: before.isActive, storeId: before.storeId },
      after: rest as Record<string, unknown>,
      adminId: admin.sub,
    });

    return successResponse(updated);
  } catch (err) {
    console.error("[Update StoreUser]", err);
    return errorResponse("Failed to update store user", "INTERNAL_ERROR", 500);
  }
}
