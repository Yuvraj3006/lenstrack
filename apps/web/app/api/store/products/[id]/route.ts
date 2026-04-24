import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getStoreUserFromRequest } from "@/lib/auth";
import { successResponse, unauthorizedResponse, notFoundResponse } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getStoreUserFromRequest(req);
  if (!user) return unauthorizedResponse();

  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      category: true,
      visionType: true,
      warrantyDuration: true,
      commonBenefits: { include: { commonBenefit: true } },
      progressiveFeatures: true,
    },
  });

  if (!product || !product.isActive) return notFoundResponse("Product not found");
  return successResponse(product);
}
