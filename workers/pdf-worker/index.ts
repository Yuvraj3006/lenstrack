import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import puppeteer from "puppeteer";
import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";
import { format } from "date-fns";

function pdfWorkerRedisUrl(): string {
  const u = process.env.REDIS_URL?.trim();
  if (u) return u;
  if (process.env.NODE_ENV === "production") {
    throw new Error("REDIS_URL is required to run pdf-worker in production.");
  }
  return "redis://127.0.0.1:6379";
}

const redis = new IORedis(pdfWorkerRedisUrl(), {
  maxRetriesPerRequest: null,
});

const prisma = new PrismaClient();

interface ProductSnapshot {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  visionType: string;
  warrantyDuration: string;
  warrantyMonths: number;
  warrantyPolicy: string;
  benefits: string[];
  customBenefits: string[];
  progressiveFeatures: string[];
  snapshotAt: string;
}

interface LensItem {
  id: string;
  productSnapshot: ProductSnapshot;
  rightEyeSph?: string | null;
  rightEyeCyl?: string | null;
  rightEyeAxis?: string | null;
  rightEyeAdd?: string | null;
  leftEyeSph?: string | null;
  leftEyeCyl?: string | null;
  leftEyeAxis?: string | null;
  leftEyeAdd?: string | null;
  notes?: string | null;
}

function buildAuthCardHtml(order: {
  authCode: string;
  invoiceNumber: string;
  customerName: string;
  createdAt: Date;
  qrCodeUrl?: string | null;
  store: { name: string; city: string; address?: string | null; phone?: string | null };
  customer: { mobile: string };
  lensItems: LensItem[];
}, tips: { title: string; content: string }[]): string {
  const allBenefits = (item: LensItem) => {
    const snap = item.productSnapshot;
    return [...snap.benefits, ...snap.customBenefits];
  };

  const lensItemsHtml = order.lensItems.map((item, idx) => {
    const snap = item.productSnapshot;
    const benefits = allBenefits(item);
    return `
      <div class="lens-item">
        <div class="lens-header">
          <span class="lens-num">Lens ${idx + 1}</span>
          <h3 class="lens-name">${snap.name}</h3>
          <span class="lens-code">${snap.code}</span>
          <span class="badge category">${snap.category}</span>
          <span class="badge vision">${snap.visionType}</span>
        </div>
        <table class="power-table">
          <thead>
            <tr><th></th><th>SPH</th><th>CYL</th><th>AXIS</th><th>ADD</th></tr>
          </thead>
          <tbody>
            <tr>
              <td class="eye-label">Right Eye</td>
              <td>${item.rightEyeSph || "—"}</td>
              <td>${item.rightEyeCyl || "—"}</td>
              <td>${item.rightEyeAxis || "—"}</td>
              <td>${item.rightEyeAdd || "—"}</td>
            </tr>
            <tr>
              <td class="eye-label">Left Eye</td>
              <td>${item.leftEyeSph || "—"}</td>
              <td>${item.leftEyeCyl || "—"}</td>
              <td>${item.leftEyeAxis || "—"}</td>
              <td>${item.leftEyeAdd || "—"}</td>
            </tr>
          </tbody>
        </table>
        <div class="benefits">
          ${benefits.map((b) => `<span class="benefit-chip">${b}</span>`).join("")}
        </div>
        <div class="warranty">
          <strong>Warranty:</strong> ${snap.warrantyDuration} — ${snap.warrantyPolicy}
        </div>
        ${item.notes ? `<div class="notes"><strong>Notes:</strong> ${item.notes}</div>` : ""}
      </div>
    `;
  }).join("");

  const tipsHtml = tips.map((t) => `
    <div class="tip">
      <h4>${t.title}</h4>
      <p>${t.content}</p>
    </div>
  `).join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f8f9fa; color: #1A1A2E; font-size: 12px; }
    .card { max-width: 800px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1A1A2E 0%, #2d2d5e 100%); color: white; padding: 28px 32px; display: flex; justify-content: space-between; align-items: center; }
    .brand h1 { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
    .brand span { color: #E94560; }
    .brand p { font-size: 11px; opacity: 0.7; margin-top: 4px; }
    .auth-badge { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 12px 16px; text-align: center; }
    .auth-badge .check { font-size: 20px; margin-bottom: 4px; }
    .auth-badge .label { font-size: 10px; opacity: 0.8; }
    .auth-badge .status { font-size: 12px; font-weight: 600; color: #4ade80; }
    .body { padding: 24px 32px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 24px; padding: 16px; background: #f8f9fa; border-radius: 8px; }
    .meta-item label { font-size: 10px; text-transform: uppercase; color: #666; font-weight: 600; }
    .meta-item value, .meta-item p { font-size: 13px; font-weight: 500; margin-top: 2px; color: #1A1A2E; }
    .auth-code-box { text-align: center; padding: 16px; background: #1A1A2E; color: white; border-radius: 8px; margin-bottom: 24px; }
    .auth-code-box .label { font-size: 10px; text-transform: uppercase; opacity: 0.7; }
    .auth-code-box .code { font-size: 18px; font-family: monospace; font-weight: 700; color: #E94560; letter-spacing: 2px; }
    .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #1A1A2E; border-bottom: 2px solid #E94560; padding-bottom: 6px; margin-bottom: 16px; }
    .lens-item { background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    .lens-header { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
    .lens-num { background: #E94560; color: white; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 12px; }
    .lens-name { font-size: 14px; font-weight: 600; }
    .lens-code { font-size: 11px; color: #666; font-family: monospace; }
    .badge { font-size: 10px; padding: 2px 8px; border-radius: 12px; font-weight: 500; }
    .badge.category { background: #e0e7ff; color: #3730a3; }
    .badge.vision { background: #dcfce7; color: #166534; }
    .power-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 11px; }
    .power-table th { background: #1A1A2E; color: white; padding: 6px 10px; text-align: center; }
    .power-table td { border: 1px solid #e5e7eb; padding: 6px 10px; text-align: center; }
    .eye-label { font-weight: 600; text-align: left !important; background: #f3f4f6; }
    .benefits { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
    .benefit-chip { background: #eff6ff; color: #1d4ed8; font-size: 10px; padding: 3px 8px; border-radius: 12px; border: 1px solid #bfdbfe; }
    .warranty { font-size: 11px; color: #555; margin-bottom: 6px; }
    .notes { font-size: 11px; color: #555; font-style: italic; }
    .tips-section { margin-top: 24px; padding: 20px; background: #fffbeb; border-radius: 8px; border: 1px solid #fde68a; }
    .tip { margin-bottom: 12px; }
    .tip h4 { font-size: 12px; font-weight: 600; color: #92400e; margin-bottom: 4px; }
    .tip p { font-size: 11px; color: #78350f; }
    .footer { padding: 16px 32px; background: #f8f9fa; border-top: 1px solid #e5e7eb; font-size: 10px; color: #666; text-align: center; }
    .qr-section { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; padding: 16px; border: 1px dashed #e5e7eb; border-radius: 8px; }
    .qr-section img { width: 80px; height: 80px; }
    .qr-text p { font-size: 11px; color: #666; }
    .qr-text strong { color: #1A1A2E; font-size: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="brand">
        <h1>Lens<span>track</span></h1>
        <p>Digital Lens Authentication Platform</p>
      </div>
      <div class="auth-badge">
        <div class="check">✓</div>
        <div class="label">Authenticated</div>
        <div class="status">Genuine Lenstrack Lens</div>
      </div>
    </div>
    <div class="body">
      <div class="auth-code-box">
        <div class="label">Authentication Code</div>
        <div class="code">${order.authCode}</div>
      </div>

      <div class="meta-grid">
        <div class="meta-item">
          <label>Customer</label>
          <p>${order.customerName}</p>
          <p>${order.customer.mobile}</p>
        </div>
        <div class="meta-item">
          <label>Store</label>
          <p>${order.store.name}</p>
          <p>${order.store.city}</p>
        </div>
        <div class="meta-item">
          <label>Invoice / Date</label>
          <p>${order.invoiceNumber}</p>
          <p>${format(new Date(order.createdAt), "dd MMM yyyy")}</p>
        </div>
      </div>

      <div class="section-title">Lens Details</div>
      ${lensItemsHtml}

      <div class="tips-section">
        <div class="section-title" style="border-color: #f59e0b; color: #92400e;">Lens Care Tips</div>
        ${tipsHtml}
      </div>
    </div>
    <div class="footer">
      This authentication was digitally issued by Lenstrack. For support, contact your store. | lenstrack.com
    </div>
  </div>
</body>
</html>`;
}

async function processPdfJob(job: Job<{ orderId: string }>) {
  const { orderId } = job.data;
  console.log(`[PDF Worker] Processing job for order: ${orderId}`);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      store: true,
      customer: true,
      lensItems: true,
    },
  });

  if (!order) throw new Error(`Order not found: ${orderId}`);

  const tips = await prisma.lensCareTip.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  const lensItems = order.lensItems.map((item) => ({
    ...item,
    productSnapshot: item.productSnapshot as unknown as ProductSnapshot,
  }));

  const html = buildAuthCardHtml({ ...order, lensItems }, tips);

  const outputDir = process.env.PDF_OUTPUT_DIR || path.join(process.cwd(), "../../apps/web/public/pdfs");
  const absoluteDir = path.resolve(outputDir);

  if (!fs.existsSync(absoluteDir)) {
    fs.mkdirSync(absoluteDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  await page.emulateMediaType("screen");

  const fileName = `${order.authCode}.pdf`;
  const filePath = path.join(absoluteDir, fileName);

  await page.pdf({
    path: filePath,
    format: "A4",
    printBackground: true,
    margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
  });

  await browser.close();

  const pdfUrl = `/pdfs/${fileName}`;
  await prisma.order.update({ where: { id: orderId }, data: { pdfUrl } });

  console.log(`[PDF Worker] PDF generated: ${pdfUrl}`);
  return pdfUrl;
}

const worker = new Worker(
  "pdf-generation",
  processPdfJob,
  { connection: redis, concurrency: 2 }
);

worker.on("completed", (job) => {
  console.log(`[PDF Worker] Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[PDF Worker] Job ${job?.id} failed:`, err.message);
});

worker.on("error", (err) => {
  console.error("[PDF Worker] Worker error:", err);
});

console.log("🖨️  PDF Worker started, listening on queue: pdf-generation");

process.on("SIGTERM", async () => {
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});
