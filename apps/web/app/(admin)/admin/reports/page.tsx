"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ["#1A1A2E", "#E94560", "#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b"];

interface TrendPoint {
  date: string;
  count: number;
}

interface SummaryData {
  totalOrders: number;
  uniqueCustomers: number;
  todayOrders: number;
  storeWise: { storeId: string; _count: { id: number }; store: { name: string; city: string } }[];
  productWise: { productId: string; _count: { id: number }; product: { name: string; code: string } }[];
}

export default function AdminReportsPage() {
  const [days, setDays] = useState("30");
  const [storeId, setStoreId] = useState("");

  const { data: trendData, isLoading: trendLoading } = useQuery<{ data: TrendPoint[] }>({
    queryKey: ["trends", days, storeId],
    queryFn: () => fetch(`/api/admin/reports/trends?days=${days}&storeId=${storeId}`).then((r) => r.json()) as Promise<{ data: TrendPoint[] }>,
  });

  const { data: summaryData, isLoading: summaryLoading } = useQuery<{ data: SummaryData }>({
    queryKey: ["summary", storeId],
    queryFn: () => fetch(`/api/admin/reports/summary?storeId=${storeId}`).then((r) => r.json()) as Promise<{ data: SummaryData }>,
  });

  const { data: storesData } = useQuery<{ data: { stores: { id: string; name: string; city: string }[] } }>({
    queryKey: ["admin-stores-all"],
    queryFn: () => fetch("/api/admin/stores?limit=100").then((r) => r.json()) as Promise<{ data: { stores: { id: string; name: string; city: string }[] } }>,
  });

  const trends = trendData?.data || [];
  const summary = summaryData?.data;

  const storeBarData = summary?.storeWise.map((s) => ({
    name: s.store?.city || "Unknown",
    count: s._count.id,
  })) || [];

  // Category-wise from product data (simplified)
  const productPieData = (summary?.productWise || []).slice(0, 6).map((p) => ({
    name: p.product?.name?.split(" ").slice(0, 2).join(" ") || "Unknown",
    value: p._count.id,
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Reports</h1>
          <p className="text-muted-foreground">Authentication analytics and insights</p>
        </div>
        <div className="flex gap-3">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={storeId} onValueChange={(v) => setStoreId(v === "all" ? "" : v)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Stores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stores</SelectItem>
              {(storesData?.data?.stores || []).map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Orders", value: summary?.totalOrders, color: "bg-[#1A1A2E]" },
          { label: "Unique Customers", value: summary?.uniqueCustomers, color: "bg-[#E94560]" },
          { label: "Today's Orders", value: summary?.todayOrders, color: "bg-blue-600" },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              {summaryLoading ? (
                <Skeleton className="h-8 w-24 mt-1" />
              ) : (
                <p className="text-3xl font-bold mt-1">{stat.value?.toLocaleString() ?? "—"}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {trendLoading ? <Skeleton className="h-64" /> : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => format(new Date(v), "MMM d")} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip labelFormatter={(l) => format(new Date(l), "MMM d, yyyy")} formatter={(v) => [v, "Orders"]} />
                  <Line type="monotone" dataKey="count" stroke="#E94560" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Store-wise Count</CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? <Skeleton className="h-64" /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={storeBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => [v, "Orders"]} />
                  <Bar dataKey="count" fill="#1A1A2E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Products Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? <Skeleton className="h-64" /> : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={productPieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false}>
                    {productPieData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [v, "Orders"]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Product-wise Issuance</CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8" />)}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-muted-foreground font-medium">Product</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {(summary?.productWise || []).map((p) => (
                    <tr key={p.productId} className="border-b">
                      <td className="py-2">
                        <p className="font-medium text-xs">{p.product?.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{p.product?.code}</p>
                      </td>
                      <td className="py-2 text-right font-semibold">{p._count.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
