"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Eye,
  Filter,
  ArrowLeft,
  Loader2,
  CreditCard,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

type Order = {
  id: string;
  status: OrderStatus;
  total: string;
  serviceFee: string;
  buyerServiceFee: string;
  createdAt: string;
  updatedAt: string;
  address: {
    id: string;
    recipientName: string;
    street: string;
    city: string;
    province: string;
    postalCode: string;
  };
  items: OrderItem[];
};

const statusConfig = {
  pending: {
    label: "Pending",
    icon: Clock,
    variant: "secondary" as const,
  },
  paid: {
    label: "Paid",
    icon: CheckCircle,
    variant: "default" as const,
  },
  shipped: {
    label: "Shipped",
    icon: Truck,
    variant: "default" as const,
  },
  completed: {
    label: "Completed",
    icon: CheckCircle,
    variant: "default" as const,
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    variant: "destructive" as const,
  },
};

export default function OrdersPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const { optimisticAddItem } = useCart();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  // Fetch orders
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["orders", page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      const response = await fetch(`/api/orders?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }
      return response.json();
    },
    enabled: !!session?.user,
  });

  // Pay order mutation using Midtrans
  const payOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      // Create payment using Midtrans
      const paymentResponse = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderId,
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

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      // First get the order details to get items
      const orderResponse = await fetch(`/api/orders/${orderId}`);
      if (!orderResponse.ok) {
        throw new Error("Failed to fetch order details");
      }
      const orderData = await orderResponse.json();

      // Add each item to cart
      for (const item of orderData.items) {
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

      return orderData;
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

  const handlePayOrder = (orderId: string) => {
    if (confirm("Proceed with payment for this order?")) {
      payOrderMutation.mutate(orderId);
    }
  };

  const handleReorder = (orderId: string) => {
    if (confirm("Add all items from this order to your cart?")) {
      reorderMutation.mutate(orderId);
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
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const orders = ordersData?.orders || [];
  const pagination = ordersData?.pagination;

  // Filter orders by status
  const filteredOrders = orders.filter((order: Order) =>
    statusFilter === "all" ? true : order.status === statusFilter
  );

  return (
    <div className="container mx-auto py-8 px-6 md:px-12">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Orders</h1>
            <p className="text-muted-foreground">
              Track and manage your orders
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filter by status:</span>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {statusFilter === "all"
              ? "No orders found"
              : `No ${statusFilter} orders`}
          </h3>
          <p className="text-muted-foreground mb-4">
            {statusFilter === "all"
              ? "You haven't placed any orders yet"
              : `You don't have any ${statusFilter} orders`}
          </p>
          <Button asChild>
            <Link href="/products">Start Shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order: Order) => {
            const status = statusConfig[order.status];
            const StatusIcon = status.icon;
            const firstItem = order.items[0];
            const itemCount = order.items.length;

            return (
              <Card key={order.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">
                          Order #{order.id.slice(-8)}
                        </h3>
                        <Badge variant={status.variant} className="text-xs">
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {status.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Placed on{" "}
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Deliver to: {order.address.recipientName} •{" "}
                        {order.address.city}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        {formatCurrency(parseFloat(order.total || "0") + parseFloat(order.buyerServiceFee || "0"))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {itemCount} item{itemCount > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="flex items-center gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
                    <div className="relative w-12 h-12 flex-shrink-0 border rounded-lg overflow-hidden">
                      {firstItem.product.image ? (
                        <Image
                          fill
                          src={firstItem.product.image}
                          alt={firstItem.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {firstItem.product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {firstItem.store.name}
                      </p>
                      {itemCount > 1 && (
                        <p className="text-xs text-muted-foreground">
                          +{itemCount - 1} more item{itemCount > 2 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/orders/${order.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </Button>
                    {order.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => handlePayOrder(order.id)}
                        disabled={payOrderMutation.isPending}
                      >
                        {payOrderMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Pay Now
                          </>
                        )}
                      </Button>
                    )}
                    {order.status === "completed" && (
                      <Button
                        size="sm"
                        onClick={() => handleReorder(order.id)}
                        disabled={reorderMutation.isPending}
                      >
                        {reorderMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Package className="mr-2 h-4 w-4" />
                            Reorder
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button
            variant="outline"
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm">
            Page {page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page >= pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
