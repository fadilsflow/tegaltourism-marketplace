"use client";

import React, { useState, use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Store,
  Package,
  Calendar,
  ArrowLeft,
  Grid3X3,
  List,
  Search,
  Check,
  Share2,
  MapPin,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/client-utils";
import Image from "next/image";
import { toast } from "sonner";
import { ProductCard } from "@/components/product-card";

type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: string;
  stock: number;
  image?: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
};

type Destination = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

export default function StoreDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"name" | "price" | "createdAt">(
    "createdAt"
  );
  const [copied, setCopied] = useState(false);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const { data: destinations } = useQuery({
    queryKey: ["destinations"],
    queryFn: async () => {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const res = await fetch(baseUrl!);
      if (!res.ok) throw new Error("Gagal memuat destinasi");
      return res.json() as Promise<Destination[]>;
    },
  });

  // Fetch store details and products
  const {
    data: storeData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["store", slug, currentPage, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });
      const response = await fetch(`/api/stores/slug/${slug}?${params}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Store not found");
      }
      return response.json();
    },
  });

  const store = storeData?.store;
  const products = storeData?.products || [];
  const pagination = storeData?.pagination;

  const areaName = store?.areaId
    ? destinations?.find((dest) => dest.id === store.areaId)?.name
    : null;

  // Filter products by search term (client-side filtering)
  const filteredProducts = products.filter(
    (product: Product) =>
      product.status === "active" &&
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort products (client-side sorting)
  const sortedProducts = [...filteredProducts].sort(
    (a: Product, b: Product) => {
      let aValue: string | number, bValue: string | number;

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "price":
          aValue = parseFloat(a.price);
          bValue = parseFloat(b.price);
          break;
        case "createdAt":
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          return 0;
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    }
  );

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-6 md:px-12">
        <div className="mb-6">
          <Skeleton className="h-10 w-32 mb-4" />
        </div>

        {/* Store Header Skeleton */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <Skeleton className="h-32 w-32 rounded-full mx-auto md:mx-0" />
            <div className="flex-1 text-center md:text-left">
              <Skeleton className="h-8 w-64 mb-2 mx-auto md:mx-0" />
              <Skeleton className="h-5 w-32 mb-4 mx-auto md:mx-0" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-4" />
              <Skeleton className="h-4 w-48 mx-auto md:mx-0" />
            </div>
          </div>
        </div>

        {/* Products Skeleton */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="aspect-square rounded-lg mb-4" />
                <Skeleton className="h-5 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-3" />
                <Skeleton className="h-6 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="container mx-auto py-8 px-6 md:px-12">
        <div className="text-center py-12">
          <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Toko Tidak Ditemukan</h2>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error
              ? error.message
              : "Toko yang Anda cari tidak ditemukan"}
          </p>
          <Button onClick={() => router.push("/stores")}>
            Kembali ke Daftar Toko
          </Button>
        </div>
      </div>
    );
  }

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Link Toko disalin ke clipboard!");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container mx-auto py-8 px-6 md:px-12">
      {/* Breadcrumb */}
      <div className="mb-6 justify-between flex">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>

        <Button variant="outline" onClick={handleCopyLink}>
          {copied ? (
            <Check className="w-4 h-4" />
          ) : (
            <Share2 className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Store Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          {/* Store Logo */}
          <div className="relative flex-shrink-0 mx-auto md:mx-0">
            {store.logo ? (
              <Image
                width={1000}
                height={1000}
                src={store.logo}
                alt={store.name}
                className="h-32 w-32 rounded-full object-cover border-4 border-background shadow-lg"
              />
            ) : (
              <div className="h-32 w-32 rounded-full bg-primary/10 flex items-center justify-center border-4 border-background shadow-lg">
                <Store className="h-16 w-16 text-primary" />
              </div>
            )}
          </div>

          {/* Store Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold mb-2">{store.name}</h1>
            <p className="text-muted-foreground text-lg mb-4">@{store.slug}</p>

            {store.description && (
              <p className="text-muted-foreground mb-4 leading-relaxed max-w-2xl">
                {store.description}
              </p>
            )}

            <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground flex-wrap">
              {areaName && store.areaId && (
                <a
                  href={`${process.env.NEXT_PUBLIC_API_BASE_URL}/blog/${store.areaId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center hover:text-primary transition-colors"
                >
                  <MapPin className="h-4 w-4 mr-1" />
                  {areaName}
                </a>
              )}
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Bergabung{" "}
                {new Date(store.createdAt).toLocaleDateString("id-ID", {
                  month: "long",
                  year: "numeric",
                })}
              </div>
              <div className="flex items-center">
                <Package className="h-4 w-4 mr-1" />
                {products.length} Produk
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Produk dari {store.name}</h2>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Cari produk di toko ini..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select
            value={`${sortBy}-${sortOrder}`}
            onValueChange={(value) => {
              const [newSortBy, newSortOrder] = value.split("-") as [
                "name" | "price" | "createdAt",
                "asc" | "desc"
              ];
              setSortBy(newSortBy);
              setSortOrder(newSortOrder);
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
              <SelectItem value="price-asc">Harga Terendah</SelectItem>
              <SelectItem value="price-desc">Harga Tertinggi</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Products Grid/List */}
      {sortedProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {searchTerm ? "Produk tidak ditemukan" : "Belum ada produk"}
          </h3>
          <p className="text-muted-foreground">
            {searchTerm
              ? "Coba gunakan kata kunci yang berbeda untuk mencari produk"
              : "Toko ini belum memiliki produk yang tersedia"}
          </p>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4 flex flex-col"
          }
        >
          {sortedProducts.map((product: Product) => (
            <Link key={product.id} href={`/products/${product.slug}`}>
              {viewMode === "grid" ? (
                <ProductCard disableLinks key={product.id} product={product} />
              ) : (
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden rounded-lg">
                        {product.image ? (
                          <Image
                            fill
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1 truncate">
                          {product.name}
                        </h3>
                        {product.description && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {product.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-primary">
                            {formatCurrency(parseFloat(product.price))}
                          </span>
                          <Badge
                            variant={
                              product.stock > 0 ? "default" : "secondary"
                            }
                          >
                            {product.stock > 0
                              ? `Stok: ${product.stock}`
                              : "Habis"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between space-x-2 py-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Produk per halaman</p>
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
