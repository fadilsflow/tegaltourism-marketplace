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
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  Truck,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { formatCurrency } from "@/lib/client-utils";
import { useCart } from "@/hooks/use-cart";
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

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const { optimisticAddItem } = useCart();
  const queryClient = useQueryClient();

  // Fetch order details
  const {
    data: order,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["order", id],
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

  // Pay order mutation using Midtrans
  const payOrderMutation = useMutation({
    mutationFn: async () => {
      // Create payment using Midtrans
      const paymentResponse = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: id,
          paymentType: "snap",
        }),
      });

      if (!paymentResponse.ok) {
        const error = await paymentResponse.json();
        throw new Error(error.error || "Failed to create payment");
      }

      const paymentData = await paymentResponse.json();
      return paymentData;
    },
    onSuccess: (data) => {
      if (data.message === "Using existing payment") {
        toast.info("Continuing with existing payment...");
      } else {
        toast.info("Redirecting to payment...");
      }
      window.location.href = data.redirect_url;
    },
    onError: (error) => {
      console.error("Error creating payment:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create payment"
      );
    },
  });

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "cancelled" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to cancel order");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Order cancelled successfully!");
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error) => {
      console.error("Error cancelling order:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel order"
      );
    },
  });

  const handlePayOrder = () => {
    if (confirm("Proceed with payment for this order?")) {
      payOrderMutation.mutate();
    }
  };

  const handleCancelOrder = () => {
    if (
      confirm(
        "Are you sure you want to cancel this order? This action cannot be undone."
      )
    ) {
      cancelOrderMutation.mutate();
    }
  };

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async () => {
      if (!order) throw new Error("Order not found");

      // Add each item to cart
      for (const item of order.items) {
        await optimisticAddItem(
          {
            id: item.product.id,
            name: item.product.name,
            slug: item.product.slug,
            price: item.price,
            stock: 100, // Default stock since we don't have it in order
            image: item.product.image,
            status: "active",
          },
          {
            id: item.store.id,
            name: item.store.name,
            slug: item.store.slug,
          },
          item.quantity
        );
      }

      return order;
    },
    onSuccess: () => {
      toast.success("Items added to cart! You can now proceed to checkout.");
      router.push("/checkout");
    },
    onError: (error) => {
      console.error("Error reordering:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to reorder items"
      );
    },
  });

  const handleReorder = () => {
    if (confirm("Add all items from this order to your cart?")) {
      reorderMutation.mutate();
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
          <h2 className="text-2xl font-bold mb-2">Pesanan tidak ditemukan</h2>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error
              ? error.message
              : "The order you're looking for doesn't exist"}
          </p>
          <Button onClick={() => router.push("/orders")}>Kembali ke Pesanan</Button>
        </div>
      </div>
    );
  }

  const status = statusConfig[order.status as OrderStatus];
  const StatusIcon = status.icon;

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
            <h1 className="text-3xl font-bold">Pesanan #{order.id.slice(-8)}</h1>
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
              {order.items.map((item: OrderItem) => (
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
                    <Link href={`/stores/${item.store.slug}`}>
                      <p className="text-sm text-muted-foreground hover:text-primary transition-colors">
                        {item.store.name}
                      </p>
                    </Link>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-muted-foreground">
                        Quantity: {item.quantity}
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

          {/* Order Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Status Pesanan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <StatusIcon className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">{status.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {status.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Terakhir diperbarui: {new Date(order.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Pembayaran
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(parseFloat(order.total || "0"))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service Fee:</span>
                  <span>{formatCurrency(parseFloat(order.buyerServiceFee || "0"))}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span className="text-primary">
                      {formatCurrency(parseFloat(order.total || "0") + parseFloat(order.buyerServiceFee || "0"))}
                    </span>
                  </div>
                </div>
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
            </CardContent>
          </Card>

          {/* Order Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {order.status === "pending" && (
                  <Button
                    className="w-full"
                    onClick={handlePayOrder}
                    disabled={payOrderMutation.isPending}
                  >
                    {payOrderMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Bayar Sekarang
                      </>
                    )}
                  </Button>
                )}
                {order.status === "pending" && (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleCancelOrder}
                    disabled={cancelOrderMutation.isPending}
                  >
                    {cancelOrderMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Membatalkan...
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-2 h-4 w-4" />
                        Batalkan Pesanan
                      </>
                    )}
                  </Button>
                )}
                {order.status === "completed" && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleReorder}
                    disabled={reorderMutation.isPending}
                  >
                    {reorderMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menambahkan ke keranjang...
                      </>
                    ) : (
                      <>
                        <Package className="mr-2 h-4 w-4" />
                        Reorder Produk
                      </>
                    )}
                  </Button>
                )}
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/orders">Lihat Semua Pesanan</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
