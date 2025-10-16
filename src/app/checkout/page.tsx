"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  Clock,
  Package,
  Plus,
  Edit,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { AddressDialog } from "@/components/checkout/address-dialog";
import { useCart } from "@/hooks/use-cart";
import { authClient } from "@/lib/auth-client";
import { formatCurrency } from "@/lib/client-utils";
import { checkoutSchema } from "@/lib/validations";
import { getBuyerServiceFeeSync } from "@/lib/client-config";
import type { z } from "zod";
import Image from "next/image";

type CheckoutForm = z.infer<typeof checkoutSchema>;

type Address = {
  id: string;
  recipientName: string;
  phone?: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
  createdAt: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { cart, clearCart } = useCart();
  const { data: session, isPending } = authClient.useSession();
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: "pay_now",
      notes: "",
    },
  });

  // Fetch user addresses
  const {
    data: addressesData,
    isLoading: isLoadingAddresses,
    error: addressesError,
  } = useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      const response = await fetch("/api/addresses");
      if (!response.ok) {
        throw new Error("Failed to fetch addresses");
      }
      return response.json();
    },
    enabled: !!session?.user,
  });

  // Fetch buyer service fee
  const {
    data: buyerServiceFeeData,
  } = useQuery({
    queryKey: ["buyer-service-fee"],
    queryFn: async () => {
      const response = await fetch("/api/buyer-service-fee");
      if (!response.ok) {
        throw new Error("Failed to fetch buyer service fee");
      }
      return response.json();
    },
    enabled: !!session?.user,
  });

  // Create order mutation
  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (data: CheckoutForm) => {
      if (!cart || cart.items.length === 0) {
        throw new Error("Cart is empty");
      }

      // 1. Create the order
      const orderData = {
        addressId: data.addressId,
        items: cart.items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create order");
      }

      const orderResult = await response.json();

      // 2. If pay_now -> create payment
      if (data.paymentMethod === "pay_now") {
        const paymentResponse = await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: orderResult.order.id,
            paymentType: "snap", // atau sesuai field schema kamu
          }),
        });

        if (!paymentResponse.ok) {
          const error = await paymentResponse.json();
          throw new Error(error.error || "Failed to create payment");
        }

        const paymentData = await paymentResponse.json();

        window.location.href = paymentData.redirect_url;
      }

      return orderResult;
    },
    onSuccess: (data, formData) => {
      clearCart();

      if (formData.paymentMethod === "pay_later") {
        toast.success("Order created successfully! You can pay later.");
        router.push(`/orders/${data.order.id}`);
      } else {
        toast.info("Redirecting to payment...");
      }
    },
    onError: (error) => {
      console.error("Error creating order:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create order"
      );
    },
  });

  const onSubmit = (data: CheckoutForm) => {
    createOrderMutation.mutate(data);
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setShowAddressDialog(true);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setShowAddressDialog(true);
  };

  // Handle authentication and cart validation redirects
  React.useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
      return;
    }

    if (!isPending && session?.user && (!cart || cart.items.length === 0)) {
      router.push("/products");
      return;
    }
  }, [session, isPending, cart, router]);

  // Get addresses data
  const addresses = addressesData?.addresses || [];
  const defaultAddress = addresses.find((addr: Address) => addr.isDefault);

  // Get buyer service fee
  const buyerServiceFee = buyerServiceFeeData?.buyerServiceFee || getBuyerServiceFeeSync();

  // Set default address if available and not already set
  React.useEffect(() => {
    if (defaultAddress && !form.getValues("addressId")) {
      form.setValue("addressId", defaultAddress.id);
    }
  }, [defaultAddress, form]);

  // Show loading state while session is loading
  if (isPending) {
    return (
      <div className="container mx-auto py-8 px-6 md:px-12 ">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated
  if (!session?.user) {
    return (
      <div className="container mx-auto py-8 px-6 md:px-12 ">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if cart is empty
  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto py-8 px-6 md:px-12 ">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Redirecting to products...</p>
        </div>
      </div>
    );
  }

  const selectedAddressId = form.watch("addressId");
  const selectedAddress = addresses.find(
    (addr: Address) => addr.id === selectedAddressId
  );

  return (
    <div className="container mx-auto py-8 px-6 md:px-12">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Cart
        </Button>
        <h1 className="text-3xl font-bold">Checkout</h1>
        <p className="text-muted-foreground">
          Review your order and complete your purchase
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Delivery Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoadingAddresses ? (
                    <div className="space-y-3">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-10 w-32" />
                    </div>
                  ) : addressesError ? (
                    <div className="text-center py-4">
                      <p className="text-destructive mb-2">
                        Failed to load addresses
                      </p>
                      <Button variant="outline" onClick={handleAddAddress}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Address
                      </Button>
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="text-center py-8">
                      <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="font-medium mb-2">No addresses found</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Please add a delivery address to continue
                      </p>
                      <Button onClick={handleAddAddress}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Address
                      </Button>
                    </div>
                  ) : (
                    <>
                      <FormField
                        control={form.control}
                        name="addressId"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="space-y-2"
                              >
                                {addresses.map((address: Address) => (
                                  <div
                                    key={address.id}
                                    className="flex items-start space-x-3 p-4 border rounded-lg"
                                  >
                                    <RadioGroupItem
                                      value={address.id}
                                      id={address.id}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <label
                                          htmlFor={address.id}
                                          className="font-medium cursor-pointer"
                                        >
                                          {address.recipientName}
                                        </label>
                                        {address.isDefault && (
                                          <Badge
                                            variant="secondary"
                                            className="text-xs"
                                          >
                                            Default
                                          </Badge>
                                        )}
                                      </div>
                                      {address.phone && (
                                        <p className="text-sm text-muted-foreground">
                                          {address.phone}
                                        </p>
                                      )}
                                      <p className="text-sm text-muted-foreground">
                                        {address.street}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {address.city}, {address.province}{" "}
                                        {address.postalCode}
                                      </p>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditAddress(address)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddAddress}
                        className="w-full"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Address
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="space-y-2"
                          >
                            <div className="flex items-center space-x-3 p-4 border rounded-lg">
                              <RadioGroupItem value="pay_now" id="pay_now" />
                              <div className="flex-1">
                                <label
                                  htmlFor="pay_now"
                                  className="font-medium cursor-pointer flex items-center gap-2"
                                >
                                  <CreditCard className="h-4 w-4" />
                                  Pay Now
                                </label>
                                <p className="text-sm text-muted-foreground">
                                  Complete payment immediately
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3 p-4 border rounded-lg">
                              <RadioGroupItem
                                value="pay_later"
                                id="pay_later"
                              />
                              <div className="flex-1">
                                <label
                                  htmlFor="pay_later"
                                  className="font-medium cursor-pointer flex items-center gap-2"
                                >
                                  <Clock className="h-4 w-4" />
                                  Pay Later
                                </label>
                                <p className="text-sm text-muted-foreground">
                                  Pay when you receive the order
                                </p>
                              </div>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Order Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Notes (Optional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Special instructions</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any special requests or delivery instructions..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Any additional information for your order
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Card>
                <CardContent className="pt-6">
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={
                      createOrderMutation.isPending ||
                      !selectedAddress ||
                      addresses.length === 0
                    }
                  >
                    {createOrderMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing Order...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Place Order • {formatCurrency(parseFloat(cart.total) + buyerServiceFee)}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="relative w-12 h-12 flex-shrink-0 border rounded-lg overflow-hidden">
                    {item.product.image ? (
                      <Image
                        fill
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm leading-tight">
                      {item.product.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {item.store.name}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">
                        Qty: {item.quantity}
                      </span>
                      <span className="font-medium text-sm">
                        {formatCurrency(
                          parseFloat(item.product.price) * item.quantity
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Subtotal:</span>
                  <span className="text-sm">
                    {formatCurrency(parseFloat(cart.total))}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Service Fee:</span>
                  <span className="text-sm">
                    {formatCurrency(buyerServiceFee)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-lg text-primary">
                    {formatCurrency(parseFloat(cart.total) + buyerServiceFee)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {cart.itemCount} item{cart.itemCount > 1 ? "s" : ""}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Selected Address Summary */}
          {selectedAddress && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Delivery To</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="font-medium">{selectedAddress.recipientName}</p>
                  {selectedAddress.phone && (
                    <p className="text-sm text-muted-foreground">
                      {selectedAddress.phone}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {selectedAddress.street}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedAddress.city}, {selectedAddress.province}{" "}
                    {selectedAddress.postalCode}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Address Dialog */}
      <AddressDialog
        open={showAddressDialog}
        onOpenChange={setShowAddressDialog}
        address={editingAddress}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["addresses"] });
          setShowAddressDialog(false);
        }}
      />
    </div>
  );
}

