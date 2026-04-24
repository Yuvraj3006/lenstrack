import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getStoreUserFromRequest } from "@/lib/auth";
import { successResponse, unauthorizedResponse, notFoundResponse } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getStoreUserFromRequest(req);
  if (!user) return unauthorizedResponse();

  const order = await prisma.order.findFirst({
    where: { id: params.id, storeId: user.storeId },
    include: {
      store: true,
      customer: true,
      storeUser: { select: { id: true, name: true, email: true } },
      lensItems: true,
    },
  });

  if (!order) return notFoundResponse("Order not found");
  return successResponse(order);
}
