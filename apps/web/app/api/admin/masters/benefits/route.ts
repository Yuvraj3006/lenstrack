import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";
import { successResponse, createdResponse, validationErrorResponse, unauthorizedResponse, conflictResponse, errorResponse } from "@/lib/api-response";

const schema = z.object({ label: z.string().min(2) });

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorizedResponse();
  const benefits = await prisma.commonBenefit.findMany({ orderBy: { label: "asc" } });
  return successResponse(benefits);
}

export async function POST(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorizedResponse();
  try {
    const body = await req.json() as unknown;
    const parsed = schema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error.errors[0].message);
    const benefit = await prisma.commonBenefit.create({ data: parsed.data });
    return createdResponse(benefit);
  } catch (err) {
    const e = err as { code?: string };
    if (e.code === "P2002") return conflictResponse("Benefit already exists");
    return errorResponse("Failed to create benefit", "INTERNAL_ERROR", 500);
  }
}
