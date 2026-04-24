import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";
import { successResponse, createdResponse, validationErrorResponse, unauthorizedResponse, conflictResponse, errorResponse } from "@/lib/api-response";

const schema = z.object({ name: z.string().min(2), isActive: z.boolean().optional().default(true) });

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorizedResponse();
  const visionTypes = await prisma.visionType.findMany({ orderBy: { name: "asc" } });
  return successResponse(visionTypes);
}

export async function POST(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorizedResponse();
  try {
    const body = await req.json() as unknown;
    const parsed = schema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error.errors[0].message);
    const vt = await prisma.visionType.create({ data: parsed.data });
    return createdResponse(vt);
  } catch (err) {
    const e = err as { code?: string };
    if (e.code === "P2002") return conflictResponse("Vision type already exists");
    return errorResponse("Failed to create vision type", "INTERNAL_ERROR", 500);
  }
}
