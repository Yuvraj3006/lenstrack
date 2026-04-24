import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";
import { successResponse, unauthorizedResponse } from "@/lib/api-response";
import { PAGINATION_DEFAULT } from "@lenstrack/config";

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorizedResponse();

  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || String(PAGINATION_DEFAULT));
  const search = searchParams.get("search") || "";
  const storeId = searchParams.get("storeId") || "";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (storeId) where.storeId = storeId;
  if (from || to) {
    where.createdAt = {};
    if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
    if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to);
  }
  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: "insensitive" } },
      { authCode: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
      { customer: { mobile: { contains: search } } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        store: { select: { id: true, name: true, city: true } },
        customer: { select: { id: true, mobile: true } },
        _count: { select: { lensItems: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return successResponse({ orders, total, page, limit, pages: Math.ceil(total / limit) });
}
