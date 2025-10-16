"use client";

import React, { useState, use } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Store,
  Minus,
  Plus,
  ArrowLeft,
  Share2,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/client-utils";
import { useCart } from "@/hooks/use-cart";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [copied, setCopied] = useState(false);
  const { optimisticAddItem } = useCart();
  const { data: session } = authClient.useSession();
  const isAuthenticated = !!session?.user;

  // Fetch product details
  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const response = await fetch(`/api/products/slug/${slug}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Product not found");
      }
      return response.json();
    },
  });

  // Add to cart with optimistic update
  const handleAddToCart = async () => {
    if (!product) return;

    if (!isAuthenticated) {
      toast.error(
        "Silakan login terlebih dahulu untuk menambahkan ke keranjang"
      );
      router.push("/login");
      return;
    }

    // Use optimistic update for instant UI feedback
    await optimisticAddItem(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        stock: product.stock,
        image: product.image,
        status: product.status,
      },
      {
        id: product.store.id,
        name: product.store.name,
        slug: product.store.slug,
      },
      quantity
    );
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 0)) {
      setQuantity(newQuantity);
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Link produk disalin ke clipboard!");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-6 md:px-12">
        <div className="mb-6">
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto py-8 px-6 md:px-12">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Produk Tidak Ditemukan</h2>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error
              ? error.message
              : "Produk yang Anda cari tidak ditemukan"}
          </p>
          <Button onClick={() => router.push("/products")}>
            Kembali ke Produk
          </Button>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div className="container mx-auto py-8 px-6 md:px-12">
      {/* Breadcrumb */}
      <div className="mb-6 justify-between flex">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        <Button variant="outline" onClick={handleCopyLink}>
          {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg border">
            {product.image ? (
              <Image
                fill
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.srcset = "";
                  e.currentTarget.src = "/default-product-image.png";
                }}
                placeholder="empty"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <div className="text-muted-foreground">No Image</div>
              </div>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>

            {/* Store Info */}
            <Link href={`/stores/${product.store.slug}`}>
              <div className="flex items-center text-muted-foreground hover:text-primary transition-colors mb-4">
                <Store className="w-4 h-4 mr-2" />
                <span className="font-medium">{product.store.name}</span>
              </div>
            </Link>


            {/* Price */}
            <div className="text-3xl font-bold text-primary mb-4">
              {formatCurrency(parseFloat(product.price))}
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2 mb-4">
              {isOutOfStock && <Badge variant="destructive">Stok Habis</Badge>}
              {isLowStock && (
                <Badge variant="secondary">
                  Stok Terbatas ({product.stock} tersisa)
                </Badge>
              )}
              {!isOutOfStock && !isLowStock && (
                <Badge variant="default">Tersedia ({product.stock} stok)</Badge>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Deskripsi Produk</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}
          </div>

          {/* Add to Cart Section */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Quantity Selector */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Jumlah
                  </Label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) =>
                        handleQuantityChange(parseInt(e.target.value) || 1)
                      }
                      className="w-20 text-center"
                      min="1"
                      max={product.stock}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={quantity >= product.stock}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Maksimal {product.stock} item
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {isOutOfStock ? "Stok Habis" : "Tambah ke Keranjang"}
                  </Button>

                </div>

                {/* Total Price */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total:</span>
                    <span className="text-xl font-bold text-primary">
                      {formatCurrency(parseFloat(product.price) * quantity)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
