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
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        admin: { select: { id: true, name: true, email: true } },
        storeUser: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.auditLog.count(),
  ]);

  return successResponse({ logs, total, page, limit, pages: Math.ceil(total / limit) });
}
