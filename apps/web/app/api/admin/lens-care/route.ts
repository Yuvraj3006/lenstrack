import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";
import { successResponse, createdResponse, validationErrorResponse, unauthorizedResponse, errorResponse } from "@/lib/api-response";

const schema = z.object({
  title: z.string().min(2),
  content: z.string().min(5),
  order: z.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorizedResponse();
  const tips = await prisma.lensCareTip.findMany({ orderBy: { order: "asc" } });
  return successResponse(tips);
}

export async function POST(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorizedResponse();
  try {
    const body = await req.json() as unknown;
    const parsed = schema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error.errors[0].message);
    const tip = await prisma.lensCareTip.create({ data: parsed.data });
    return createdResponse(tip);
  } catch (err) {
    console.error("[Create LensCareTip]", err);
    return errorResponse("Failed to create tip", "INTERNAL_ERROR", 500);
  }
}
