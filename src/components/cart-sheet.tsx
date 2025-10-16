"use client";

import React from "react";
import { ShoppingCart, X, Minus, Plus, Package } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/use-cart";
import { useCartStore } from "@/lib/cart-store";
import { formatCurrency } from "@/lib/client-utils";
import Image from "next/image";

interface CartSheetProps {
  children: React.ReactNode;
}

export function CartSheet({ children }: CartSheetProps) {
  const {
    cart,
    isOpen,
    itemCount,
    total,
    optimisticUpdateQuantity,
    optimisticRemoveItem,
    clearCart,
    closeCart,
  } = useCart();

  const { setIsOpen } = useCartStore();

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      await optimisticRemoveItem(itemId);
    } else {
      await optimisticUpdateQuantity(itemId, newQuantity);
    }
  };

  const handleClearCart = async () => {
    if (confirm("Apakah Anda yakin ingin mengosongkan keranjang?")) {
      await clearCart();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-full px-6">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Keranjang Belanja
            {itemCount > 0 && (
              <Badge variant="secondary">
                {itemCount} item{itemCount > 1 ? "s" : ""}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 h-[calc(100vh-200px)] py-6">
          {!cart || cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-8">
              <ShoppingCart className="w-16 h-16 text-muted-foreground" />
              <div className="text-center">
                <p className="text-lg font-medium mb-2">Keranjang kosong</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Tambahkan produk untuk mulai berbelanja
                </p>
              </div>
              <Button variant="outline" onClick={() => closeCart()} asChild>
                <Link href="/products">Jelajahi Produk</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 border rounded-lg relative"
                >
                  {/* Remove Button */}
                  <button
                    className="absolute -top-2 -right-2 text-muted-foreground hover:text-destructive rounded-full p-1 border bg-background shadow-sm transition-colors"
                    onClick={() => optimisticRemoveItem(item.id)}
                    title="Hapus item"
                  >
                    <X className="h-3 w-3" />
                  </button>

                  {/* Product Image */}
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

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.product.slug}`}
                      onClick={() => closeCart()}
                    >
                      <h3 className="font-medium text-sm leading-tight hover:text-primary transition-colors truncate">
                        {item.product.name}
                      </h3>
                    </Link>

                    <Link
                      href={`/stores/${item.store.slug}`}
                      onClick={() => closeCart()}
                    >
                      <p className="text-xs text-muted-foreground hover:text-primary transition-colors mt-1">
                        {item.store.name}
                      </p>
                    </Link>

                    <div className="flex items-center justify-between mt-2">
                      <p className="font-semibold text-sm text-primary">
                        {formatCurrency(parseFloat(item.product.price))}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity - 1)
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>

                        <span className="text-sm font-medium w-8 text-center">
                          {item.quantity}
                        </span>

                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity + 1)
                          }
                          disabled={item.quantity >= item.product.stock}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Stock Warning */}
                    {item.product.stock <= 5 && (
                      <p className="text-xs text-amber-600 mt-1">
                        Stok tinggal {item.product.stock}
                      </p>
                    )}

                    {/* Subtotal */}
                    <p className="text-xs text-muted-foreground mt-1">
                      Subtotal:{" "}
                      {formatCurrency(
                        parseFloat(item.product.price) * item.quantity
                      )}
                    </p>
                  </div>
                </div>
              ))}

              {/* Clear Cart Button */}
              {cart.items.length > 0 && (
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearCart}
                    className="w-full text-destructive hover:text-destructive"
                  >
                    Kosongkan Keranjang
                  </Button>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {cart && cart.items.length > 0 && (
          <SheetFooter className="border-t pt-6">
            <div className="w-full space-y-4">
              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total:</span>
                <span className="font-bold text-lg text-primary">
                  {formatCurrency(total)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => closeCart()} asChild>
                  <Link href="/products">Lanjut Belanja</Link>
                </Button>
                <Button
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => closeCart()}
                  asChild
                >
                  <Link href="/checkout">Checkout</Link>
                </Button>
              </div>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
