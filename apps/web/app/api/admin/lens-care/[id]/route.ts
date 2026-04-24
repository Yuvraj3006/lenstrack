import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";
import { successResponse, validationErrorResponse, unauthorizedResponse, notFoundResponse, errorResponse } from "@/lib/api-response";

const schema = z.object({
  title: z.string().min(2).optional(),
  content: z.string().min(5).optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorizedResponse();
  const body = await req.json() as unknown;
  const parsed = schema.safeParse(body);
  if (!parsed.success) return validationErrorResponse(parsed.error.errors[0].message);
  const existing = await prisma.lensCareTip.findUnique({ where: { id: params.id } });
  if (!existing) return notFoundResponse("Tip not found");
  const updated = await prisma.lensCareTip.update({ where: { id: params.id }, data: parsed.data });
  return successResponse(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorizedResponse();
  try {
    await prisma.lensCareTip.delete({ where: { id: params.id } });
    return successResponse({ deleted: true });
  } catch {
    return errorResponse("Failed to delete tip", "INTERNAL_ERROR", 500);
  }
}
