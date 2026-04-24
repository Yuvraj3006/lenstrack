import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";
import { successResponse, unauthorizedResponse } from "@/lib/api-response";
import { subDays, format } from "date-fns";

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorizedResponse();

  const { searchParams } = req.nextUrl;
  const days = parseInt(searchParams.get("days") || "30");
  const storeId = searchParams.get("storeId") || "";

  const startDate = subDays(new Date(), days - 1);
  const where: Record<string, unknown> = { createdAt: { gte: startDate } };
  if (storeId) where.storeId = storeId;

  const orders = await prisma.order.findMany({
    where,
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Group by date
  const countByDate: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    const d = format(subDays(new Date(), days - 1 - i), "yyyy-MM-dd");
    countByDate[d] = 0;
  }
  for (const order of orders) {
    const d = format(order.createdAt, "yyyy-MM-dd");
    countByDate[d] = (countByDate[d] || 0) + 1;
  }

  const trend = Object.entries(countByDate).map(([date, count]) => ({ date, count }));
  return successResponse(trend);
}
