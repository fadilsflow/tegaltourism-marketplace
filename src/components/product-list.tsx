"use client ";

import {
  ProductCard,
  ProductCardSkeleton,
  Product,
} from "@/components/product-card";
import { useQuery } from "@tanstack/react-query";
import { Button } from "./ui/button";

export default function ProductList({
  sortBy = "latest",
  limit = 8,
}: {
  sortBy?: "latest" | "trending" | "popular";
  limit?: number;
}) {
  const {
    data: productsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["home-products", sortBy, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        sortBy:
          sortBy === "latest"
            ? "createdAt"
            : sortBy === "trending"
            ? "createdAt"
            : "name",
        sortOrder: "desc",
      });

      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch products");
      }
      return response.json();
    },
  });

  const products = productsData?.products || [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-2">
          {error instanceof Error ? error.message : "Terjadi kesalahan"}
        </div>
        <Button onClick={() => window.location.reload()}>Coba Lagi</Button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground mb-4">Belum ada produk</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product: Product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
