"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import Link from "next/link";
import { FilePlus, ShoppingBag, TrendingUp, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Order {
  id: string;
  authCode: string;
  invoiceNumber: string;
  customerName: string;
  createdAt: string;
  customer: { mobile: string };
  _count: { lensItems: number };
}

export default function StoreDashboardPage() {
  const { data: meData } = useQuery<{ data: { name: string; store: { name: string; city: string } } }>({
    queryKey: ["store-me"],
    queryFn: () => fetch("/api/store/auth/me").then((r) => r.json()) as Promise<{ data: { name: string; store: { name: string; city: string } } }>,
  });

  const { data: ordersData, isLoading } = useQuery<{ data: { orders: Order[]; total: number } }>({
    queryKey: ["store-orders"],
    queryFn: () => fetch("/api/store/orders?limit=5").then((r) => r.json()) as Promise<{ data: { orders: Order[]; total: number } }>,
  });

  const me = meData?.data;
  const orders = ordersData?.data?.orders || [];
  const total = ordersData?.data?.total || 0;

  const today = format(new Date(), "yyyy-MM-dd");
  const todayOrders = orders.filter((o) => o.createdAt.startsWith(today)).length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Welcome, {me?.name?.split(" ")[0] || "—"}</h1>
        <p className="text-muted-foreground">{me?.store?.name}, {me?.store?.city}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Authentications</p>
                {isLoading ? <Skeleton className="h-8 w-16 mt-1" /> : <p className="text-3xl font-bold mt-1">{total}</p>}
              </div>
              <ShoppingBag className="h-8 w-8 text-[#1A1A2E] opacity-60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today</p>
                {isLoading ? <Skeleton className="h-8 w-8 mt-1" /> : <p className="text-3xl font-bold mt-1">{todayOrders}</p>}
              </div>
              <Calendar className="h-8 w-8 text-[#E94560] opacity-60" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#1A1A2E] text-white">
          <CardContent className="p-6">
            <p className="text-sm text-white/70 mb-3">Ready to authenticate a lens?</p>
            <Link href="/store/issue">
              <Button className="bg-[#E94560] hover:bg-[#c73550] w-full">
                <FilePlus className="h-4 w-4 mr-2" />
                Issue Authentication
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Authentications</CardTitle>
          <Link href="/store/orders" className="text-sm text-[#E94560] hover:underline">View all</Link>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-40" />
              No orders yet. Issue your first authentication!
            </div>
          ) : (
            <div className="divide-y">
              {orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{order.customerName}</p>
                    <p className="text-xs text-muted-foreground">{order.customer.mobile} · Invoice: {order.invoiceNumber}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="info">{order._count.lensItems} lens</Badge>
                    <span className="text-xs text-muted-foreground">{format(new Date(order.createdAt), "dd MMM, HH:mm")}</span>
                    <Link href={`/store/orders/${order.id}`} className="text-[#E94560] text-xs hover:underline">View</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
