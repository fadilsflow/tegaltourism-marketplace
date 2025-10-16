"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  ProductCard,
  ProductCardSkeleton,
  Product,
} from "@/components/product-card";
import { formatCurrency } from "@/lib/client-utils";

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "price" | "createdAt">(
    "createdAt"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(1000000);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [searchTerm]);

  // Fetch products
  const {
    data: productsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "products",
      currentPage,
      pageSize,
      debouncedSearchTerm,
      sortBy,
      sortOrder,
      minPrice,
      maxPrice,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sortBy,
        sortOrder,
      });

      if (debouncedSearchTerm) params.append("q", debouncedSearchTerm);
      if (minPrice > 0) params.append("minPrice", minPrice.toString());
      if (maxPrice < 1000000) params.append("maxPrice", maxPrice.toString());

      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch products");
      }
      return response.json();
    },
  });

  const products = productsData?.products || [];
  const pagination = productsData?.pagination;


  const handlePriceFilter = () => {
    setMinPrice(priceRange[0]);
    setMaxPrice(priceRange[1]);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setMinPrice(0);
    setMaxPrice(1000000);
    setPriceRange([0, 1000000]);
    setCurrentPage(1);
  };

  return (
    <div className="container mx-auto py-8 px-6 md:px-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Semua Produk</h1>
        <p className="text-muted-foreground">
          Temukan produk terbaik dari berbagai toko
          {pagination && ` (${pagination.total} produk)`}
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Cari produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Sort */}
        <div className="flex gap-2">
          <Select
            value={sortBy}
            onValueChange={(value: "name" | "price" | "createdAt") =>
              setSortBy(value)
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Terbaru</SelectItem>
              <SelectItem value="name">Nama</SelectItem>
              <SelectItem value="price">Harga</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortOrder}
            onValueChange={(value: "asc" | "desc") => setSortOrder(value)}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">↓</SelectItem>
              <SelectItem value="asc">↑</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <SlidersHorizontal className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="px-6">
              <SheetHeader>
                <SheetTitle>Filter Produk</SheetTitle>
                <SheetDescription>
                  Sesuaikan pencarian produk Anda
                </SheetDescription>
              </SheetHeader>
              <div className="py-6 space-y-6">
                {/* Price Range */}
                <div className="space-y-3">
                  <Label>Rentang Harga</Label>
                  <div className="px-2">
                    <Slider
                      value={priceRange}
                      onValueChange={(value) =>
                        setPriceRange(value as [number, number])
                      }
                      max={1000000}
                      min={0}
                      step={10000}
                      className="w-full"
                    />
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{formatCurrency(priceRange[0])}</span>
                    <span>{formatCurrency(priceRange[1])}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handlePriceFilter} className="flex-1">
                    Terapkan Filter
                  </Button>
                  <Button variant="outline" onClick={resetFilters}>
                    Reset
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <div className="text-red-500 mb-2">
            {error instanceof Error ? error.message : "Terjadi kesalahan"}
          </div>
          <Button onClick={() => window.location.reload()}>Coba Lagi</Button>
        </div>
      )}

      {/* Products Grid/List */}
      {!isLoading && !error && (
        <>
          {products.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                {searchTerm ? "Produk tidak ditemukan" : "Belum ada produk"}
              </div>
              {searchTerm && (
                <Button variant="outline" onClick={resetFilters}>
                  Reset Pencarian
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product: Product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!pagination.hasPrev}
              >
                Sebelumnya
              </Button>
              <span className="text-sm text-muted-foreground">
                Halaman {pagination.page} dari {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!pagination.hasNext}
              >
                Selanjutnya
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
