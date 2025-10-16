"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import {
  ArrowUpDown,
  MoreHorizontal,
  Plus,
  Package,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/client-utils";
import Image from "next/image";

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

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<
    "name" | "price" | "stock" | "createdAt"
  >("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch products
  const {
    data: productsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["user-products", currentPage, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });
      const response = await fetch(`/api/products/me?${params}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch products");
      }
      return response.json();
    },
  });

  // Update product status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: "active" | "inactive";
    }) => {
      const response = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update product status");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Status produk berhasil diperbarui!");
      queryClient.invalidateQueries({ queryKey: ["user-products"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete product");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Produk berhasil dihapus!");
      queryClient.invalidateQueries({ queryKey: ["user-products"] });
      setDeleteConfirm(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const products = productsData?.products || [];
  const pagination = productsData?.pagination;

  // Filter products (sorting is handled by API)
  const filteredProducts = products.filter((product: Product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSort = (column: "name" | "price" | "stock" | "createdAt") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="container mx-auto py-8 px-6 md:px-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="mb-6">
        <Skeleton className="h-10 w-80" />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Skeleton className="h-4 w-24" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-12" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-20" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-8" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-10 rounded-md" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-12" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-8" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-6 md:px-12">
        <div className="flex flex-col items-center justify-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Gagal memuat produk</h3>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error
              ? error.message
              : "Terjadi kesalahan saat memuat produk"}
          </p>
          <Button
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["user-products"] })
            }
          >
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-6 md:px-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold">Produk</h1>
          <p className="text-xs lg:text-md text-muted-foreground">
            Total ({pagination?.total || 0} produk)
          </p>
        </div>
        <Link href="/seller/products/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Produk
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="Cari produk..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Products Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("name")}
                  className="h-auto p-0 font-medium"
                >
                  Nama Produk
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("price")}
                  className="h-auto p-0 font-medium"
                >
                  Harga
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("stock")}
                  className="h-auto p-0 font-medium"
                >
                  Stok
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("createdAt")}
                  className="h-auto p-0 font-medium"
                >
                  Dibuat
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      {searchTerm
                        ? "Produk tidak ditemukan"
                        : "Belum ada produk"}
                    </p>
                    {!searchTerm && (
                      <Link href="/seller/products/new">
                        <Button variant="outline" className="mt-2">
                          <Plus className="mr-2 h-4 w-4" />
                          Tambah Produk Pertama
                        </Button>
                      </Link>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product: Product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="relative flex items-center space-x-3">
                      {product.image ? (
                        <Image
                          width={1000}
                          height={1000}
                          src={product.image}
                          alt={product.name}
                          className="h-10 w-10 rounded-md object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          /{product.slug}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {formatCurrency(parseFloat(product.price))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div
                      className={`font-medium ${product.stock <= 5 ? "text-red-600" : ""
                        }`}
                    >
                      {product.stock}
                      {product.stock <= 5 && product.stock > 0 && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          Rendah
                        </Badge>
                      )}
                      {product.stock === 0 && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          Habis
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={product.status}
                      onValueChange={(value: "active" | "inactive") =>
                        updateStatusMutation.mutate({
                          id: product.id,
                          status: value,
                        })
                      }
                      disabled={updateStatusMutation.isPending}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                            Aktif
                          </div>
                        </SelectItem>
                        <SelectItem value="inactive">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-gray-500 rounded-full mr-2" />
                            Tidak Aktif
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div>
                      {new Date(product.createdAt).toLocaleDateString("id-ID")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() =>
                            navigator.clipboard.writeText(product.id)
                          }
                        >
                          Salin ID Produk
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/products/${product.slug}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Lihat Produk
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/seller/products/${product.id}`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Produk
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => setDeleteConfirm(product.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Hapus Produk
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {
        pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Baris per halaman</p>
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
                  {[5, 10, 20, 30, 50].map((size) => (
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
        )
      }

      {/* Delete Confirmation Modal */}
      {
        deleteConfirm && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-background rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-2">Hapus Produk</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak
                dapat dibatalkan.
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteProductMutation.mutate(deleteConfirm)}
                  disabled={deleteProductMutation.isPending}
                >
                  {deleteProductMutation.isPending ? "Menghapus..." : "Hapus"}
                </Button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
