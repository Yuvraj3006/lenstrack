import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";
import { successResponse, validationErrorResponse, unauthorizedResponse, notFoundResponse } from "@/lib/api-response";

const schema = z.object({ label: z.string().min(2) });

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorizedResponse();
  const body = await req.json() as unknown;
  const parsed = schema.safeParse(body);
  if (!parsed.success) return validationErrorResponse(parsed.error.errors[0].message);
  const existing = await prisma.commonBenefit.findUnique({ where: { id: params.id } });
  if (!existing) return notFoundResponse("Benefit not found");
  const updated = await prisma.commonBenefit.update({ where: { id: params.id }, data: parsed.data });
  return successResponse(updated);
}
