import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getStoreUserFromRequest } from "@/lib/auth";
import { successResponse, unauthorizedResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const user = getStoreUserFromRequest(req);
  if (!user) return unauthorizedResponse();

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") || "";

  const where: Record<string, unknown> = { isActive: true };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
    ];
  }

  const products = await prisma.product.findMany({
    where,
    take: 50,
    orderBy: { name: "asc" },
    include: {
      category: true,
      visionType: true,
      warrantyDuration: true,
      commonBenefits: { include: { commonBenefit: true } },
      progressiveFeatures: true,
    },
  });

  return successResponse(products);
}
