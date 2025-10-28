"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Users, DollarSign, TrendingUp } from "lucide-react";
import { authClient } from "@/lib/auth-client";

type PopularTicket = {
  id: string;
  name: string;
  price: number;
  soldCount: number;
};

type RecentOrder = {
  id: string;
  createdAt: string;
  total: number;
  status: string;
};

export default function TourismManagerDashboard() {
  const { data: session } = authClient.useSession();
  
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["tourism-manager-stats"],
    queryFn: async () => {
      const response = await fetch("/api/tourism-manager/stats");
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch stats");
      }
      return response.json();
    },
    enabled: !!session?.user,
  });

  if (error) {
    return (
      <div className="container mx-auto px-4 space-y-6">
        <h1 className="text-2xl font-bold">Dashboard Pengelola Wisata</h1>
        <div className="text-center py-12">
          <div className="text-red-500 mb-2">
            Error: {error instanceof Error ? error.message : "Terjadi kesalahan"}
          </div>
          <p className="text-sm text-muted-foreground">
            Pastikan Anda sudah login sebagai tourism manager
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 space-y-6">
        <h1 className="text-2xl font-bold">Dashboard Pengelola Wisata</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Loading...
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Pengelola Wisata</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Tiket
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalTickets || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tiket Terjual
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.soldTickets || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Pendapatan
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {stats?.totalRevenue?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pesanan Bulan Ini
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.monthlyOrders || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tiket Terpopuler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.popularTickets?.map((ticket: PopularTicket) => (
                <div key={ticket.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{ticket.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {ticket.soldCount} terjual
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">Rp {ticket.price?.toLocaleString()}</p>
                  </div>
                </div>
              )) || (
                <p className="text-muted-foreground">Belum ada tiket</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pesanan Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentOrders?.map((order: RecentOrder) => (
                <div key={order.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">#{order.id.slice(-8)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">Rp {order.total?.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">{order.status}</p>
                  </div>
                </div>
              )) || (
                <p className="text-muted-foreground">Belum ada pesanan</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}