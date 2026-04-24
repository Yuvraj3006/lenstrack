"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, GripVertical, AppWindow } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

const tipSchema = z.object({
  title: z.string().min(2, "Title required"),
  content: z.string().min(5, "Content required"),
});
type TipForm = z.infer<typeof tipSchema>;

interface Tip {
  id: string;
  title: string;
  content: string;
  order: number;
  isActive: boolean;
}

function SortableTip({ tip, onEdit, onDelete }: { tip: Tip; onEdit: (tip: Tip) => void; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: tip.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-3 p-4 bg-white border rounded-lg shadow-sm">
      <button {...attributes} {...listeners} className="mt-1 cursor-grab text-gray-400 hover:text-gray-600">
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1">
        <h3 className="font-semibold text-sm">{tip.title}</h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{tip.content}</p>
      </div>
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => onEdit(tip)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(tip.id)} className="text-red-500 hover:text-red-700">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function AdminLensCarePage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTip, setEditTip] = useState<Tip | null>(null);
  const [preview, setPreview] = useState(false);

  const { data, isLoading } = useQuery<{ data: Tip[] }>({
    queryKey: ["lens-care-tips"],
    queryFn: () => fetch("/api/admin/lens-care").then((r) => r.json()) as Promise<{ data: Tip[] }>,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<TipForm>({
    resolver: zodResolver(tipSchema),
  });

  const createMutation = useMutation({
    mutationFn: (body: TipForm & { order: number }) =>
      fetch("/api/admin/lens-care", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: (res: { success: boolean; error?: string }) => {
      if (!res.success) { toast.error(res.error); return; }
      toast.success("Tip created");
      qc.invalidateQueries({ queryKey: ["lens-care-tips"] });
      setDialogOpen(false);
      reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Tip> }) =>
      fetch(`/api/admin/lens-care/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: (res: { success: boolean; error?: string }) => {
      if (!res.success) { toast.error(res.error); return; }
      toast.success("Tip updated");
      qc.invalidateQueries({ queryKey: ["lens-care-tips"] });
      setDialogOpen(false);
      setEditTip(null);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/admin/lens-care/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => {
      toast.success("Tip deleted");
      qc.invalidateQueries({ queryKey: ["lens-care-tips"] });
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const tips = data?.data || [];

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = tips.findIndex((t) => t.id === active.id);
    const newIdx = tips.findIndex((t) => t.id === over.id);
    const reordered = arrayMove(tips, oldIdx, newIdx);
    reordered.forEach((tip, idx) => {
      updateMutation.mutate({ id: tip.id, body: { order: idx + 1 } });
    });
  }

  function openEdit(tip: Tip) {
    setEditTip(tip);
    reset({ title: tip.title, content: tip.content });
    setDialogOpen(true);
  }

  function openCreate() {
    setEditTip(null);
    reset({ title: "", content: "" });
    setDialogOpen(true);
  }

  function onSubmit(formData: TipForm) {
    if (editTip) {
      updateMutation.mutate({ id: editTip.id, body: formData });
    } else {
      createMutation.mutate({ ...formData, order: tips.length + 1 });
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Lens Care Tips</h1>
          <p className="text-muted-foreground">Manage tips shown on the authentication card</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPreview(!preview)} className="gap-2">
            <AppWindow className="h-4 w-4" />
            {preview ? "Hide Preview" : "Preview"}
          </Button>
          <Button onClick={openCreate} className="bg-[#1A1A2E] hover:bg-[#2d2d5e]">
            <Plus className="h-4 w-4 mr-2" />
            Add Tip
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tips (Drag to reorder)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={tips.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {tips.map((tip) => (
                      <SortableTip
                        key={tip.id}
                        tip={tip}
                        onEdit={openEdit}
                        onDelete={(id) => deleteMutation.mutate(id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>

        {preview && (
          <Card className="bg-amber-50 border-amber-200">
            <CardHeader>
              <CardTitle className="text-base text-amber-800">Preview — How it looks on the card</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tips.map((tip) => (
                <div key={tip.id}>
                  <h4 className="font-semibold text-sm text-amber-900">{tip.title}</h4>
                  <p className="text-xs text-amber-700 mt-0.5">{tip.content}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTip ? "Edit Tip" : "Add Lens Care Tip"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input placeholder="e.g. Clean with Microfiber Cloth" {...register("title")} />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Content *</Label>
              <Textarea placeholder="Tip content..." rows={4} {...register("content")} />
              {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); setEditTip(null); reset(); }}>Cancel</Button>
              <Button type="submit" className="bg-[#1A1A2E]" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                {editTip ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
