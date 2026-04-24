import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";
import { successResponse, createdResponse, validationErrorResponse, unauthorizedResponse, conflictResponse, errorResponse } from "@/lib/api-response";

const schema = z.object({ label: z.string().min(2), months: z.number().int().min(1), isActive: z.boolean().optional().default(true) });

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorizedResponse();
  const durations = await prisma.warrantyDuration.findMany({ orderBy: { months: "asc" } });
  return successResponse(durations);
}

export async function POST(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorizedResponse();
  try {
    const body = await req.json() as unknown;
    const parsed = schema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error.errors[0].message);
    const wd = await prisma.warrantyDuration.create({ data: parsed.data });
    return createdResponse(wd);
  } catch (err) {
    const e = err as { code?: string };
    if (e.code === "P2002") return conflictResponse("Warranty duration already exists");
    return errorResponse("Failed to create warranty duration", "INTERNAL_ERROR", 500);
  }
}
