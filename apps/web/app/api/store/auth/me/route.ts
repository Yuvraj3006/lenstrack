import { NextRequest } from "next/server";
import { getStoreUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { successResponse, unauthorizedResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const user = getStoreUserFromRequest(req);
  if (!user) return unauthorizedResponse();
  const userData = await prisma.storeUser.findUnique({
    where: { id: user.sub },
    select: { id: true, name: true, email: true, phone: true, storeId: true, store: true, createdAt: true },
  });
  if (!userData) return unauthorizedResponse();
  return successResponse(userData);
}
