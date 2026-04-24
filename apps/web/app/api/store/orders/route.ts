import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getStoreUserFromRequest } from "@/lib/auth";
import { qrCodeImageUrlPath } from "@/lib/qrcode";
import { enqueuePdfGeneration } from "@/lib/pdf-queue";
import {
  successResponse,
  createdResponse,
  validationErrorResponse,
  unauthorizedResponse,
  conflictResponse,
  errorResponse,
} from "@/lib/api-response";
import { PAGINATION_DEFAULT } from "@lenstrack/config";

const lensItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  rightEyeSph: z.string().optional(),
  rightEyeCyl: z.string().optional(),
  rightEyeAxis: z.string().optional(),
  rightEyeAdd: z.string().optional(),
  leftEyeSph: z.string().optional(),
  leftEyeCyl: z.string().optional(),
  leftEyeAxis: z.string().optional(),
  leftEyeAdd: z.string().optional(),
  notes: z.string().optional(),
});

const createOrderSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  mobile: z.string().length(10, "Mobile must be 10 digits"),
  customerName: z.string().min(2, "Customer name is required"),
  lensItems: z.array(lensItemSchema).min(1, "At least one lens item required"),
});

export async function GET(req: NextRequest) {
  const user = getStoreUserFromRequest(req);
  if (!user) return unauthorizedResponse();

  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || String(PAGINATION_DEFAULT));
  const search = searchParams.get("search") || "";
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { storeId: user.storeId };
  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: "insensitive" } },
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
        customer: { select: { mobile: true } },
        _count: { select: { lensItems: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return successResponse({ orders, total, page, limit, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const user = getStoreUserFromRequest(req);
  if (!user) return unauthorizedResponse();

  try {
    const body = await req.json() as unknown;
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error.errors[0].message);

    const { invoiceNumber, mobile, customerName, lensItems } = parsed.data;
    const storeId = user.storeId; // Always from JWT, never from request body

    // Check for duplicate invoice per store
    const existingOrder = await prisma.order.findFirst({ where: { invoiceNumber, storeId } });
    if (existingOrder) return conflictResponse("Invoice number already exists for this store");

    // Find or create customer
    let customer = await prisma.customer.findUnique({ where: { mobile } });
    if (!customer) {
      customer = await prisma.customer.create({ data: { mobile } });
    }

    // Build product snapshots
    const lensItemsWithSnapshots = await Promise.all(
      lensItems.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          include: {
            category: true,
            visionType: true,
            warrantyDuration: true,
            commonBenefits: { include: { commonBenefit: true } },
            progressiveFeatures: true,
          },
        });

        if (!product) throw new Error(`Product not found: ${item.productId}`);

        const snapshot = {
          id: product.id,
          code: product.code,
          name: product.name,
          description: product.description,
          category: product.category.name,
          visionType: product.visionType.name,
          warrantyDuration: product.warrantyDuration.label,
          warrantyMonths: product.warrantyDuration.months,
          warrantyPolicy: product.warrantyPolicy,
          benefits: product.commonBenefits.map((b) => b.commonBenefit.label),
          customBenefits: product.customBenefits,
          progressiveFeatures: product.progressiveFeatures.map((f) => f.label),
          snapshotAt: new Date().toISOString(),
        };

        return { ...item, productSnapshot: snapshot };
      })
    );

    // Create order
    const order = await prisma.order.create({
      data: {
        invoiceNumber,
        customerId: customer.id,
        customerName,
        storeId,
        storeUserId: user.sub,
        lensItems: {
          create: lensItemsWithSnapshots.map(({ productSnapshot, ...item }) => ({
            productId: item.productId,
            productSnapshot,
            rightEyeSph: item.rightEyeSph,
            rightEyeCyl: item.rightEyeCyl,
            rightEyeAxis: item.rightEyeAxis,
            rightEyeAdd: item.rightEyeAdd,
            leftEyeSph: item.leftEyeSph,
            leftEyeCyl: item.leftEyeCyl,
            leftEyeAxis: item.leftEyeAxis,
            leftEyeAdd: item.leftEyeAdd,
            notes: item.notes,
          })),
        },
      },
      include: { lensItems: true, store: true, customer: true },
    });

    // PNG served dynamically (Vercel has no writable public/ at runtime)
    const qrCodeUrl = qrCodeImageUrlPath(order.authCode);
    await prisma.order.update({ where: { id: order.id }, data: { qrCodeUrl } });

    // Enqueue PDF generation
    try {
      await enqueuePdfGeneration(order.id);
    } catch (queueErr) {
      console.error("[PDF Queue]", queueErr);
      // Non-critical: don't fail the order
    }

    return createdResponse({ ...order, qrCodeUrl });
  } catch (err) {
    const e = err as { code?: string; message?: string };
    if (e.code === "P2002") return conflictResponse("Invoice number already exists");
    console.error("[Create Order]", err);
    return errorResponse(e.message || "Failed to create order", "INTERNAL_ERROR", 500);
  }
}
