import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";
import { successResponse, validationErrorResponse, unauthorizedResponse, notFoundResponse } from "@/lib/api-response";

const schema = z.object({ name: z.string().min(2).optional(), isActive: z.boolean().optional() });

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorizedResponse();
  const body = await req.json() as unknown;
  const parsed = schema.safeParse(body);
  if (!parsed.success) return validationErrorResponse(parsed.error.errors[0].message);
  const existing = await prisma.category.findUnique({ where: { id: params.id } });
  if (!existing) return notFoundResponse("Category not found");
  const updated = await prisma.category.update({ where: { id: params.id }, data: parsed.data });
  return successResponse(updated);
}
