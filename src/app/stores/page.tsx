"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Store, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

type Store = {
  id: string;
  name: string;
  slug: string;
  areaId: string;
  description?: string;
  logo?: string;
  createdAt: string;
  updatedAt: string;
};

export default function StoresPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "createdAt">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch stores
  const {
    data: storesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["stores", currentPage, pageSize, debouncedSearchTerm, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(debouncedSearchTerm && { q: debouncedSearchTerm }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder }),
      });
      const response = await fetch(`/api/stores?${params}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch stores");
      }
      return response.json();
    },
  });

  const stores = storesData?.stores || [];
  const pagination = storesData?.pagination;

  // Loading skeleton component
  const LoadingSkeleton = () => (
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
  );

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-6 md:px-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Jelajahi Toko</h1>
          <p className="text-muted-foreground text-lg">
            Temukan berbagai toko rempah dan bumbu pilihan
          </p>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Cari toko..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
              }}
              className="pl-10"
            />
          </div>
          <Select
            value={`${sortBy}-${sortOrder}`}
            onValueChange={(value) => {
              const [newSortBy, newSortOrder] = value.split("-") as [
                "name" | "createdAt",
                "asc" | "desc"
              ];
              setSortBy(newSortBy);
              setSortOrder(newSortOrder);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt-desc">Terbaru</SelectItem>
              <SelectItem value="createdAt-asc">Terlama</SelectItem>
              <SelectItem value="name-asc">Nama A-Z</SelectItem>
              <SelectItem value="name-desc">Nama Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-6 md:px-12">
        <div className="flex flex-col items-center justify-center py-12">
          <Store className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Gagal memuat toko</h3>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error
              ? error.message
              : "Terjadi kesalahan saat memuat toko"}
          </p>
          <Button onClick={() => window.location.reload()}>Coba Lagi</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-6 md:px-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Jelajahi Toko</h1>
        <p className="text-muted-foreground text-lg">
          Temukan berbagai toko rempah dan bumbu pilihan (
          {pagination?.total || 0} toko)
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Cari toko..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
            }}
            className="pl-10"
          />
        </div>
        <Select
          value={`${sortBy}-${sortOrder}`}
          onValueChange={(value) => {
            const [newSortBy, newSortOrder] = value.split("-") as [
              "name" | "createdAt",
              "asc" | "desc"
            ];
            setSortBy(newSortBy);
            setSortOrder(newSortOrder);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt-desc">Terbaru</SelectItem>
            <SelectItem value="createdAt-asc">Terlama</SelectItem>
            <SelectItem value="name-asc">Nama A-Z</SelectItem>
            <SelectItem value="name-desc">Nama Z-A</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {stores.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12">
            <Store className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? "Toko tidak ditemukan" : "Belum ada toko"}
            </h3>
            <p className="text-muted-foreground text-center">
              {searchTerm
                ? "Coba gunakan kata kunci yang berbeda untuk mencari toko"
                : "Belum ada toko yang terdaftar di platform ini"}
            </p>
          </div>
        ) : (
          stores.map((store: Store) => (
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
                        <Store className="h-6 w-6 text-primary" />
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
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between space-x-2 py-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Toko per halaman</p>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                setPageSize(parseInt(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top">
                {[8, 12, 16, 24].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Halaman {pagination.page} dari {pagination.totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => setCurrentPage(1)}
                disabled={!pagination.hasPrev}
              >
                <span className="sr-only">Go to first page</span>
                {"<<"}
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!pagination.hasPrev}
              >
                <span className="sr-only">Go to previous page</span>
                {"<"}
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!pagination.hasNext}
              >
                <span className="sr-only">Go to next page</span>
                {">"}
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => setCurrentPage(pagination.totalPages)}
                disabled={!pagination.hasNext}
              >
                <span className="sr-only">Go to last page</span>
                {">>"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
