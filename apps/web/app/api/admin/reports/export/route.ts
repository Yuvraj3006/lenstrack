import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";
import { unauthorizedResponse } from "@/lib/api-response";
import { format } from "date-fns";

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

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      store: { select: { name: true, city: true } },
      customer: { select: { mobile: true } },
      lensItems: true,
    },
  });

  const headers = ["Auth Code", "Invoice Number", "Customer Name", "Customer Mobile", "Store", "City", "Lens Items Count", "Created At"];
  const rows = orders.map((o) => [
    o.authCode,
    o.invoiceNumber,
    o.customerName,
    o.customer.mobile,
    o.store.name,
    o.store.city,
    o.lensItems.length.toString(),
    format(o.createdAt, "yyyy-MM-dd HH:mm"),
  ]);

  const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="lenstrack-orders-${format(new Date(), "yyyy-MM-dd")}.csv"`,
    },
  });
}
