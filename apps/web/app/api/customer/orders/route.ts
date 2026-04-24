import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCustomerFromRequest } from "@/lib/auth";
import { successResponse, unauthorizedResponse } from "@/lib/api-response";
import { PAGINATION_DEFAULT } from "@lenstrack/config";

export async function GET(req: NextRequest) {
  const customer = getCustomerFromRequest(req);
  if (!customer) return unauthorizedResponse();

  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || String(PAGINATION_DEFAULT));
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { customerId: customer.sub },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        store: { select: { id: true, name: true, city: true } },
        _count: { select: { lensItems: true } },
      },
    }),
    prisma.order.count({ where: { customerId: customer.sub } }),
  ]);

  return successResponse({ orders, total, page, limit, pages: Math.ceil(total / limit) });
}
