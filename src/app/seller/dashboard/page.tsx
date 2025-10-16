"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Package,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Plus,
  Eye,
  EyeOff,
  BarChart3,
  Store,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { formatCurrency } from "@/lib/client-utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type SellerStats = {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: string;
  totalGrossRevenue: string;
  totalServiceFeePaid: string;
  recentOrdersCount: number;
  lowStockProducts: number;
};

export default function SellerDashboardPage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [showRevenue, setShowRevenue] = React.useState(false);

  // Fetch store data
  const { data: storeData, isLoading: isLoadingStore } = useQuery({
    queryKey: ["user-store"],
    queryFn: async () => {
      const response = await fetch("/api/stores/me");
      if (!response.ok) {
        throw new Error("Failed to fetch store");
      }
      return response.json();
    },
    enabled: !!session?.user,
  });

  // Fetch dashboard stats
  const { data: statsData, isLoading: isLoadingStats, refetch: refetchStats } = useQuery<SellerStats>({
    queryKey: ["seller-stats"],
    queryFn: async (): Promise<SellerStats> => {
      const response = await fetch("/api/stores/dashboard/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }
      return response.json();
    },
    enabled: !!session?.user && !!storeData?.store,
  });

  // Handle authentication redirect using useEffect
  React.useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  // Show loading state while session is loading
  if (isPending) {
    return (
      <div className=" mx-auto py-8 container px-6 md:px-12">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated
  if (!session?.user) {
    return (
      <div className=" mx-auto py-8 container px-6 md:px-12">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (isLoadingStore) {
    return (
      <div className="container mx-auto py-8 px-6 md:px-12 ">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // If user doesn't have a store, redirect to create store
  if (!isLoadingStore && !storeData?.store) {
    router.push("/seller-new");
    return (
      <div className="container mx-auto py-8 px-6 md:px-12 ">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Redirecting to store setup...</p>
        </div>
      </div>
    );
  }

  const store = storeData?.store;
  const stats: SellerStats = statsData || {
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: "0.00",
    totalGrossRevenue: "0.00",
    totalServiceFeePaid: "0.00",
    recentOrdersCount: 0,
    lowStockProducts: 0,
  };

  return (
    <div className="container mx-auto py-8 px-6 md:px-12 ">
      {/* Header */}
      <div className="mb-4 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-center items-start  justify-between">
          <div>
            <h1 className="lg:text-2xl text-xl font-bold mb-4 md:mb-0">Overview</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => refetchStats()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Link href="/seller/products/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Produk
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Produk
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                stats.totalProducts || 0
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {isLoadingStats ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                `${stats.activeProducts || 0} aktif`
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orderan</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                stats.totalOrders || 0
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {isLoadingStats ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                `${stats.pendingOrders || 0} pending`
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">Total Pendapatan 
                  <Tooltip>
                    <TooltipTrigger>
              <span 
              onClick={() => setShowRevenue(!showRevenue)}

            >
              {showRevenue ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </span></TooltipTrigger>
            <TooltipContent>
              {showRevenue ? "Sembunyikan Pendapatan" : "Tampilkan Pendapatan"}
            </TooltipContent>
            </Tooltip>
              </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? (
                <Skeleton className="h-8 w-24" />
              ) : showRevenue ? (
                formatCurrency(parseFloat(stats.totalRevenue || "0"))
              ) : (
                "••••••"
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {showRevenue ? (
                `Setelah potongan layanan (${formatCurrency(parseFloat(stats.totalServiceFeePaid || "0"))})`
              ) : (
                "Klik tombol untuk melihat"
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pesanan Terbaru</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                stats.recentOrdersCount || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">30 Hari Terakhir</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Store Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Aksi Cepat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Link href="/seller/products">
                <Button variant="outline" className="w-full justify-start">
                  <Package className="mr-2 h-4 w-4" />
                  Manage Produk
                </Button>
              </Link>
              <Link href="/seller/orders">
                <Button variant="outline" className="w-full justify-start">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Lihat Orderan
                </Button>
              </Link>
              <Link href="/seller/products/new">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Produk
                </Button>
              </Link>
              <Link href={`/stores/${store?.slug}`} target="_blank">
                <Button variant="outline" className="w-full justify-start">
                  <Eye className="mr-2 h-4 w-4" />
                  Lihat Toko
                </Button>
              </Link>
            </div>

            {/* Alerts */}
            <div className="space-y-2">
              {stats.lowStockProducts > 0 && (
                <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800">
                      {stats.lowStockProducts} Produk stok menipis
                    </span>
                  </div>
                  <Link href="/seller/products?filter=low-stock">
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                  </Link>
                </div>
              )}

              {stats.pendingOrders > 0 && (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-800">
                      {stats.pendingOrders} Orderan butuuh perhatian
                    </span>
                  </div>
                  <Link href="/seller/orders?status=pending">
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Store Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Informasi Toko
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Nama
                </label>
                <p className="text-lg font-semibold">{store?.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  URL
                </label>
                <p className="text-sm text-blue-600">
                  <Link
                    href={`/stores/${store?.slug}`}
                    className="hover:underline"
                  >
                    /stores/{store?.slug}
                  </Link>
                </p>
              </div>

              {store?.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Deskripsi
                  </label>
                  <p className="text-sm">{store.description}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Tanggal Bergabung
                </label>
                <p className="text-sm">
                  {new Date(store?.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Link href="/settings">
                <Button variant="outline" className="w-full">
                  <Store className="mr-2 h-4 w-4" />
                  Ubah Informasi Toko
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
