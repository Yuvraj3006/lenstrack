import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";
import { successResponse, createdResponse, validationErrorResponse, unauthorizedResponse, conflictResponse, errorResponse } from "@/lib/api-response";

const schema = z.object({ name: z.string().min(2), isActive: z.boolean().optional().default(true) });

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorizedResponse();
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return successResponse(categories);
}

export async function POST(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorizedResponse();
  try {
    const body = await req.json() as unknown;
    const parsed = schema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error.errors[0].message);
    const category = await prisma.category.create({ data: parsed.data });
    return createdResponse(category);
  } catch (err) {
    const e = err as { code?: string };
    if (e.code === "P2002") return conflictResponse("Category already exists");
    return errorResponse("Failed to create category", "INTERNAL_ERROR", 500);
  }
}
