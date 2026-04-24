import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getStoreUserFromRequest } from "@/lib/auth";
import { successResponse, validationErrorResponse, unauthorizedResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const user = getStoreUserFromRequest(req);
  if (!user) return unauthorizedResponse();

  const { searchParams } = req.nextUrl;
  const mobile = searchParams.get("mobile") || "";

  if (!mobile || mobile.length < 10) {
    return validationErrorResponse("Valid mobile number is required");
  }

  const customer = await prisma.customer.findUnique({
    where: { mobile },
    include: {
      orders: {
        where: { storeId: user.storeId },
        select: { customerName: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!customer) {
    return successResponse({ exists: false, customer: null, previousNames: [] });
  }

  const previousNames = Array.from(new Set(customer.orders.map((o) => o.customerName)));
  return successResponse({ exists: true, customer: { id: customer.id, mobile: customer.mobile }, previousNames });
}
