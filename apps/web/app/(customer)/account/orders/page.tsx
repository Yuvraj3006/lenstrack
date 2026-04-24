"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, LogOut, ShoppingBag, Calendar, MapPin } from "lucide-react";
import { toast } from "sonner";
import { JWT_COOKIE_NAMES } from "@lenstrack/config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Order {
  id: string;
  authCode: string;
  invoiceNumber: string;
  customerName: string;
  createdAt: string;
  store: { name: string; city: string };
  _count: { lensItems: number };
}

export default function CustomerOrdersPage() {
  const router = useRouter();

  const { data, isLoading } = useQuery<{ data: { orders: Order[]; total: number } }>({
    queryKey: ["customer-orders"],
    queryFn: () => fetch("/api/customer/orders").then((r) => r.json()) as Promise<{ data: { orders: Order[]; total: number } }>,
  });

  async function handleLogout() {
    await fetch("/api/customer/auth/logout", { method: "POST" });
    toast.success("Logged out");
    router.push("/verify");
  }

  const orders = data?.data?.orders || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#1A1A2E] text-white">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-[#E94560]" />
            <span className="font-bold">Lens<span className="text-[#E94560]">track</span></span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white">
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1A1A2E]">My Authentications</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {data?.data?.total ?? "..."} digitally authenticated lenses
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-xl" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h2 className="text-lg font-semibold text-gray-600">No authentications yet</h2>
            <p className="text-gray-400 text-sm mt-1">Your authenticated lenses will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                          ✓ Authenticated
                        </span>
                      </div>
                      <p className="font-bold text-[#1A1A2E]">{order.store.name.split("-").pop()?.trim()}</p>
                    </div>
                    <Badge variant="info">{order._count.lensItems} lens{order._count.lensItems > 1 ? "es" : ""}</Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {order.store.city}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(new Date(order.createdAt), "dd MMM yyyy")}
                    </div>
                    <div className="text-xs font-mono text-gray-400">#{order.invoiceNumber}</div>
                  </div>

                  <Link href={`/account/orders/${order.id}`}>
                    <Button className="w-full bg-[#1A1A2E] hover:bg-[#2d2d5e] h-9 text-sm">
                      View Authentication Card
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
