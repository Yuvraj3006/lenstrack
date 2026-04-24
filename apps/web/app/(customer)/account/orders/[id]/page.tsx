"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle2, Share2, Download, Shield, MapPin, Phone, Calendar, QrCode } from "lucide-react";
import { LenstrackLogo } from "@/components/lenstrack-logo";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductSnapshot {
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
}

interface LensItem {
  id: string;
  productSnapshot: ProductSnapshot;
  rightEyeSph?: string;
  rightEyeCyl?: string;
  rightEyeAxis?: string;
  rightEyeAdd?: string;
  leftEyeSph?: string;
  leftEyeCyl?: string;
  leftEyeAxis?: string;
  leftEyeAdd?: string;
  notes?: string;
}

interface Order {
  id: string;
  authCode: string;
  invoiceNumber: string;
  customerName: string;
  createdAt: string;
  qrCodeUrl?: string;
  pdfUrl?: string;
  store: { name: string; city: string; address?: string; phone?: string };
  customer: { mobile: string };
  lensItems: LensItem[];
}

interface LensCareTip {
  id: string;
  title: string;
  content: string;
}

function AuthCard({ order, lensCareTips }: { order: Order; lensCareTips: LensCareTip[] }) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  function handleShare() {
    const url = `${baseUrl}/verify/${order.authCode}`;
    navigator.clipboard.writeText(url).then(() => toast.success("Verification link copied!")).catch(() => toast.error("Copy failed"));
  }

  return (
    <div className="space-y-0 max-w-2xl mx-auto">
      {/* Card Header */}
      <div className="bg-gradient-to-r from-[#1A1A2E] to-[#2d2d5e] rounded-t-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <LenstrackLogo width={150} className="mb-1" />
            <p className="text-white/50 text-xs">Digital Lens Authentication</p>
          </div>
          <div className="flex items-center gap-1.5 bg-green-500/20 border border-green-400/30 rounded-full px-3 py-1.5">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <span className="text-green-300 text-xs font-semibold">Verified Genuine</span>
          </div>
        </div>

        <div className="mt-5 bg-white/5 border border-white/10 rounded-xl p-4 text-center">
          <p className="text-white/50 text-xs uppercase tracking-widest font-medium mb-1">Authentication Code</p>
          <p className="text-[#E94560] font-mono font-bold text-2xl tracking-widest">{order.authCode}</p>
        </div>
      </div>

      {/* Meta grid */}
      <div className="bg-white border-x grid grid-cols-3 divide-x">
        <div className="p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Customer</p>
          <p className="font-semibold text-sm">{order.customerName}</p>
          <p className="text-xs text-muted-foreground">{order.customer.mobile}</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Store</p>
          <p className="font-semibold text-sm">{order.store.name.split("-").pop()?.trim()}</p>
          <div className="flex items-center justify-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{order.store.city}</p>
          </div>
        </div>
        <div className="p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Invoice / Date</p>
          <p className="font-semibold text-sm">{order.invoiceNumber}</p>
          <p className="text-xs text-muted-foreground">{format(new Date(order.createdAt), "dd MMM yyyy")}</p>
        </div>
      </div>

      {/* QR Code */}
      {order.qrCodeUrl && (
        <div className="bg-white border-x px-6 py-4 flex items-center gap-4 border-t">
          <img src={order.qrCodeUrl} alt="Auth QR Code" className="w-20 h-20 rounded-lg" />
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <QrCode className="h-4 w-4 text-[#1A1A2E]" />
              <p className="text-sm font-semibold">Scan to Verify</p>
            </div>
            <p className="text-xs text-muted-foreground">Anyone can scan this QR code to verify the authenticity of this lens without logging in</p>
          </div>
        </div>
      )}

      {/* Lens Items */}
      <div className="bg-gray-50 border-x border-t px-6 py-4">
        <h2 className="font-bold text-[#1A1A2E] flex items-center gap-2 mb-4">
          <Shield className="h-4 w-4 text-[#E94560]" />
          Authenticated Lenses ({order.lensItems.length})
        </h2>

        <div className="space-y-4">
          {order.lensItems.map((item, idx) => {
            const snap = item.productSnapshot;
            const allBenefits = [...snap.benefits, ...snap.customBenefits];
            return (
              <div key={item.id} className="bg-white rounded-xl border p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold bg-[#E94560] text-white px-2 py-0.5 rounded-full">Lens {idx + 1}</span>
                      <span className="font-bold text-[#1A1A2E]">{snap.name}</span>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground">{snap.code}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  <Badge variant="info" className="text-xs">{snap.category}</Badge>
                  <Badge variant="success" className="text-xs">{snap.visionType}</Badge>
                  <Badge variant="warning" className="text-xs">{snap.warrantyDuration}</Badge>
                </div>

                {/* Power Table */}
                <div className="overflow-x-auto mb-3">
                  <table className="w-full text-sm border-collapse rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-[#1A1A2E] text-white">
                        <th className="px-3 py-2 text-left text-xs font-medium w-24">Eye</th>
                        <th className="px-3 py-2 text-center text-xs font-medium">SPH</th>
                        <th className="px-3 py-2 text-center text-xs font-medium">CYL</th>
                        <th className="px-3 py-2 text-center text-xs font-medium">AXIS</th>
                        <th className="px-3 py-2 text-center text-xs font-medium">ADD</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b bg-white">
                        <td className="px-3 py-2 text-xs font-semibold text-gray-600">Right (OD)</td>
                        <td className="px-3 py-2 text-center text-sm">{item.rightEyeSph || "—"}</td>
                        <td className="px-3 py-2 text-center text-sm">{item.rightEyeCyl || "—"}</td>
                        <td className="px-3 py-2 text-center text-sm">{item.rightEyeAxis || "—"}</td>
                        <td className="px-3 py-2 text-center text-sm">{item.rightEyeAdd || "—"}</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-3 py-2 text-xs font-semibold text-gray-600">Left (OS)</td>
                        <td className="px-3 py-2 text-center text-sm">{item.leftEyeSph || "—"}</td>
                        <td className="px-3 py-2 text-center text-sm">{item.leftEyeCyl || "—"}</td>
                        <td className="px-3 py-2 text-center text-sm">{item.leftEyeAxis || "—"}</td>
                        <td className="px-3 py-2 text-center text-sm">{item.leftEyeAdd || "—"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Benefits */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {allBenefits.map((b, i) => (
                    <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100 font-medium">
                      {b}
                    </span>
                  ))}
                </div>

                {/* Progressive Features */}
                {snap.progressiveFeatures.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-purple-700 mb-1">Progressive Features</p>
                    <div className="flex flex-wrap gap-1">
                      {snap.progressiveFeatures.map((f, i) => (
                        <span key={i} className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-100">{f}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warranty */}
                <div className="mt-3 bg-amber-50 border border-amber-100 rounded-lg p-2.5">
                  <p className="text-xs font-semibold text-amber-800">Warranty: {snap.warrantyDuration}</p>
                  <p className="text-xs text-amber-700 mt-0.5">{snap.warrantyPolicy}</p>
                </div>

                {item.notes && (
                  <p className="text-xs text-muted-foreground italic mt-2">📝 {item.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lens Care Tips */}
      {lensCareTips.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 border-x border-t mx-0 px-6 py-4">
          <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
            <span>💡</span> Lens Care Tips
          </h3>
          <div className="space-y-3">
            {lensCareTips.map((tip) => (
              <div key={tip.id} className="border-l-2 border-amber-400 pl-3">
                <p className="text-sm font-semibold text-amber-900">{tip.title}</p>
                <p className="text-xs text-amber-700 mt-0.5">{tip.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Store Contact */}
      {(order.store.phone || order.store.address) && (
        <div className="bg-white border-x border-t px-6 py-4">
          <h3 className="text-sm font-semibold text-[#1A1A2E] mb-2">Store Contact</h3>
          <p className="text-sm font-medium">{order.store.name}</p>
          {order.store.address && <p className="text-xs text-muted-foreground">{order.store.address}</p>}
          {order.store.phone && (
            <div className="flex items-center gap-1 mt-1">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{order.store.phone}</span>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="bg-[#1A1A2E] text-white rounded-b-2xl px-6 py-4 text-center">
        <p className="text-xs text-white/50">
          This authentication was digitally issued by Lenstrack. For support, contact your store.
        </p>
        <p className="text-xs text-white/30 mt-1">lenstrack.com · Authenticated on {format(new Date(order.createdAt), "dd MMMM yyyy")}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 pb-2">
        {order.pdfUrl && (
          <a href={order.pdfUrl} target="_blank" rel="noreferrer" className="flex-1">
            <Button variant="outline" className="w-full gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </a>
        )}
        <Button
          className="flex-1 bg-[#1A1A2E] hover:bg-[#2d2d5e] gap-2"
          onClick={handleShare}
        >
          <Share2 className="h-4 w-4" />
          Share Link
        </Button>
      </div>
    </div>
  );
}

export default function CustomerOrderDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery<{ data: { order: Order; lensCareTips: LensCareTip[] } }>({
    queryKey: ["customer-order", id],
    queryFn: () => fetch(`/api/customer/orders/${id}`).then((r) => r.json()) as Promise<{ data: { order: Order; lensCareTips: LensCareTip[] } }>,
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data?.data?.order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg font-semibold">Order not found</p>
          <Link href="/account/orders" className="text-[#E94560] hover:underline text-sm mt-2 block">Back to orders</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-4 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/account/orders" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4" />
          My Orders
        </Link>
        <AuthCard order={data.data.order} lensCareTips={data.data.lensCareTips} />
      </div>
    </div>
  );
}
