"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Package, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ImageUpload } from "@/components/image-upload";
import { generateSlug } from "@/lib/client-utils";
import { z } from "zod";

// Create a modified schema for the form that makes status required
const productFormSchema = z.object({
  storeId: z.string().min(1, "Store ID is required"),
  name: z
    .string()
    .min(1, "Product name is required")
    .max(200, "Product name too long"),
  slug: z
    .string()
    .min(1, "Product slug is required")
    .max(100, "Product slug too long")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    ),
  description: z.string().optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  image: z.string().optional(),
  status: z.enum(["active", "inactive"]),
});

type CreateProductFormData = z.infer<typeof productFormSchema>;

export default function ProductNew() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isGeneratingSlug, setIsGeneratingSlug] = useState(false);
  const slugManuallyEdited = useRef(false);

  // Get user's store
  const { data: storeData, isLoading: isLoadingStore } = useQuery({
    queryKey: ["user-store"],
    queryFn: async () => {
      const response = await fetch("/api/stores/me");
      if (!response.ok) {
        throw new Error("Failed to fetch store");
      }
      return response.json();
    },
  });

  // Get service fee percentage
  const { data: settingsData } = useQuery({
    queryKey: ["system-settings"],
    queryFn: async () => {
      const response = await fetch("/api/admin/settings");
      if (!response.ok) {
        throw new Error("Failed to fetch settings");
      }
      return response.json();
    },
  });

  const form = useForm<CreateProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      storeId: "",
      name: "",
      slug: "",
      description: "",
      price: "",
      stock: 0,
      image: "",
      status: "active",
    },
  });

  // Set storeId when store data is loaded
  React.useEffect(() => {
    if (storeData?.store?.id) {
      form.setValue("storeId", storeData.store.id);
    }
  }, [storeData?.store?.id, form]);

  const createProductMutation = useMutation({
    mutationFn: async (data: CreateProductFormData) => {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create product");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Produk berhasil dibuat!");
      queryClient.invalidateQueries({ queryKey: ["user-products"] });
      router.push("/seller/products");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleNameChange = (name: string) => {
    form.setValue("name", name);

    // Auto-generate slug from name if it hasn't been manually edited
    if (name && !slugManuallyEdited.current) {
      setIsGeneratingSlug(true);
      const slug = generateSlug(name);
      form.setValue("slug", slug);
      setIsGeneratingSlug(false);
    }
  };

  const onSubmit = (data: CreateProductFormData) => {
    createProductMutation.mutate(data);
  };

  // Get service fee percentage from settings
  const settings = settingsData?.settings || [];
  const serviceFeeSetting = settings.find((s: { key: string; value: string }) => s.key === "service_fee_percentage");
  const serviceFeePercentage = serviceFeeSetting ? parseFloat(serviceFeeSetting.value) : 5;
  const sellerPercentage = 100 - serviceFeePercentage;

  if (isLoadingStore) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!storeData?.hasStore) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Toko Tidak Ditemukan</h2>
        <p className="text-muted-foreground mb-4">
          Anda perlu membuat toko terlebih dahulu
        </p>
        <Link href="/seller-new">
          <Button>Buat Toko</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <div className="mb-6">
        <Link href="/seller/products">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Produk
          </Button>
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Tambah Produk Baru</h1>
            <p className="text-muted-foreground">
              Tambahkan produk baru ke toko Anda
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Produk</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Masukkan nama produk"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      handleNameChange(e.target.value);
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Nama produk yang akan ditampilkan kepada pembeli
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL Produk</FormLabel>
                <FormControl>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                      /product/
                    </span>
                    <Input
                      placeholder="url-produk"
                      className="rounded-l-none"
                      {...field}
                      onChange={(e) => {
                        // Allow user to type directly in slug field
                        field.onChange(e);
                        // Mark slug as manually edited
                        slugManuallyEdited.current = true;
                        // Reset the auto-generation flag when user types
                        if (isGeneratingSlug) {
                          setIsGeneratingSlug(false);
                        }
                      }}
                      disabled={isGeneratingSlug}
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  URL unik untuk produk Anda. Hanya huruf kecil, angka, dan
                  tanda hubung.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deskripsi Produk (Opsional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Ceritakan tentang produk Anda..."
                    className="resize-none"
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Deskripsi detail tentang produk yang dijual
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col gap-6">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Harga</FormLabel>
                  <FormControl>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                        Rp
                      </span>
                      <Input
                        placeholder="0"
                        type="number"
                        step="0.01"
                        className="rounded-l-none"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Harga produk dalam Rupiah
                    <br />
                    <span className="text-xs text-muted-foreground">
                      ℹ️ Anda akan menerima {sellerPercentage}% dari harga ini ({serviceFeePercentage}% untuk biaya layanan)
                    </span>
                  </FormDescription>
                  {field.value && parseFloat(field.value) > 0 && (
                    <div className="mt-2 p-3 bg-muted/50 rounded-lg border">
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Harga yang Anda tetapkan:</span>
                          <span className="font-medium">Rp {parseFloat(field.value).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Biaya layanan ({serviceFeePercentage}%):</span>
                          <span className="text-red-600">- Rp {(parseFloat(field.value) * serviceFeePercentage / 100).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between border-t pt-1">
                          <span className="font-medium">Pendapatan Anda:</span>
                          <span className="font-semibold text-green-600">Rp {(parseFloat(field.value) * sellerPercentage / 100).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stok</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0"
                      type="number"
                      min="0"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormDescription>Jumlah stok yang tersedia</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gambar Produk (Opsional)</FormLabel>
                <FormControl>
                  <ImageUpload
                    value={field.value || ""}
                    onChange={field.onChange}
                    label="Unggah Gambar Produk"
                    description="Maksimal size gambar 2MB"
                    maxFileSize={1024 * 1024 * 2} // 2MB
                  />
                </FormControl>
                <FormDescription>Gambar produk Anda</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status Produk</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status produk" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Tidak Aktif</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Status ketersediaan produk untuk pembeli
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={createProductMutation.isPending}
            >
              {createProductMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Membuat Produk...
                </>
              ) : (
                "Buat Produk"
              )}
            </Button>
            <Link href="/seller/products">
              <Button type="button" variant="outline">
                Batal
              </Button>
            </Link>
          </div>
        </form>
      </Form>
    </div>
  );
}
