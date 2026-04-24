"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ShoppingBag, Store, Package, TrendingUp, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface SummaryData {
  totalOrders: number;
  totalStores: number;
  totalProducts: number;
  todayOrders: number;
  storeWise: { storeId: string; _count: { id: number }; store: { name: string; city: string } }[];
  recentOrders: {
    id: string;
    authCode: string;
    invoiceNumber: string;
    customerName: string;
    createdAt: string;
    store: { name: string; city: string };
    customer: { mobile: string };
  }[];
}

interface TrendPoint {
  date: string;
  count: number;
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  loading,
}: {
  title: string;
  value: number | undefined;
  icon: React.ElementType;
  color: string;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-20 mt-1" />
            ) : (
              <p className="text-3xl font-bold mt-1">{value?.toLocaleString()}</p>
            )}
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const { data: summaryData, isLoading: summaryLoading } = useQuery<{ data: SummaryData }>({
    queryKey: ["admin-summary"],
    queryFn: () => fetch("/api/admin/reports/summary").then((r) => r.json()) as Promise<{ data: SummaryData }>,
  });

  const { data: trendData, isLoading: trendLoading } = useQuery<{ data: TrendPoint[] }>({
    queryKey: ["admin-trends"],
    queryFn: () => fetch("/api/admin/reports/trends?days=30").then((r) => r.json()) as Promise<{ data: TrendPoint[] }>,
  });

  const summary = summaryData?.data;
  const trends = trendData?.data || [];

  const storeBarData = summary?.storeWise.map((s) => ({
    name: s.store?.name?.split(" ").slice(-1)[0] || s.storeId,
    count: s._count.id,
  })) || [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Dashboard</h1>
        <p className="text-muted-foreground">Overview of Lenstrack authentication activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Authentications"
          value={summary?.totalOrders}
          icon={ShoppingBag}
          color="bg-[#1A1A2E]"
          loading={summaryLoading}
        />
        <StatCard
          title="Total Stores"
          value={summary?.totalStores}
          icon={Store}
          color="bg-blue-600"
          loading={summaryLoading}
        />
        <StatCard
          title="Total Products"
          value={summary?.totalProducts}
          icon={Package}
          color="bg-purple-600"
          loading={summaryLoading}
        />
        <StatCard
          title="Today's Authentications"
          value={summary?.todayOrders}
          icon={TrendingUp}
          color="bg-[#E94560]"
          loading={summaryLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Daily Authentication Trend (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {trendLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => format(new Date(v), "MMM d")} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    labelFormatter={(l) => format(new Date(l), "MMM d, yyyy")}
                    formatter={(v) => [v, "Authentications"]}
                  />
                  <Line type="monotone" dataKey="count" stroke="#E94560" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 5 Stores</CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={storeBarData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={60} />
                  <Tooltip formatter={(v) => [v, "Orders"]} />
                  <Bar dataKey="count" fill="#1A1A2E" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Orders</CardTitle>
          <Link href="/admin/orders" className="text-sm text-[#E94560] hover:underline flex items-center gap-1">
            View all <ExternalLink className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {summaryLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Auth ID</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Customer</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Store</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Date</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {summary?.recentOrders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {order.authCode.slice(0, 8)}...
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <div>
                          <p className="font-medium">{order.customerName}</p>
                          <p className="text-muted-foreground text-xs">{order.customer.mobile}</p>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div>
                          <p className="font-medium">{order.store.name.split("-").pop()?.trim()}</p>
                          <p className="text-muted-foreground text-xs">{order.store.city}</p>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {format(new Date(order.createdAt), "dd MMM, HH:mm")}
                      </td>
                      <td className="py-3 px-2">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-[#E94560] hover:underline text-xs"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
