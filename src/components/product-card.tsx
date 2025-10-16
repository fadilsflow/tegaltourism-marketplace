"use client";

import React from "react";
import Link from "next/link";
import { Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/client-utils";
import { cn } from "@/lib/utils";
import Image from "next/image";

export type Product = {
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
  store?: {
    id: string;
    name: string;
    slug: string;
  };
};

interface ProductCardProps {
  product: Product;
  className?: string;
  disableLinks?: boolean;
}

export function ProductCard({
  product,
  className,
  disableLinks = false,
}: ProductCardProps) {
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  const cardContent = (
    <div
      className={cn(
        "block group h-full overflow-hidden transition-shadow duration-300",
        className
      )}
    >
      <div className="rounded-lg relative aspect-square overflow-hidden bg-muted border group-hover:border-primary transition-colors duration-300">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            onError={(e) => {
              e.currentTarget.srcset = "";
              e.currentTarget.src = "/default-product-image.png";
            }}
            placeholder="empty"
            className="object-cover h-full transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <div className="text-muted-foreground">No Image</div>
          </div>
        )}

        {/* Stock badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {isOutOfStock && (
            <Badge variant="destructive" className="text-xs">
              Habis
            </Badge>
          )}
          {isLowStock && (
            <Badge variant="secondary" className="text-xs">
              Stok: {product.stock}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1 pt-2">
        <h2 className="line-clamp-1 text-base font-medium">{product.name}</h2>

        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 max-w-[200px] break-words">
            {product.description}
          </p>
        )}

        {product.store && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            <Store className="w-3 h-3 mr-1" />
            <span className="line-clamp-1">{product.store.name}</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="text-md font-medium text-primary">
            {formatCurrency(parseFloat(product.price))}
          </span>
        </div>
      </div>
    </div>
  );

  if (disableLinks) {
    return cardContent;
  }

  return (
    <Link href={`/products/${product.slug}`} className="block">
      {cardContent}
    </Link>
  );
}

// Skeleton component for loading states
export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("block h-full overflow-hidden", className)}>
      <div className="rounded-lg aspect-square bg-muted animate-pulse border" />
      <div className="flex flex-col gap-1 pt-2">
        <div className="h-5 bg-muted rounded animate-pulse mb-1" />
        <div className="h-4 bg-muted rounded animate-pulse w-3/4 mb-1" />
        <div className="h-3 bg-muted rounded animate-pulse w-1/2 mb-1" />
        <div className="h-5 bg-muted rounded animate-pulse w-20 mt-auto" />
      </div>
    </div>
  );
}
