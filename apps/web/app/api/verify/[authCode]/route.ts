import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { successResponse, notFoundResponse } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: { authCode: string } }) {
  const order = await prisma.order.findUnique({
    where: { authCode: params.authCode },
    include: {
      store: { select: { id: true, name: true, city: true, address: true, phone: true } },
      customer: { select: { mobile: true } },
      lensItems: true,
    },
  });

  if (!order) return notFoundResponse("Authentication record not found");

  const tips = await prisma.lensCareTip.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  return successResponse({ order, lensCareTips: tips });
}
