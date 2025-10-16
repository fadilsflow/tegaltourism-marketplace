"use client";

import React, { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Package,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Truck,
  Loader2,
  User,
  Phone,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";
import { formatCurrency } from "@/lib/client-utils";
import Image from "next/image";

type OrderStatus = "pending" | "paid" | "shipped" | "completed" | "cancelled";

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
  store: {
    id: string;
    name: string;
    slug: string;
  };
};


const statusConfig = {
  pending: {
    label: "Menunggu Pembayaran",
    icon: Clock,
    variant: "secondary" as const,
    description: "Pesanan menunggu untuk di bayar",
  },
  paid: {
    label: "Dibayar",
    icon: CheckCircle,
    variant: "default" as const,
    description: "Pembayaran diterima, sedang menyiapkan pesanan",
  },
  shipped: {
    label: "Dalam Pengiriman",
    icon: Truck,
    variant: "default" as const,
    description: "Pesanan sedang dalam perjalanan",
  },
  completed: {
    label: "Selesai",
    icon: CheckCircle,
    variant: "default" as const,
    description: "Pesanan berhasil terkirim",
  },
  cancelled: {
    label: "Dibatalkan",
    icon: XCircle,
    variant: "destructive" as const,
    description: "Pesanan telah dibatalkan",
  },
};


export default function SellerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const queryClient = useQueryClient();

  // Fetch order details
  const {
    data: order,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["seller-order", id],
    queryFn: async () => {
      const response = await fetch(`/api/orders/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Order not found");
      }
      return response.json();
    },
    enabled: !!session?.user,
  });

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async (status: OrderStatus) => {
      const response = await fetch(`/api/orders/${id}`, {
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
      toast.success("Order status updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["seller-order", id] });
      queryClient.invalidateQueries({ queryKey: ["seller-orders"] });
    },
    onError: (error) => {
      console.error("Error updating order status:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update order status"
      );
    },
  });

  const handleStatusChange = (status: OrderStatus) => {
    if (
      confirm(
        `Apakah Anda yakin ingin mengubah status pesanan menjadi "${status}"?`
      )
    ) {
      updateOrderStatusMutation.mutate(status);
    }
  };

  // Handle authentication redirect
  React.useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  // Show loading state while session is loading
  if (isPending) {
    return (
      <div className="container mx-auto py-8 px-6 md:px-12">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated
  if (!session?.user) {
    return (
      <div className="container mx-auto py-8 px-6 md:px-12">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-6 md:px-12">
        <div className="mb-6">
          <Skeleton className="h-10 w-32 mb-4" />
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto py-8 px-6 md:px-12">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Orderan tidak ditemukan</h2>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error
              ? error.message
              : "The order you're looking for doesn't exist"}
          </p>
          <Button onClick={() => router.push("/seller/orders")}>
            Kembli ke orderan
          </Button>
        </div>
      </div>
    );
  }

  const status = statusConfig[order.status as OrderStatus];
  const StatusIcon = status.icon;

  // Calculate seller's total (items from seller's store only)
  const sellerItems = order.items || [];
  const sellerTotal = sellerItems.reduce(
    (sum: number, item: OrderItem) =>
      sum + parseFloat(item.price) * item.quantity,
    0
  );

  return (
    <div className="container mx-auto py-8 px-6 md:px-12">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Orderan #{order.id.slice(-8)}</h1>
            <p className="text-muted-foreground">
              Dipesan pada {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
          <Badge variant={status.variant} className="text-sm">
            <StatusIcon className="mr-1 h-4 w-4" />
            {status.label}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Produk
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sellerItems.map((item: OrderItem) => (
                <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
                  <div className="relative w-16 h-16 flex-shrink-0 border rounded-lg overflow-hidden">
                    {item.product.image ? (
                      <Image
                        fill
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <Link href={`/products/${item.product.slug}`}>
                      <h3 className="font-medium hover:text-primary transition-colors">
                        {item.product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-muted-foreground">
                        Jumlah: {item.quantity}
                      </span>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(parseFloat(item.price))}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Total:{" "}
                          {formatCurrency(
                            parseFloat(item.price) * item.quantity
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Order Status Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Status Orderan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <StatusIcon className="h-8 w-8 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium">{status.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {status.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Terakhir di Update: {new Date(order.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Ubah Status:</label>
                  <Select
                    value={order.status}
                    onValueChange={(value: OrderStatus) =>
                      handleStatusChange(value)
                    }
                    disabled={updateOrderStatusMutation.isPending}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">
                        <div className="flex items-center">
                          <CheckCircle className="mr-2 h-4 w-4 text-blue-600" />
                          Dibayar
                        </div>
                      </SelectItem>
                      <SelectItem value="shipped">
                        <div className="flex items-center">
                          <Truck className="mr-2 h-4 w-4 text-purple-600" />
                          Dalam Pengiriman
                        </div>
                      </SelectItem>
                      <SelectItem value="completed">
                        <div className="flex items-center">
                          <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                          Selesai
                        </div>
                      </SelectItem>
                      <SelectItem value="cancelled">
                        <div className="flex items-center">
                          <XCircle className="mr-2 h-4 w-4 text-red-600" />
                          Dibatalkan
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {updateOrderStatusMutation.isPending && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      mengubah order status...
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          {/* Revenue Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Pendapatan Anda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(sellerTotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Service Fee ({formatCurrency(parseFloat(order.serviceFee || "0"))}):</span>
                  <span>-{formatCurrency(parseFloat(order.serviceFee || "0"))}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold">
                    <span>Your Earnings:</span>
                    <span className="text-primary">
                      {formatCurrency(sellerTotal - parseFloat(order.serviceFee || "0"))}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  <div className="flex justify-between">
                    <span>Customer paid total:</span>
                    <span>{formatCurrency(parseFloat(order.total || "0") + parseFloat(order.buyerServiceFee || "0"))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Including buyer service fee:</span>
                    <span>{formatCurrency(parseFloat(order.buyerServiceFee || "0"))}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informasi Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {order.address.recipientName}
                  </span>
                </div>
                {order.address.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{order.address.phone}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Alamat Pengiriman
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="font-medium">{order.address.recipientName}</p>
                {order.address.phone && (
                  <p className="text-sm text-muted-foreground">
                    {order.address.phone}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  {order.address.street}
                </p>
                <p className="text-sm text-muted-foreground">
                  {order.address.city}, {order.address.province}{" "}
                  {order.address.postalCode}
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full mt-3"
                onClick={() =>
                  navigator.clipboard.writeText(
                    `${order.address.recipientName}\n${order.address.phone || ""
                    }\n${order.address.street}\n${order.address.city}, ${order.address.province
                    } ${order.address.postalCode}`
                  )
                }
              >
                Salin Alamat
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/seller/orders">Kembali ke semua orderan</Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigator.clipboard.writeText(order.id)}
                >
                  Salin Order ID
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
