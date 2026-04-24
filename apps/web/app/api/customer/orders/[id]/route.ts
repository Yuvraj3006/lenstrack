import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCustomerFromRequest } from "@/lib/auth";
import { successResponse, unauthorizedResponse, notFoundResponse } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const customer = getCustomerFromRequest(req);
  if (!customer) return unauthorizedResponse();

  const order = await prisma.order.findFirst({
    where: { id: params.id, customerId: customer.sub },
    include: {
      store: { select: { id: true, name: true, city: true, address: true, phone: true } },
      customer: { select: { mobile: true } },
      lensItems: true,
    },
  });

  if (!order) return notFoundResponse("Order not found");

  // Append lens care tips
  const tips = await prisma.lensCareTip.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  return successResponse({ order, lensCareTips: tips });
}
