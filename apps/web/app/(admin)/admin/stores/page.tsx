"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil, Search, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const storeSchema = z.object({
  name: z.string().min(2, "Name required"),
  city: z.string().min(2, "City required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().default(true),
});

type StoreForm = z.infer<typeof storeSchema>;

interface Store {
  id: string;
  name: string;
  city: string;
  address?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  _count: { users: number; orders: number };
}

export default function AdminStoresPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editStore, setEditStore] = useState<Store | null>(null);

  const { data, isLoading } = useQuery<{ data: { stores: Store[]; total: number; pages: number } }>({
    queryKey: ["admin-stores", search, page],
    queryFn: () =>
      fetch(`/api/admin/stores?search=${search}&page=${page}`).then((r) => r.json()) as Promise<{ data: { stores: Store[]; total: number; pages: number } }>,
  });

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<StoreForm>({
    resolver: zodResolver(storeSchema),
    defaultValues: { isActive: true },
  });

  const createMutation = useMutation({
    mutationFn: (data: StoreForm) =>
      fetch("/api/admin/stores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: (res: { success: boolean; error?: string }) => {
      if (!res.success) { toast.error(res.error); return; }
      toast.success("Store created successfully");
      qc.invalidateQueries({ queryKey: ["admin-stores"] });
      setDialogOpen(false);
      reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: StoreForm }) =>
      fetch(`/api/admin/stores/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: (res: { success: boolean; error?: string }) => {
      if (!res.success) { toast.error(res.error); return; }
      toast.success("Store updated successfully");
      qc.invalidateQueries({ queryKey: ["admin-stores"] });
      setDialogOpen(false);
      setEditStore(null);
      reset();
    },
  });

  function openCreate() {
    setEditStore(null);
    reset({ name: "", city: "", address: "", phone: "", isActive: true });
    setDialogOpen(true);
  }

  function openEdit(store: Store) {
    setEditStore(store);
    reset({ name: store.name, city: store.city, address: store.address || "", phone: store.phone || "", isActive: store.isActive });
    setDialogOpen(true);
  }

  function onSubmit(formData: StoreForm) {
    if (editStore) {
      updateMutation.mutate({ id: editStore.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  }

  const stores = data?.data?.stores || [];
  const totalPages = data?.data?.pages || 1;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Stores</h1>
          <p className="text-muted-foreground">Manage Lenstrack retail stores</p>
        </div>
        <Button onClick={openCreate} className="bg-[#1A1A2E] hover:bg-[#2d2d5e]">
          <Plus className="h-4 w-4 mr-2" />
          Add Store
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stores..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store Name</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(7)].map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : stores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <Building2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    No stores found
                  </TableCell>
                </TableRow>
              ) : (
                stores.map((store) => (
                  <TableRow key={store.id}>
                    <TableCell className="font-medium">{store.name}</TableCell>
                    <TableCell>{store.city}</TableCell>
                    <TableCell>{store._count.users}</TableCell>
                    <TableCell>{store._count.orders}</TableCell>
                    <TableCell>
                      <Badge variant={store.isActive ? "success" : "secondary"}>
                        {store.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(store.createdAt), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(store)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
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

      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) { setDialogOpen(false); setEditStore(null); reset(); } else setDialogOpen(true); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editStore ? "Edit Store" : "Create New Store"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Store Name *</Label>
              <Input placeholder="e.g. Lenstrack Vision Center - Bandra" {...register("name")} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>City *</Label>
              <Input placeholder="e.g. Mumbai" {...register("city")} />
              {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input placeholder="Full address" {...register("address")} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input placeholder="10-digit mobile" {...register("phone")} />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={true}
                onCheckedChange={(v) => setValue("isActive", v)}
                id="isActive"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); setEditStore(null); reset(); }}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#1A1A2E]" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                {editStore ? "Update Store" : "Create Store"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
