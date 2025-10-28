"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, QrCode } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function TourismManagerOrderDetail() {
  const params = useParams();
  const orderId = params.id as string;

  const { data: order, isLoading } = useQuery({
    queryKey: ["tourism-manager-order", orderId],
    queryFn: async () => {
      const response = await fetch(`/api/tourism-manager/orders/${orderId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch order");
      }
      return response.json();
    },
  });

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "Menunggu Pembayaran", variant: "secondary" as const },
      paid: { label: "Sudah Dibayar", variant: "default" as const },
      completed: { label: "Selesai", variant: "default" as const },
      cancelled: { label: "Dibatalkan", variant: "destructive" as const },
    };
    
    return statusMap[status as keyof typeof statusMap] || { label: status, variant: "secondary" as const };
  };

  const handleDownloadQR = (qrCode: string, ticketName: string) => {
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `qr-${ticketName.replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/tourism-manager/orders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Detail Pesanan</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/tourism-manager/orders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Detail Pesanan</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <QrCode className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Pesanan tidak ditemukan</h3>
            <p className="text-muted-foreground text-center">
              Pesanan dengan ID ini tidak ditemukan atau tidak dapat diakses
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusBadge(order.status);

  return (
    <div className="container mx-auto px-4 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/tourism-manager/orders">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Detail Pesanan</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Information */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle>Informasi Pesanan</CardTitle>
              <Badge variant={statusInfo.variant}>
                {statusInfo.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">ID Pesanan</p>
              <p className="font-medium">#{order.id.slice(-8)}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Tanggal Pesanan</p>
              <p className="font-medium">
                {new Date(order.createdAt).toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Pembeli</p>
              <p className="font-medium">{order.buyer?.name}</p>
              <p className="text-sm text-muted-foreground">{order.buyer?.email}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Total Pembayaran</p>
              <p className="font-medium text-lg">
                Rp {order.total?.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* QR Codes */}
        <Card>
          <CardHeader>
            <CardTitle>QR Code Tiket</CardTitle>
          </CardHeader>
          <CardContent>
            {order.status === "paid" ? (
              <div className="space-y-4">
                {order.qrCodes?.map((qr: any, index: number) => (
                  <div key={qr.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-medium">{qr.productName}</p>
                        <p className="text-sm text-muted-foreground">
                          Jumlah: {qr.quantity} tiket
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadQR(qr.qrCode, qr.productName)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                    
                    <div className="flex justify-center">
                      <img
                        src={qr.qrCode}
                        alt={`QR Code untuk ${qr.productName}`}
                        className="w-32 h-32 border rounded"
                      />
                    </div>
                    
                    <div className="mt-3 text-center">
                      <p className="text-xs text-muted-foreground">
                        Scan QR code ini untuk verifikasi tiket
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Status: {qr.isUsed ? "Sudah Digunakan" : "Belum Digunakan"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  QR code akan tersedia setelah pembayaran dikonfirmasi
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ticket Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Tiket</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items?.map((item: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  {item.product?.image && (
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div>
                    <p className="font-medium">{item.product?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} x Rp {item.price?.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    Rp {(item.price * item.quantity)?.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
