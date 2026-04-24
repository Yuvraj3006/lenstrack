"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Search, Download, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface Order {
  id: string;
  authCode: string;
  invoiceNumber: string;
  customerName: string;
  createdAt: string;
  store: { name: string; city: string };
  customer: { mobile: string };
  _count: { lensItems: number };
}

interface Store {
  id: string;
  name: string;
  city: string;
}

export default function AdminOrdersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [storeId, setStoreId] = useState("");

  const { data, isLoading } = useQuery<{ data: { orders: Order[]; total: number; pages: number } }>({
    queryKey: ["admin-orders", search, page, storeId],
    queryFn: () =>
      fetch(`/api/admin/orders?search=${search}&page=${page}&storeId=${storeId}`).then((r) => r.json()) as Promise<{ data: { orders: Order[]; total: number; pages: number } }>,
  });

  const { data: storesData } = useQuery<{ data: { stores: Store[] } }>({
    queryKey: ["admin-stores-all"],
    queryFn: () => fetch("/api/admin/stores?limit=100").then((r) => r.json()) as Promise<{ data: { stores: Store[] } }>,
  });

  function handleExport() {
    const params = new URLSearchParams({ storeId });
    window.open(`/api/admin/reports/export?${params}`, "_blank");
  }

  const orders = data?.data?.orders || [];
  const totalPages = data?.data?.pages || 1;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Orders</h1>
          <p className="text-muted-foreground">All authentication records across stores</p>
        </div>
        <Button variant="outline" onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by mobile, invoice, auth code..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
            </div>
            <Select value={storeId} onValueChange={(v) => { setStoreId(v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Stores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stores</SelectItem>
                {(storesData?.data?.stores || []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name.split("-").pop()?.trim()} — {s.city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Auth Code</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Date</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(10)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(7)].map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                  </TableRow>
                ))
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id} className="cursor-pointer">
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {order.authCode.slice(0, 12)}...
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{order.invoiceNumber}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{order.customerName}</p>
                        <p className="text-xs text-muted-foreground">{order.customer.mobile}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{order.store.name.split("-").pop()?.trim()}</p>
                        <p className="text-xs text-muted-foreground">{order.store.city}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="info">{order._count.lensItems} lens{order._count.lensItems > 1 ? "es" : ""}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(order.createdAt), "dd MMM yyyy, HH:mm")}
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/orders/${order.id}`} className="text-[#E94560] hover:underline text-sm">
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="flex items-center px-4 text-sm">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
