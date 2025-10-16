"use client";

import { useState, useRef } from "react";
import { redirect, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Store } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { createStoreSchema } from "@/lib/validations";
import { generateSlug } from "@/lib/client-utils";
import { AreaSelect } from "@/components/area-select";
import type { z } from "zod";
import { authClient } from "@/lib/auth-client";

type CreateStoreFormData = z.infer<typeof createStoreSchema>;

export default function StoreNew() {
  const router = useRouter();
  const [isGeneratingSlug, setIsGeneratingSlug] = useState(false);
  const slugManuallyEdited = useRef(false);

  const { data: session } = authClient.useSession();

  if (!session) {
      redirect("/");
  }
  const form = useForm<CreateStoreFormData>({
    resolver: zodResolver(createStoreSchema),
    defaultValues: {
      name: "",
      slug: "",
      areaId: "", 
      description: "",
      logo: "",
    },
  });

  const createStoreMutation = useMutation({
    mutationFn: async (data: CreateStoreFormData) => {
      const response = await fetch("/api/stores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create store");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Toko berhasil dibuat!");
      router.push(`/seller/dashboard`);
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

  const onSubmit = (data: CreateStoreFormData) => {
    createStoreMutation.mutate(data);
  };

  return (
    <>
      <div
        aria-hidden
        className="absolute inset-0 isolate hidden opacity-65 contain-strict lg:block"
      ></div>
      <div className="relative bg-background flex flex-col items-center justify-center min-h-screen px-10">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center flex flex-col items-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Store className="h-6 w-6 text-primary" />
            </div>
            <h2 className="mt-6 text-center text-2xl font-medium dark:text-foreground flex items-center gap-2">
              Buat Toko Baru
            </h2>
            <p className="text-xs font-medium dark:text-foreground text-muted-foreground">
              Kelola produk dan penjualan Anda di satu tempat
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Toko</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Masukkan nama toko"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleNameChange(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Nama toko yang akan ditampilkan kepada pembeli
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
                    <FormLabel>URL Toko</FormLabel>
                    <FormControl>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                          /store/
                        </span>
                        <Input
                          placeholder="url-toko"
                          className="rounded-l-none"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            slugManuallyEdited.current = true;
                            if (isGeneratingSlug) setIsGeneratingSlug(false);
                          }}
                          disabled={isGeneratingSlug}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      URL unik untuk toko Anda. Hanya huruf kecil, angka, dan
                      tanda hubung.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="areaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titik Simpul Terdekat</FormLabel>
                    <FormControl>
                      <AreaSelect
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi Toko (Opsional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ceritakan tentang toko Anda..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Deskripsi singkat tentang toko dan produk yang dijual
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="logo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo Toko (Opsional)</FormLabel>
                    <FormControl>
                      <ImageUpload
                        value={field.value || ""}
                        onChange={field.onChange}
                        label="Unggah Logo Toko"
                        description="Maksimal size gambar 2MB"
                        maxFileSize={1024 * 1024 * 2}
                      />
                    </FormControl>
                    <FormDescription>Logo toko Anda</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={createStoreMutation.isPending}
              >
                {createStoreMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Membuat Toko...
                  </>
                ) : (
                  "Buat Toko"
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </>
  );
}
