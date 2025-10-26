"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import {
  ArrowUpDown,
  MoreHorizontal,
  Package,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  MapPin,
  User,
  QrCode,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/client-utils";
import Image from "next/image";

type OrderStatus = "pending" | "paid" | "completed" | "cancelled";

type OrderItem = {
  id: string;
  quantity: number;
  price: string;
  product: {
    id: string;
    name: string;
    slug: string;
    image?: string;
  };
};

type Order = {
  id: string;
  buyerId: string;
  status: OrderStatus;
  total: string;
  createdAt: string;
  updatedAt: string;
  buyer: {
    id: string;
    name: string;
    email: string;
  };
  items: OrderItem[];
};

const statusConfig = {
  pending: {
    label: "Menunggu Pembayaran",
    icon: Clock,
    variant: "secondary" as const,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
  },
  paid: {
    label: "Sudah Dibayar",
    icon: CheckCircle,
    variant: "default" as const,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  completed: {
    label: "Selesai",
    icon: CheckCircle,
    variant: "default" as const,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  cancelled: {
    label: "Dibatalkan",
    icon: XCircle,
    variant: "destructive" as const,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
};

export default function TourismManagerOrders() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"createdAt" | "total" | "status">(
    "createdAt"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch orders
  const {
    data: ordersData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["tourism-manager-orders", currentPage, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });
      const response = await fetch(`/api/tourism-manager/orders?${params}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch orders");
      }
      return response.json();
    },
  });

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const response = await fetch(`/api/tourism-manager/orders/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update order status");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Status pesanan berhasil diperbarui!");
      queryClient.invalidateQueries({ queryKey: ["tourism-manager-orders"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const orders = ordersData?.orders || [];
  const pagination = ordersData?.pagination;

  // Filter orders
  const filteredOrders = orders.filter((order: Order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.buyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some((item) =>
        item.product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleSort = (column: "createdAt" | "total" | "status") => {
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
      </div>

      <div className="mb-6 flex gap-4">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Skeleton className="h-4 w-24" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-32" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-20" />
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
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-12 w-48" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
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
          <h3 className="text-lg font-semibold mb-2">Gagal memuat pesanan</h3>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error
              ? error.message
              : "Terjadi kesalahan saat memuat pesanan"}
          </p>
          <Button
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["tourism-manager-orders"] })
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
          <h1 className="text-xl lg:text-2xl font-bold">Pesanan Tiket</h1>
          <p className="text-xs lg:text-md text-muted-foreground">
            Total ({pagination?.total || 0} pesanan)
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex gap-4">
        <Input
          placeholder="Cari pesanan, customer, atau tiket..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="pending">Menunggu Pembayaran</SelectItem>
            <SelectItem value="paid">Sudah Dibayar</SelectItem>
            <SelectItem value="completed">Selesai</SelectItem>
            <SelectItem value="cancelled">Dibatalkan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("createdAt")}
                  className="h-auto p-0 font-medium"
                >
                  ID Pesanan & Tanggal
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Customer & Tiket</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("total")}
                  className="h-auto p-0 font-medium"
                >
                  Jumlah
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("status")}
                  className="h-auto p-0 font-medium"
                >
                  Status
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Detail Pembeli</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      {searchTerm || statusFilter !== "all"
                        ? "Tidak ada pesanan yang sesuai dengan kriteria"
                        : "Belum ada pesanan"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order: Order) => {
                const status = statusConfig[order.status];
                const StatusIcon = status.icon;

                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">#{order.id.slice(-8)}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString(
                            "id-ID",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {order.buyer.name}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {order.items.length} tiket:
                        </div>
                        <div className="text-sm">
                          {order.items.slice(0, 2).map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-2"
                            >
                              {item.product.image ? (
                                <Image
                                  width={1000}
                                  height={1000}
                                  src={item.product.image}
                                  alt={item.product.name}
                                  className="h-6 w-6 rounded object-cover"
                                />
                              ) : (
                                <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                                  <Package className="h-3 w-3 text-muted-foreground" />
                                </div>
                              )}
                              <span className="truncate max-w-[200px]">
                                {item.product.name} × {item.quantity}
                              </span>
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              +{order.items.length - 2} tiket lainnya
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {formatCurrency(parseFloat(order.total))}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Total pembayaran
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {order.items.reduce((sum, item) => sum + item.quantity, 0)} tiket
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={order.status}
                        onValueChange={(value: OrderStatus) =>
                          updateOrderStatusMutation.mutate({
                            id: order.id,
                            status: value,
                          })
                        }
                        disabled={updateOrderStatusMutation.isPending}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue>
                            <div className="flex items-center">
                              <StatusIcon
                                className={`mr-2 h-3 w-3 ${status.color}`}
                              />
                              {status.label}
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">
                            <div className="flex items-center">
                              <Clock className="mr-2 h-3 w-3 text-yellow-600" />
                              Menunggu Pembayaran
                            </div>
                          </SelectItem>
                          <SelectItem value="paid">
                            <div className="flex items-center">
                              <CheckCircle className="mr-2 h-3 w-3 text-blue-600" />
                              Sudah Dibayar
                            </div>
                          </SelectItem>
                          <SelectItem value="completed">
                            <div className="flex items-center">
                              <CheckCircle className="mr-2 h-3 w-3 text-green-600" />
                              Selesai
                            </div>
                          </SelectItem>
                          <SelectItem value="cancelled">
                            <div className="flex items-center">
                              <XCircle className="mr-2 h-3 w-3 text-red-600" />
                              Dibatalkan
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{order.buyer.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {order.buyer.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Buka menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              navigator.clipboard.writeText(order.id)
                            }
                          >
                            Salin ID Pesanan
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/tourism-manager/orders/${order.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Lihat Detail Pesanan
                            </Link>
                          </DropdownMenuItem>
                          {order.status === "paid" && (
                            <DropdownMenuItem asChild>
                              <Link href={`/tourism-manager/orders/${order.id}`}>
                                <QrCode className="mr-2 h-4 w-4" />
                                Lihat QR Code
                              </Link>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
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
                <span className="sr-only">Ke halaman pertama</span>
                {"<<"}
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!pagination.hasPrev}
              >
                <span className="sr-only">Ke halaman sebelumnya</span>
                {"<"}
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!pagination.hasNext}
              >
                <span className="sr-only">Ke halaman selanjutnya</span>
                {">"}
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => setCurrentPage(pagination.totalPages)}
                disabled={!pagination.hasNext}
              >
                <span className="sr-only">Ke halaman terakhir</span>
                {">>"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}