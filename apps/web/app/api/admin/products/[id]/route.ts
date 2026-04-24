import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import {
  successResponse,
  validationErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
  errorResponse,
} from "@/lib/api-response";

const updateProductSchema = z.object({
  code: z.string().min(2).optional(),
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  visionTypeId: z.string().optional(),
  warrantyDurationId: z.string().optional(),
  warrantyPolicy: z.string().optional(),
  commonBenefitIds: z.array(z.string()).optional(),
  customBenefits: z.array(z.string()).optional(),
  progressiveFeatures: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

const productInclude = {
  category: true,
  visionType: true,
  warrantyDuration: true,
  commonBenefits: { include: { commonBenefit: true } },
  progressiveFeatures: true,
};

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorizedResponse();

  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: productInclude,
  });
  if (!product) return notFoundResponse("Product not found");
  return successResponse(product);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorizedResponse();

  try {
    const body = await req.json() as unknown;
    const parsed = updateProductSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error.errors[0].message);

    const before = await prisma.product.findUnique({ where: { id: params.id } });
    if (!before) return notFoundResponse("Product not found");

    const { commonBenefitIds, progressiveFeatures, ...productData } = parsed.data;

    await prisma.$transaction(async (tx) => {
      if (commonBenefitIds !== undefined) {
        await tx.productBenefit.deleteMany({ where: { productId: params.id } });
        if (commonBenefitIds.length > 0) {
          await tx.productBenefit.createMany({
            data: commonBenefitIds.map((id) => ({ productId: params.id, commonBenefitId: id })),
          });
        }
      }
      if (progressiveFeatures !== undefined) {
        await tx.progressiveFeature.deleteMany({ where: { productId: params.id } });
        if (progressiveFeatures.length > 0) {
          await tx.progressiveFeature.createMany({
            data: progressiveFeatures.map((label) => ({ productId: params.id, label })),
          });
        }
      }
      await tx.product.update({ where: { id: params.id }, data: productData });
    });

    const updated = await prisma.product.findUnique({
      where: { id: params.id },
      include: productInclude,
    });

    await createAuditLog({
      action: "UPDATE",
      entityType: "Product",
      entityId: params.id,
      before: { name: before.name, code: before.code },
      after: productData as Record<string, unknown>,
      adminId: admin.sub,
    });

    return successResponse(updated);
  } catch (err) {
    console.error("[Update Product]", err);
    return errorResponse("Failed to update product", "INTERNAL_ERROR", 500);
  }
}
