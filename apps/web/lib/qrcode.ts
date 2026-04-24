import QRCode from "qrcode";

/** Full URL encoded inside the QR (customer opens verify after scan). */
export function buildVerifyUrl(authCode: string, publicOrigin: string): string {
  const base = publicOrigin.replace(/\/$/, "");
  return `${base}/verify/${encodeURIComponent(authCode)}`;
}

/** Relative URL for `<img src>` — works on Vercel (no filesystem write). */
export function qrCodeImageUrlPath(authCode: string): string {
  return `/api/qrcode/${authCode}`;
}

export async function renderQrToPngBuffer(verifyUrl: string): Promise<Buffer> {
  return QRCode.toBuffer(verifyUrl, {
    type: "png",
    width: 300,
    margin: 2,
    color: {
      dark: "#1A1A2E",
      light: "#FFFFFF",
    },
  });
}
