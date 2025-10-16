"use client";

import { useEffect } from "react";
import { useCart } from "@/hooks/use-cart";
import { authClient } from "@/lib/auth-client";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { fetchCart } = useCart();
  const { data: session, isPending } = authClient.useSession();
  const isAuthenticated = !!session?.user && !isPending;

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  return <>{children}</>;
}
