"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil, Search, Package, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

const productSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Category required"),
  visionTypeId: z.string().min(1, "Vision type required"),
  warrantyDurationId: z.string().min(1, "Warranty required"),
  warrantyPolicy: z.string().min(5),
  commonBenefitIds: z.array(z.string()).default([]),
  customBenefits: z.array(z.string()).default([]),
  progressiveFeatures: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

type ProductForm = z.infer<typeof productSchema>;

interface Product {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  category: { name: string };
  visionType: { name: string };
  warrantyDuration: { label: string };
  commonBenefits: { commonBenefit: { label: string } }[];
  progressiveFeatures: { label: string }[];
}

interface Master {
  id: string;
  name?: string;
  label?: string;
}

function Textarea2({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ""}`} {...props} />;
}

export default function AdminProductsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [customBenefitInput, setCustomBenefitInput] = useState("");
  const [progressiveInput, setProgressiveInput] = useState("");

  const { data, isLoading } = useQuery<{ data: { products: Product[]; total: number; pages: number } }>({
    queryKey: ["admin-products", search, page, categoryFilter],
    queryFn: () =>
      fetch(`/api/admin/products?search=${search}&page=${page}&categoryId=${categoryFilter}`).then((r) => r.json()) as Promise<{ data: { products: Product[]; total: number; pages: number } }>,
  });

  const { data: categories } = useQuery<{ data: Master[] }>({ queryKey: ["categories"], queryFn: () => fetch("/api/admin/masters/categories").then((r) => r.json()) as Promise<{ data: Master[] }> });
  const { data: visionTypes } = useQuery<{ data: Master[] }>({ queryKey: ["visionTypes"], queryFn: () => fetch("/api/admin/masters/vision-types").then((r) => r.json()) as Promise<{ data: Master[] }> });
  const { data: warranties } = useQuery<{ data: Master[] }>({ queryKey: ["warranties"], queryFn: () => fetch("/api/admin/masters/warranty-durations").then((r) => r.json()) as Promise<{ data: Master[] }> });
  const { data: benefits } = useQuery<{ data: Master[] }>({ queryKey: ["benefits"], queryFn: () => fetch("/api/admin/masters/benefits").then((r) => r.json()) as Promise<{ data: Master[] }> });

  const { register, handleSubmit, reset, setValue, watch, control, formState: { errors, isSubmitting } } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { commonBenefitIds: [], customBenefits: [], progressiveFeatures: [], isActive: true },
  });

  const watchedBenefitIds = watch("commonBenefitIds");
  const watchedCustomBenefits = watch("customBenefits");
  const watchedProgressiveFeatures = watch("progressiveFeatures");
  const watchedVisionTypeId = watch("visionTypeId");

  const selectedVisionType = (visionTypes?.data || []).find((v) => v.id === watchedVisionTypeId);
  const isProgressive = selectedVisionType?.name === "Progressive";

  const createMutation = useMutation({
    mutationFn: (data: ProductForm) =>
      fetch("/api/admin/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: (res: { success: boolean; error?: string }) => {
      if (!res.success) { toast.error(res.error); return; }
      toast.success("Product created");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      setDialogOpen(false);
      reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductForm }) =>
      fetch(`/api/admin/products/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: (res: { success: boolean; error?: string }) => {
      if (!res.success) { toast.error(res.error); return; }
      toast.success("Product updated");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      setDialogOpen(false);
      setEditProduct(null);
      reset();
    },
  });

  function openCreate() {
    setEditProduct(null);
    reset({ code: "", name: "", description: "", warrantyPolicy: "", commonBenefitIds: [], customBenefits: [], progressiveFeatures: [], isActive: true });
    setDialogOpen(true);
  }

  function openEdit(product: Product) {
    setEditProduct(product);
    reset({
      code: product.code,
      name: product.name,
      isActive: product.isActive,
      categoryId: product.category ? undefined : "",
      visionTypeId: undefined,
      warrantyDurationId: undefined,
      warrantyPolicy: "",
      commonBenefitIds: product.commonBenefits.map((b) => b.commonBenefit.label),
      customBenefits: [],
      progressiveFeatures: product.progressiveFeatures.map((f) => f.label),
    });
    setDialogOpen(true);
  }

  function toggleBenefit(id: string) {
    const current = watchedBenefitIds;
    if (current.includes(id)) {
      setValue("commonBenefitIds", current.filter((b) => b !== id));
    } else {
      setValue("commonBenefitIds", [...current, id]);
    }
  }

  function addCustomBenefit() {
    if (!customBenefitInput.trim()) return;
    setValue("customBenefits", [...watchedCustomBenefits, customBenefitInput.trim()]);
    setCustomBenefitInput("");
  }

  function addProgressiveFeature() {
    if (!progressiveInput.trim()) return;
    setValue("progressiveFeatures", [...watchedProgressiveFeatures, progressiveInput.trim()]);
    setProgressiveInput("");
  }

  const products = data?.data?.products || [];
  const totalPages = data?.data?.pages || 1;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Products</h1>
          <p className="text-muted-foreground">Manage Lenstrack lens products</p>
        </div>
        <Button onClick={openCreate} className="bg-[#1A1A2E] hover:bg-[#2d2d5e]">
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search products..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
            </div>
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {(categories?.data || []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Vision Type</TableHead>
                <TableHead>Warranty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(7)].map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                  </TableRow>
                ))
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono text-xs">{product.code}</TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell><Badge variant="info">{product.category?.name}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{product.visionType?.name}</Badge></TableCell>
                    <TableCell className="text-sm">{product.warrantyDuration?.label}</TableCell>
                    <TableCell>
                      <Badge variant={product.isActive ? "success" : "secondary"}>
                        {product.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(product)}>
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

      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) { setDialogOpen(false); setEditProduct(null); reset(); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editProduct ? "Edit Product" : "Create Product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => editProduct ? updateMutation.mutate({ id: editProduct.id, data: d }) : createMutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Product Code *</Label>
                <Input placeholder="e.g. LT-SV-001" {...register("code")} />
                {errors.code && <p className="text-xs text-red-500">{errors.code.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Product Name *</Label>
                <Input placeholder="e.g. ClearVision Pro" {...register("name")} />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea2 placeholder="Product description..." {...register("description")} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Controller control={control} name="categoryId" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {(categories?.data || []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
                {errors.categoryId && <p className="text-xs text-red-500">{errors.categoryId.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Vision Type *</Label>
                <Controller control={control} name="visionTypeId" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {(visionTypes?.data || []).map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
                {errors.visionTypeId && <p className="text-xs text-red-500">{errors.visionTypeId.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Warranty *</Label>
                <Controller control={control} name="warrantyDurationId" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {(warranties?.data || []).map((w) => <SelectItem key={w.id} value={w.id}>{w.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
                {errors.warrantyDurationId && <p className="text-xs text-red-500">{errors.warrantyDurationId.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Warranty Policy *</Label>
              <Textarea2 placeholder="Describe the warranty policy..." {...register("warrantyPolicy")} />
              {errors.warrantyPolicy && <p className="text-xs text-red-500">{errors.warrantyPolicy.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Common Benefits</Label>
              <div className="flex flex-wrap gap-2">
                {(benefits?.data || []).map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => toggleBenefit(b.id)}
                    className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                      watchedBenefitIds.includes(b.id)
                        ? "bg-[#1A1A2E] text-white border-[#1A1A2E]"
                        : "bg-white text-gray-600 border-gray-300 hover:border-[#1A1A2E]"
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Custom Benefits</Label>
              <div className="flex gap-2">
                <Input placeholder="Add custom benefit" value={customBenefitInput} onChange={(e) => setCustomBenefitInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomBenefit(); } }} />
                <Button type="button" variant="outline" onClick={addCustomBenefit}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {watchedCustomBenefits.map((b, i) => (
                  <span key={i} className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200">
                    {b}
                    <button type="button" onClick={() => setValue("customBenefits", watchedCustomBenefits.filter((_, idx) => idx !== i))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {isProgressive && (
              <div className="space-y-2">
                <Label>Progressive Features</Label>
                <div className="flex gap-2">
                  <Input placeholder="Add progressive feature" value={progressiveInput} onChange={(e) => setProgressiveInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addProgressiveFeature(); } }} />
                  <Button type="button" variant="outline" onClick={addProgressiveFeature}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {watchedProgressiveFeatures.map((f, i) => (
                    <span key={i} className="flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full border border-purple-200">
                      {f}
                      <button type="button" onClick={() => setValue("progressiveFeatures", watchedProgressiveFeatures.filter((_, idx) => idx !== i))}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); setEditProduct(null); reset(); }}>Cancel</Button>
              <Button type="submit" className="bg-[#1A1A2E]" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                {editProduct ? "Update Product" : "Create Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
