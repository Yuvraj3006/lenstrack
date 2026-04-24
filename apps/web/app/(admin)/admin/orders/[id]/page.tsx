"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle2, QrCode, Download } from "lucide-react";
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
  storeUser: { name: string; email: string };
  lensItems: LensItem[];
}

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery<{ data: Order }>({
    queryKey: ["admin-order", id],
    queryFn: () => fetch(`/api/admin/orders/${id}`).then((r) => r.json()) as Promise<{ data: Order }>,
  });

  const order = data?.data;

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!order) return <div className="p-6">Order not found</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/orders">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Order Detail</h1>
          <p className="text-muted-foreground font-mono text-sm">{order.authCode}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <CardTitle className="text-base">Authentication Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium">Auth Code</p>
                  <p className="font-mono text-sm font-semibold mt-1">{order.authCode}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium">Invoice No.</p>
                  <p className="text-sm font-semibold mt-1">{order.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium">Date</p>
                  <p className="text-sm mt-1">{format(new Date(order.createdAt), "dd MMM yyyy, HH:mm")}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-t pt-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium">Customer</p>
                  <p className="text-sm font-semibold mt-1">{order.customerName}</p>
                  <p className="text-xs text-muted-foreground">{order.customer.mobile}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium">Store</p>
                  <p className="text-sm font-semibold mt-1">{order.store.name}</p>
                  <p className="text-xs text-muted-foreground">{order.store.city}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium">Issued By</p>
                  <p className="text-sm font-semibold mt-1">{order.storeUser.name}</p>
                  <p className="text-xs text-muted-foreground">{order.storeUser.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Lens Items ({order.lensItems.length})</h2>
            {order.lensItems.map((item, idx) => {
              const snap = item.productSnapshot;
              return (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="brand" className="text-xs">Lens {idx + 1}</Badge>
                          <h3 className="font-semibold text-lg">{snap.name}</h3>
                          <span className="text-xs text-muted-foreground font-mono">{snap.code}</span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="info">{snap.category}</Badge>
                          <Badge variant="success">{snap.visionType}</Badge>
                          <Badge variant="outline">{snap.warrantyDuration}</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto mb-4">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-[#1A1A2E] text-white">
                            <th className="px-3 py-2 text-left text-xs">Eye</th>
                            <th className="px-3 py-2 text-center text-xs">SPH</th>
                            <th className="px-3 py-2 text-center text-xs">CYL</th>
                            <th className="px-3 py-2 text-center text-xs">AXIS</th>
                            <th className="px-3 py-2 text-center text-xs">ADD</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="px-3 py-2 font-medium text-xs">Right (OD)</td>
                            <td className="px-3 py-2 text-center">{item.rightEyeSph || "—"}</td>
                            <td className="px-3 py-2 text-center">{item.rightEyeCyl || "—"}</td>
                            <td className="px-3 py-2 text-center">{item.rightEyeAxis || "—"}</td>
                            <td className="px-3 py-2 text-center">{item.rightEyeAdd || "—"}</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 font-medium text-xs">Left (OS)</td>
                            <td className="px-3 py-2 text-center">{item.leftEyeSph || "—"}</td>
                            <td className="px-3 py-2 text-center">{item.leftEyeCyl || "—"}</td>
                            <td className="px-3 py-2 text-center">{item.leftEyeAxis || "—"}</td>
                            <td className="px-3 py-2 text-center">{item.leftEyeAdd || "—"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {[...snap.benefits, ...snap.customBenefits].map((b, i) => (
                        <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100">{b}</span>
                      ))}
                    </div>

                    {item.notes && (
                      <p className="text-xs text-muted-foreground italic">Notes: {item.notes}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              {order.qrCodeUrl ? (
                <img src={order.qrCodeUrl} alt="QR Code" className="mx-auto w-48 h-48" />
              ) : (
                <div className="w-48 h-48 bg-gray-100 rounded-lg mx-auto flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">QR generating...</p>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Scan to verify authentication
              </p>
            </CardContent>
          </Card>

          {order.pdfUrl && (
            <Card>
              <CardContent className="p-4">
                <a href={order.pdfUrl} target="_blank" rel="noreferrer">
                  <Button variant="outline" className="w-full gap-2">
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                </a>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Warranty</CardTitle>
            </CardHeader>
            <CardContent>
              {order.lensItems[0] && (
                <p className="text-xs text-muted-foreground">{order.lensItems[0].productSnapshot.warrantyPolicy}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
