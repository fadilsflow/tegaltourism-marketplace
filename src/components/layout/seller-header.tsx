"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "../ui/button";
import { LayoutDashboard, Package, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    name: "Dashboard",
    href: "/seller/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Produk",
    href: "/seller/products",
    icon: Package,
  },
  {
    name: "Orderan",
    href: "/seller/orders",
    icon: ShoppingBag,
  },
];

export function SellerHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-17 z-50 w-full bg-background border-b">
      <div className="mx-auto container px-6 md:px-12 py-4">
        <div className="flex items-center justify-between w-full gap-4">
          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "flex items-center gap-2",
                      isActive && "bg-primary text-primary-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden mt-4 flex items-center gap-1 overflow-x-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "flex items-center gap-2 whitespace-nowrap",
                    isActive && "bg-primary text-primary-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
