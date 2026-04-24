"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, Trash2, ChevronDown, ChevronUp, CheckCircle2, QrCode, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

interface Product {
  id: string;
  code: string;
  name: string;
  category: { name: string };
  visionType: { name: string };
  warrantyDuration: { label: string };
  commonBenefits: { commonBenefit: { label: string } }[];
  customBenefits: string[];
  progressiveFeatures: { label: string }[];
}

const lensItemSchema = z.object({
  productId: z.string().min(1, "Product required"),
  productName: z.string().optional(),
  rightEyeSph: z.string().optional(),
  rightEyeCyl: z.string().optional(),
  rightEyeAxis: z.string().optional(),
  rightEyeAdd: z.string().optional(),
  leftEyeSph: z.string().optional(),
  leftEyeCyl: z.string().optional(),
  leftEyeAxis: z.string().optional(),
  leftEyeAdd: z.string().optional(),
  notes: z.string().optional(),
});

const issueSchema = z.object({
  mobile: z.string().length(10, "Mobile must be 10 digits"),
  customerName: z.string().min(2, "Customer name required"),
  invoiceNumber: z.string().min(1, "Invoice number required"),
  lensItems: z.array(lensItemSchema).min(1),
});

type IssueForm = z.infer<typeof issueSchema>;

interface SuccessData {
  id: string;
  authCode: string;
  qrCodeUrl?: string;
  pdfUrl?: string;
  customerName: string;
  invoiceNumber: string;
  lensItems: unknown[];
}

function ProductSearch({ value, onChange }: { value: string; onChange: (id: string, product: Product) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setProducts([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/store/products?search=${encodeURIComponent(query)}`);
        const data = await res.json() as { data: Product[] };
        setProducts(data.data || []);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  function select(product: Product) {
    setSelectedProduct(product);
    setQuery(product.name);
    setOpen(false);
    onChange(product.id, product);
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); if (!e.target.value) { setSelectedProduct(null); onChange("", null as unknown as Product); } }}
          onFocus={() => setOpen(true)}
          placeholder="Search by name or code..."
          className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      {open && products.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {products.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => select(product)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-0"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{product.name}</span>
                <span className="text-xs text-muted-foreground font-mono">{product.code}</span>
              </div>
              <div className="flex gap-1.5 mt-1">
                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 rounded">{product.category.name}</span>
                <span className="text-xs bg-green-100 text-green-700 px-1.5 rounded">{product.visionType.name}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LensItemBlock({
  index,
  control,
  register,
  remove,
  canRemove,
}: {
  index: number;
  control: ReturnType<typeof useForm<IssueForm>>["control"];
  register: ReturnType<typeof useForm<IssueForm>>["register"];
  remove: () => void;
  canRemove: boolean;
}) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  return (
    <div className="bg-white border rounded-xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="bg-[#E94560] text-white text-xs font-bold px-2.5 py-1 rounded-full">Lens {index + 1}</span>
          <h3 className="font-semibold text-sm text-gray-700">Lens Details</h3>
        </div>
        {canRemove && (
          <Button type="button" variant="ghost" size="sm" onClick={remove} className="text-red-500 hover:text-red-700 hover:bg-red-50">
            <Trash2 className="h-4 w-4 mr-1" />
            Remove
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label>Product *</Label>
        <Controller
          control={control}
          name={`lensItems.${index}.productId`}
          render={({ field }) => (
            <ProductSearch
              value={field.value}
              onChange={(id, product) => {
                field.onChange(id);
                setSelectedProduct(product);
              }}
            />
          )}
        />
      </div>

      {selectedProduct && (
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="info" className="text-xs">{selectedProduct.category.name}</Badge>
            <Badge variant="success" className="text-xs">{selectedProduct.visionType.name}</Badge>
            <Badge variant="outline" className="text-xs">{selectedProduct.warrantyDuration.label}</Badge>
          </div>
          <div className="flex flex-wrap gap-1">
            {[...selectedProduct.commonBenefits.map((b) => b.commonBenefit.label), ...selectedProduct.customBenefits].map((b, i) => (
              <span key={i} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">{b}</span>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Lens Power</p>
        <div className="space-y-3">
          {(["Right Eye (OD)", "Left Eye (OS)"] as const).map((eyeLabel, eyeIdx) => {
            const prefix = eyeIdx === 0 ? "rightEye" : "leftEye";
            return (
              <div key={eyeLabel}>
                <p className="text-xs font-medium text-muted-foreground mb-2">{eyeLabel}</p>
                <div className="grid grid-cols-4 gap-2">
                      {(["Sph", "Cyl", "Axis", "Add"] as const).map((field) => {
                        type PowerField = `lensItems.${number}.rightEyeSph` | `lensItems.${number}.rightEyeCyl` | `lensItems.${number}.rightEyeAxis` | `lensItems.${number}.rightEyeAdd` | `lensItems.${number}.leftEyeSph` | `lensItems.${number}.leftEyeCyl` | `lensItems.${number}.leftEyeAxis` | `lensItems.${number}.leftEyeAdd`;
                        const fieldName = `lensItems.${index}.${prefix}${field}` as PowerField;
                        return (
                        <div key={field}>
                          <label className="text-xs text-center block text-muted-foreground mb-1">{field}</label>
                          <input
                            {...register(fieldName)}
                            placeholder={field === "Axis" ? "0–180" : "+/-0.00"}
                            className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm text-center ring-offset-background placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          />
                        </div>
                        );
                      })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notes (optional)</Label>
        <Textarea
          {...register(`lensItems.${index}.notes`)}
          placeholder="Any special instructions..."
          rows={2}
        />
      </div>
    </div>
  );
}

export default function StoreIssuePage() {
  const [success, setSuccess] = useState<SuccessData | null>(null);
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<IssueForm>({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      mobile: "",
      customerName: "",
      invoiceNumber: "",
      lensItems: [{ productId: "", rightEyeSph: "", rightEyeCyl: "", rightEyeAxis: "", rightEyeAdd: "", leftEyeSph: "", leftEyeCyl: "", leftEyeAxis: "", leftEyeAdd: "", notes: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lensItems" });
  const watchedMobile = watch("mobile");

  useEffect(() => {
    if (watchedMobile?.length === 10) {
      fetch(`/api/store/customers?mobile=${watchedMobile}`)
        .then((r) => r.json())
        .then((data: { data: { previousNames: string[] } }) => {
          setNameSuggestions(data.data?.previousNames || []);
        })
        .catch(() => {});
    } else {
      setNameSuggestions([]);
    }
  }, [watchedMobile]);

  async function onSubmit(data: IssueForm) {
    try {
      const res = await fetch("/api/store/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json() as { success: boolean; data?: SuccessData; error?: string };
      if (!json.success) { toast.error(json.error || "Failed to create order"); return; }
      toast.success("Authentication issued successfully!");
      setSuccess(json.data!);
    } catch {
      toast.error("Something went wrong");
    }
  }

  if (success) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Authentication Issued!</h1>
          <p className="text-muted-foreground mt-1">The lens authentication has been successfully created.</p>
        </div>

        <Card className="border-2 border-[#1A1A2E]">
          <CardContent className="p-6 text-center space-y-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium tracking-wider">Authentication Code</p>
              <p className="text-2xl font-bold font-mono text-[#E94560] mt-1 tracking-wider">{success.authCode}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
              <div>
                <p className="text-muted-foreground">Customer</p>
                <p className="font-semibold">{success.customerName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Invoice</p>
                <p className="font-semibold">{success.invoiceNumber}</p>
              </div>
            </div>
            {success.qrCodeUrl && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-3">
                  <QrCode className="h-4 w-4" />
                  QR Code for customer scan
                </div>
                <img src={success.qrCodeUrl} alt="Auth QR Code" className="mx-auto w-40 h-40" />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          {success.pdfUrl && (
            <a href={success.pdfUrl} target="_blank" rel="noreferrer" className="flex-1">
              <Button variant="outline" className="w-full">Download PDF Card</Button>
            </a>
          )}
          <Button
            className="flex-1 bg-[#1A1A2E]"
            onClick={() => {
              setSuccess(null);
              reset();
              setNameSuggestions([]);
            }}
          >
            Issue Another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Issue Authentication</h1>
        <p className="text-muted-foreground">Fill in the details to digitally authenticate a Lenstrack lens</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Customer Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="bg-[#1A1A2E] text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">1</span>
              Customer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mobile Number *</Label>
                <Input
                  type="tel"
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  {...register("mobile")}
                />
                {errors.mobile && <p className="text-xs text-red-500">{errors.mobile.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Customer Name *</Label>
                <Input placeholder="Full name" {...register("customerName")} />
                {errors.customerName && <p className="text-xs text-red-500">{errors.customerName.message}</p>}
                {nameSuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-xs text-muted-foreground">Previous:</span>
                    {nameSuggestions.map((name, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setValue("customerName", name)}
                        className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 hover:bg-blue-100 transition-colors"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Invoice Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="bg-[#1A1A2E] text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">2</span>
              Invoice Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Invoice Number *</Label>
              <Input placeholder="e.g. INV-2024-001" {...register("invoiceNumber")} />
              {errors.invoiceNumber && <p className="text-xs text-red-500">{errors.invoiceNumber.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Lens Items */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="bg-[#1A1A2E] text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">3</span>
              Lens Items
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <LensItemBlock
                key={field.id}
                index={index}
                control={control}
                register={register}
                remove={() => remove(index)}
                canRemove={fields.length > 1}
              />
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => append({ productId: "", rightEyeSph: "", rightEyeCyl: "", rightEyeAxis: "", rightEyeAdd: "", leftEyeSph: "", leftEyeCyl: "", leftEyeAxis: "", leftEyeAdd: "", notes: "" })}
              className="w-full border-dashed"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Lens
            </Button>
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full h-12 text-base bg-[#E94560] hover:bg-[#c73550]"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Issuing Authentication...</>
          ) : (
            "Issue Authentication"
          )}
        </Button>
      </form>
    </div>
  );
}
