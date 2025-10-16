"use client";

import React, { Suspense, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  ProductCard,
  ProductCardSkeleton,
  Product,
} from "@/components/product-card";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Store as StoreIcon } from "lucide-react";
import Image from "next/image";

type Store = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  createdAt: string;
  updatedAt: string;
};

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto py-8 px-6 md:px-12">
          <div className="space-y-6">
            <div className="h-8 w-40 bg-muted rounded" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-48 bg-muted rounded" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();

  const initialQuery = useMemo(
    () => searchParams.get("q") || "",
    [searchParams]
  );

  // Debounce query agar request tidak menembak API di setiap ketikan
  const [debouncedQuery, setDebouncedQuery] = React.useState(initialQuery);
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(initialQuery), 400);
    return () => clearTimeout(handler);
  }, [initialQuery]);

  const productsQuery = useQuery({
    queryKey: ["search-products", debouncedQuery],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "8" });
      if (debouncedQuery) params.set("q", debouncedQuery);
      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Gagal memuat produk");
      }
      return res.json();
    },
  });

  const storesQuery = useQuery({
    queryKey: ["search-stores", debouncedQuery],
    queryFn: async () => {
      const params = new URLSearchParams({ page: "1", limit: "8" });
      if (debouncedQuery) params.set("q", debouncedQuery);
      const res = await fetch(`/api/stores?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Gagal memuat toko");
      }
      return res.json();
    },
  });

  const products: Product[] = productsQuery.data?.products || [];
  const stores: Store[] = storesQuery.data?.stores || [];

  const isLoading = productsQuery.isLoading || storesQuery.isLoading;
  const isError = productsQuery.isError || storesQuery.isError;

  return (
    <div className="container mx-auto py-8 px-6 md:px-12">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Pencarian</h1>
        <p className="text-muted-foreground">
          {initialQuery
            ? `Hasil untuk "${initialQuery}"`
            : "Cari produk dan toko"}
        </p>
      </div>

      {isLoading && (
        <div className="space-y-10">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Produk</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Toko</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-32 mb-1" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-4" />
                    <Skeleton className="h-9 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      )}

      {!isLoading && isError && (
        <div className="text-center py-12 text-muted-foreground">
          Terjadi kesalahan saat memuat hasil. Coba lagi.
        </div>
      )}

      {!isLoading && !isError && (
        <div className="space-y-10">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Produk</h2>
              <Link
                href={`/products?q=${encodeURIComponent(initialQuery)}`}
                className="text-sm text-primary"
              >
                Lihat semua
              </Link>
            </div>
            {products.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Tidak ada produk ditemukan.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((p: Product) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Toko</h2>
              <Link
                href={`/stores?q=${encodeURIComponent(initialQuery)}`}
                className="text-sm text-primary"
              >
                Lihat semua
              </Link>
            </div>
            {stores.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Tidak ada toko ditemukan.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {stores.map((store: Store) => (
                  <Link key={store.id} href={`/stores/${store.slug}`}>
                    <div className="border p-6 rounded-xl  overflow-hidden hover:border-primary transition-shadow cursor-pointer h-full">
                      <div className="pb-3 ">
                        <div className="relative flex items-center space-x-3">
                          {store.logo ? (
                            <div className="relative h-12 w-12 overflow-hidden rounded-xl">
                              <Image
                                fill
                                src={store.logo}
                                alt={store.name}
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <StoreIcon className="h-6 w-6 text-primary" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-md truncate ">
                              {store.name}
                            </h3>
                            <p className="text-xs text-muted-foreground truncate">
                              @{store.slug}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div>
                        {store.description && (
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {store.description}
                          </p>
                        )}
                        <div className="justify-end flex">
                          <Button variant={"outline"} size={"sm"}>
                            Kunjungi Toko
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
