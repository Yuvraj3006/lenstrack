import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getStoreUserFromRequest } from "@/lib/auth";
import { successResponse, unauthorizedResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const user = getStoreUserFromRequest(req);
  if (!user) return unauthorizedResponse();
  const categories = await prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  return successResponse(categories);
}
