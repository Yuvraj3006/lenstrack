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

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorizedResponse();

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      store: true,
      customer: true,
      storeUser: { select: { id: true, name: true, email: true } },
      lensItems: true,
    },
  });
  if (!order) return notFoundResponse("Order not found");
  return successResponse(order);
}

const updateOrderSchema = z.object({
  lensItems: z.array(z.object({
    id: z.string(),
    notes: z.string().optional(),
  })).optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorizedResponse();

  try {
    const body = await req.json() as unknown;
    const parsed = updateOrderSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error.errors[0].message);

    const before = await prisma.order.findUnique({
      where: { id: params.id },
      include: { lensItems: true },
    });
    if (!before) return notFoundResponse("Order not found");

    if (parsed.data.lensItems) {
      for (const item of parsed.data.lensItems) {
        await prisma.orderLensItem.update({
          where: { id: item.id },
          data: { notes: item.notes },
        });
      }
    }

    await createAuditLog({
      action: "UPDATE",
      entityType: "Order",
      entityId: params.id,
      before: { lensItems: before.lensItems.map((i) => ({ id: i.id, notes: i.notes })) },
      after: parsed.data as Record<string, unknown>,
      adminId: admin.sub,
    });

    const updated = await prisma.order.findUnique({
      where: { id: params.id },
      include: { store: true, customer: true, storeUser: { select: { id: true, name: true, email: true } }, lensItems: true },
    });

    return successResponse(updated);
  } catch (err) {
    console.error("[Update Order]", err);
    return errorResponse("Failed to update order", "INTERNAL_ERROR", 500);
  }
}
