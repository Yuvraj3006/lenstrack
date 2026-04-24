import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import {
  successResponse,
  createdResponse,
  validationErrorResponse,
  unauthorizedResponse,
  conflictResponse,
  errorResponse,
} from "@/lib/api-response";
import { PAGINATION_DEFAULT } from "@lenstrack/config";

const createProductSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  description: z.string().optional(),
  categoryId: z.string().min(1),
  visionTypeId: z.string().min(1),
  warrantyDurationId: z.string().min(1),
  warrantyPolicy: z.string().min(5),
  commonBenefitIds: z.array(z.string()).optional().default([]),
  customBenefits: z.array(z.string()).optional().default([]),
  progressiveFeatures: z.array(z.string()).optional().default([]),
  isActive: z.boolean().optional().default(true),
});

const productInclude = {
  category: true,
  visionType: true,
  warrantyDuration: true,
  commonBenefits: { include: { commonBenefit: true } },
  progressiveFeatures: true,
};

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorizedResponse();

  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || String(PAGINATION_DEFAULT));
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const visionTypeId = searchParams.get("visionTypeId") || "";
  const isActive = searchParams.get("isActive");
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (categoryId) where.categoryId = categoryId;
  if (visionTypeId) where.visionTypeId = visionTypeId;
  if (isActive !== null && isActive !== "") where.isActive = isActive === "true";
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
    ];
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: productInclude,
    }),
    prisma.product.count({ where }),
  ]);

  return successResponse({ products, total, page, limit, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return unauthorizedResponse();

  try {
    const body = await req.json() as unknown;
    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error.errors[0].message);

    const { commonBenefitIds, progressiveFeatures, ...productData } = parsed.data;

    const product = await prisma.product.create({
      data: {
        ...productData,
        commonBenefits: {
          create: commonBenefitIds.map((id) => ({ commonBenefitId: id })),
        },
        progressiveFeatures: {
          create: progressiveFeatures.map((label) => ({ label })),
        },
      },
      include: productInclude,
    });

    await createAuditLog({
      action: "CREATE",
      entityType: "Product",
      entityId: product.id,
      after: { code: product.code, name: product.name },
      adminId: admin.sub,
    });

    return createdResponse(product);
  } catch (err) {
    const e = err as { code?: string };
    if (e.code === "P2002") return conflictResponse("Product code already exists");
    console.error("[Create Product]", err);
    return errorResponse("Failed to create product", "INTERNAL_ERROR", 500);
  }
}
