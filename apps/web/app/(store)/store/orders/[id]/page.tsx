"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
}

interface Order {
  id: string;
  authCode: string;
  invoiceNumber: string;
  customerName: string;
  createdAt: string;
  qrCodeUrl?: string;
  store: { name: string; city: string };
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

export default function StoreOrderDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery<{ data: Order }>({
    queryKey: ["store-order", id],
    queryFn: () => fetch(`/api/store/orders/${id}`).then((r) => r.json()) as Promise<{ data: Order }>,
  });

  const order = data?.data;

  if (isLoading) return <div className="p-6"><Skeleton className="h-64 w-full" /></div>;
  if (!order) return <div className="p-6">Order not found</div>;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/store/orders">
          <Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[#1A1A2E]">Order #{order.invoiceNumber}</h1>
          <p className="text-muted-foreground font-mono text-xs">{order.authCode}</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 grid grid-cols-3 gap-4">
          <div><p className="text-xs text-muted-foreground">Customer</p><p className="font-semibold">{order.customerName}</p><p className="text-xs text-muted-foreground">{order.customer.mobile}</p></div>
          <div><p className="text-xs text-muted-foreground">Invoice / Date</p><p className="font-semibold">{order.invoiceNumber}</p><p className="text-xs text-muted-foreground">{format(new Date(order.createdAt), "dd MMM yyyy")}</p></div>
          <div>
            {order.qrCodeUrl && <img src={order.qrCodeUrl} alt="QR" className="w-24 h-24" />}
          </div>
        </CardContent>
      </Card>

      {order.lensItems.map((item, idx) => {
        const snap = item.productSnapshot;
        return (
          <Card key={item.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Badge variant="brand">Lens {idx + 1}</Badge>
                <CardTitle className="text-base">{snap.name}</CardTitle>
                <span className="text-xs font-mono text-muted-foreground">{snap.code}</span>
              </div>
              <div className="flex gap-2 mt-1">
                <Badge variant="info">{snap.category}</Badge>
                <Badge variant="success">{snap.visionType}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm border-collapse mb-3">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left px-3 py-2 text-xs font-medium">Eye</th>
                    <th className="text-center px-3 py-2 text-xs font-medium">SPH</th>
                    <th className="text-center px-3 py-2 text-xs font-medium">CYL</th>
                    <th className="text-center px-3 py-2 text-xs font-medium">AXIS</th>
                    <th className="text-center px-3 py-2 text-xs font-medium">ADD</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="px-3 py-2 text-xs font-medium">Right (OD)</td>
                    <td className="px-3 py-2 text-center">{item.rightEyeSph || "—"}</td>
                    <td className="px-3 py-2 text-center">{item.rightEyeCyl || "—"}</td>
                    <td className="px-3 py-2 text-center">{item.rightEyeAxis || "—"}</td>
                    <td className="px-3 py-2 text-center">{item.rightEyeAdd || "—"}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-xs font-medium">Left (OS)</td>
                    <td className="px-3 py-2 text-center">{item.leftEyeSph || "—"}</td>
                    <td className="px-3 py-2 text-center">{item.leftEyeCyl || "—"}</td>
                    <td className="px-3 py-2 text-center">{item.leftEyeAxis || "—"}</td>
                    <td className="px-3 py-2 text-center">{item.leftEyeAdd || "—"}</td>
                  </tr>
                </tbody>
              </table>
              <div className="flex flex-wrap gap-1.5">
                {[...snap.benefits, ...snap.customBenefits].map((b, i) => (
                  <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">{b}</span>
                ))}
              </div>
              {item.notes && <p className="text-xs text-muted-foreground italic mt-2">Notes: {item.notes}</p>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
