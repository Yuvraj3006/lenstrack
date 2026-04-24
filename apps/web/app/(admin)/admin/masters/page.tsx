"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface MasterItem {
  id: string;
  name?: string;
  label?: string;
  months?: number;
  isActive?: boolean;
}

function MasterTable({
  endpoint,
  queryKey,
  displayKey,
  showMonths,
}: {
  endpoint: string;
  queryKey: string;
  displayKey: "name" | "label";
  showMonths?: boolean;
}) {
  const qc = useQueryClient();
  const [editId, setEditId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editMonths, setEditMonths] = useState("");
  const [addValue, setAddValue] = useState("");
  const [addMonths, setAddMonths] = useState("");
  const [adding, setAdding] = useState(false);

  const { data, isLoading } = useQuery<{ data: MasterItem[] }>({
    queryKey: [queryKey],
    queryFn: () => fetch(endpoint).then((r) => r.json()) as Promise<{ data: MasterItem[] }>,
  });

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: (res: { success: boolean; error?: string }) => {
      if (!res.success) { toast.error(res.error); return; }
      toast.success("Created successfully");
      qc.invalidateQueries({ queryKey: [queryKey] });
      setAddValue("");
      setAddMonths("");
      setAdding(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      fetch(`${endpoint}/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: (res: { success: boolean; error?: string }) => {
      if (!res.success) { toast.error(res.error); return; }
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: [queryKey] });
      setEditId(null);
    },
  });

  function startEdit(item: MasterItem) {
    setEditId(item.id);
    setEditValue(item[displayKey] || "");
    setEditMonths(item.months?.toString() || "");
  }

  function saveEdit(id: string) {
    const body: Record<string, unknown> = { [displayKey]: editValue };
    if (showMonths) body.months = parseInt(editMonths);
    updateMutation.mutate({ id, body });
  }

  function handleAdd() {
    const body: Record<string, unknown> = { [displayKey]: addValue };
    if (showMonths) body.months = parseInt(addMonths);
    createMutation.mutate(body);
  }

  const items = data?.data || [];

  return (
    <div className="space-y-4">
      {adding ? (
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <Input
            placeholder={`Enter ${displayKey}...`}
            value={addValue}
            onChange={(e) => setAddValue(e.target.value)}
            className="max-w-xs"
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") { setAdding(false); setAddValue(""); } }}
          />
          {showMonths && (
            <Input
              type="number"
              placeholder="Months"
              value={addMonths}
              onChange={(e) => setAddMonths(e.target.value)}
              className="w-24"
            />
          )}
          <Button size="sm" onClick={handleAdd} disabled={!addValue.trim() || createMutation.isPending} className="bg-[#1A1A2E]">
            <Check className="h-4 w-4 mr-1" /> Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setAddValue(""); }}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setAdding(true)} className="gap-1">
          <Plus className="h-3 w-3" /> Add New
        </Button>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            {showMonths && <TableHead>Months</TableHead>}
            <TableHead>Status</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                {showMonths && <TableCell><Skeleton className="h-4 w-12" /></TableCell>}
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-8" /></TableCell>
              </TableRow>
            ))
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {editId === item.id ? (
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="h-8 max-w-xs"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === "Enter") saveEdit(item.id); if (e.key === "Escape") setEditId(null); }}
                    />
                  ) : (
                    <span className="font-medium">{item[displayKey]}</span>
                  )}
                </TableCell>
                {showMonths && (
                  <TableCell>
                    {editId === item.id ? (
                      <Input
                        type="number"
                        value={editMonths}
                        onChange={(e) => setEditMonths(e.target.value)}
                        className="h-8 w-20"
                      />
                    ) : (
                      item.months
                    )}
                  </TableCell>
                )}
                <TableCell>
                  <Badge variant={item.isActive !== false ? "success" : "secondary"}>
                    {item.isActive !== false ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {editId === item.id ? (
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => saveEdit(item.id)} className="h-7 px-2 bg-[#1A1A2E]">
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditId(null)} className="h-7 px-2">
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => startEdit(item)} className="h-7 px-2">
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default function AdminMastersPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Master Data</h1>
        <p className="text-muted-foreground">Manage product categories, vision types, warranty durations, and benefits</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="categories">
            <TabsList className="mb-6">
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="vision-types">Vision Types</TabsTrigger>
              <TabsTrigger value="warranties">Warranty Durations</TabsTrigger>
              <TabsTrigger value="benefits">Common Benefits</TabsTrigger>
            </TabsList>

            <TabsContent value="categories">
              <MasterTable endpoint="/api/admin/masters/categories" queryKey="categories" displayKey="name" />
            </TabsContent>
            <TabsContent value="vision-types">
              <MasterTable endpoint="/api/admin/masters/vision-types" queryKey="visionTypes" displayKey="name" />
            </TabsContent>
            <TabsContent value="warranties">
              <MasterTable endpoint="/api/admin/masters/warranty-durations" queryKey="warranties" displayKey="label" showMonths />
            </TabsContent>
            <TabsContent value="benefits">
              <MasterTable endpoint="/api/admin/masters/benefits" queryKey="benefits" displayKey="label" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
