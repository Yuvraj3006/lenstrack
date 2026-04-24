"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { CheckCircle2, XCircle, Eye, Shield, MapPin, Phone, QrCode } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductSnapshot {
  code: string;
  name: string;
  category: string;
  visionType: string;
  warrantyDuration: string;
  warrantyPolicy: string;
  benefits: string[];
  customBenefits: string[];
  progressiveFeatures: string[];
}

interface LensCareTip {
  id: string;
  title: string;
  content: string;
}

interface Order {
  id: string;
  authCode: string;
  invoiceNumber: string;
  customerName: string;
  createdAt: string;
  qrCodeUrl?: string;
  store: { name: string; city: string; address?: string; phone?: string };
  customer: { mobile: string };
  lensItems: {
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
  }[];
}

export default function PublicVerifyPage() {
  const { authCode } = useParams<{ authCode: string }>();

  const { data, isLoading, isError } = useQuery<{ data: { order: Order; lensCareTips: LensCareTip[] } }>({
    queryKey: ["public-verify", authCode],
    queryFn: () => fetch(`/api/verify/${authCode}`).then((r) => r.json()) as Promise<{ data: { order: Order; lensCareTips: LensCareTip[] } }>,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1A1A2E] to-[#2d2d5e] flex items-center justify-center p-4">
        <div className="max-w-lg w-full space-y-4">
          <Skeleton className="h-48 w-full rounded-2xl bg-white/10" />
          <Skeleton className="h-32 w-full rounded-xl bg-white/10" />
        </div>
      </div>
    );
  }

  if (isError || !data?.data?.order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1A1A2E] to-[#2d2d5e] flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <XCircle className="h-20 w-20 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Authentication Not Found</h1>
          <p className="text-white/60">This authentication code is invalid or does not exist.</p>
        </div>
      </div>
    );
  }

  const { order, lensCareTips } = data.data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1A2E] to-[#2d2d5e] py-6 px-4">
      <div className="max-w-lg mx-auto">
        {/* Top brand */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Eye className="h-6 w-6 text-[#E94560]" />
            <span className="text-2xl font-bold text-white">Lens<span className="text-[#E94560]">track</span></span>
          </div>
          <p className="text-white/40 text-xs">Digital Lens Authentication Platform</p>
        </div>

        {/* Verified banner */}
        <div className="bg-green-500/20 border border-green-400/40 rounded-2xl p-5 mb-4 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-2" />
          <h2 className="text-xl font-bold text-green-300">Genuine Lenstrack Lens</h2>
          <p className="text-green-400/80 text-sm mt-1">This lens has been digitally authenticated by Lenstrack</p>
          <p className="text-white/50 font-mono text-xs mt-2">{order.authCode}</p>
        </div>

        {/* Details card */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl mb-4">
          <div className="bg-[#1A1A2E] px-5 py-3 flex justify-between items-center">
            <div>
              <p className="text-white/60 text-xs">Customer</p>
              <p className="text-white font-semibold">{order.customerName}</p>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-xs">Date</p>
              <p className="text-white text-sm">{format(new Date(order.createdAt), "dd MMM yyyy")}</p>
            </div>
          </div>

          <div className="p-4 border-b bg-gray-50 flex items-center gap-3">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold">{order.store.name}</p>
              <p className="text-xs text-muted-foreground">{order.store.city}{order.store.address ? `, ${order.store.address}` : ""}</p>
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-[#E94560]" />
              <span className="font-semibold text-sm">Authenticated Lenses</span>
            </div>

            <div className="space-y-3">
              {order.lensItems.map((item, idx) => {
                const snap = item.productSnapshot;
                return (
                  <div key={item.id} className="bg-gray-50 rounded-xl p-3 border">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold bg-[#E94560] text-white px-2 py-0.5 rounded-full">Lens {idx + 1}</span>
                      <span className="font-semibold text-sm">{snap.name}</span>
                    </div>
                    <div className="flex gap-1.5 flex-wrap mb-2">
                      <Badge variant="info" className="text-xs">{snap.category}</Badge>
                      <Badge variant="success" className="text-xs">{snap.visionType}</Badge>
                      <Badge variant="warning" className="text-xs">{snap.warrantyDuration}</Badge>
                    </div>

                    <table className="w-full text-xs border-collapse mb-2">
                      <thead>
                        <tr className="bg-[#1A1A2E] text-white">
                          <th className="px-2 py-1 text-left">Eye</th>
                          <th className="px-2 py-1 text-center">SPH</th>
                          <th className="px-2 py-1 text-center">CYL</th>
                          <th className="px-2 py-1 text-center">AXIS</th>
                          <th className="px-2 py-1 text-center">ADD</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b bg-white"><td className="px-2 py-1 font-medium">Right</td><td className="px-2 py-1 text-center">{item.rightEyeSph || "—"}</td><td className="px-2 py-1 text-center">{item.rightEyeCyl || "—"}</td><td className="px-2 py-1 text-center">{item.rightEyeAxis || "—"}</td><td className="px-2 py-1 text-center">{item.rightEyeAdd || "—"}</td></tr>
                        <tr><td className="px-2 py-1 font-medium">Left</td><td className="px-2 py-1 text-center">{item.leftEyeSph || "—"}</td><td className="px-2 py-1 text-center">{item.leftEyeCyl || "—"}</td><td className="px-2 py-1 text-center">{item.leftEyeAxis || "—"}</td><td className="px-2 py-1 text-center">{item.leftEyeAdd || "—"}</td></tr>
                      </tbody>
                    </table>

                    <div className="flex flex-wrap gap-1">
                      {[...snap.benefits, ...snap.customBenefits].map((b, i) => (
                        <span key={i} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">{b}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {lensCareTips.length > 0 && (
            <div className="p-4 bg-amber-50 border-t border-amber-100">
              <p className="text-xs font-bold text-amber-900 mb-2">💡 Lens Care Tips</p>
              <div className="space-y-2">
                {lensCareTips.slice(0, 3).map((tip) => (
                  <div key={tip.id}>
                    <p className="text-xs font-semibold text-amber-800">{tip.title}</p>
                    <p className="text-xs text-amber-700">{tip.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-3 bg-[#1A1A2E] text-center">
            <p className="text-white/40 text-xs">This authentication was digitally issued by Lenstrack.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
