import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";
import { successResponse, unauthorizedResponse } from "@/lib/api-response";
import { startOfDay, subDays } from "date-fns";

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorizedResponse();

  const { searchParams } = req.nextUrl;
  const storeId = searchParams.get("storeId") || "";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";

  const where: Record<string, unknown> = {};
  if (storeId) where.storeId = storeId;
  if (from || to) {
    where.createdAt = {};
    if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
    if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to);
  }

  const todayStart = startOfDay(new Date());
  const todayWhere = { ...where, createdAt: { ...((where.createdAt as object) || {}), gte: todayStart } };

  const [totalOrders, totalStores, totalProducts, todayOrders, uniqueCustomers, storeWise, productWise] = await Promise.all([
    prisma.order.count({ where }),
    prisma.store.count({ where: { isActive: true } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.count({ where: storeId ? { storeId, createdAt: { gte: todayStart } } : { createdAt: { gte: todayStart } } }),
    prisma.order.groupBy({ by: ["customerId"], where, _count: true }).then((r) => r.length),
    prisma.order.groupBy({
      by: ["storeId"],
      where,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
    prisma.orderLensItem.groupBy({
      by: ["productId"],
      where: storeId ? { order: { storeId } } : undefined,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
  ]);

  // Enrich store-wise data
  const storeIds = storeWise.map((s) => s.storeId);
  const stores = await prisma.store.findMany({ where: { id: { in: storeIds } }, select: { id: true, name: true, city: true } });
  const storeMap = Object.fromEntries(stores.map((s) => [s.id, s]));

  // Enrich product-wise data
  const productIds = productWise.map((p) => p.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, code: true } });
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  const last7DaysStart = subDays(new Date(), 6);
  const recentOrders = await prisma.order.findMany({
    where: { ...where, createdAt: { gte: last7DaysStart } },
    take: 10,
    orderBy: { createdAt: "desc" },
    include: { store: { select: { name: true, city: true } }, customer: { select: { mobile: true } } },
  });

  return successResponse({
    totalOrders,
    totalStores,
    totalProducts,
    todayOrders,
    uniqueCustomers,
    storeWise: storeWise.map((s) => ({ ...s, store: storeMap[s.storeId] })),
    productWise: productWise.map((p) => ({ ...p, product: productMap[p.productId] })),
    recentOrders,
  });
}
