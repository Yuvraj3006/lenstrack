import { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { successResponse, unauthorizedResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorizedResponse();

  const adminData = await prisma.admin.findUnique({
    where: { id: admin.sub },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  if (!adminData) return unauthorizedResponse();
  return successResponse(adminData);
}
