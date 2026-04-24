import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildVerifyUrl, renderQrToPngBuffer } from "@/lib/qrcode";
import { publicOriginFromRequest } from "@/lib/request-origin";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { authCode: string } }
) {
  const { authCode } = params;
  if (!authCode) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { authCode },
    select: { id: true },
  });
  if (!order) {
    return new NextResponse("Not found", { status: 404 });
  }

  const verifyUrl = buildVerifyUrl(authCode, publicOriginFromRequest(req));
  const buf = await renderQrToPngBuffer(verifyUrl);
  const body = new Uint8Array(buf);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
