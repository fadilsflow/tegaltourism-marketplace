"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Eye, Package } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

export default function TourismManagerTickets() {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["tourism-manager-tickets"],
    queryFn: async () => {
      const response = await fetch("/api/tourism-manager/tickets");
      if (!response.ok) {
        throw new Error("Failed to fetch tickets");
      }
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      const response = await fetch(`/api/tourism-manager/tickets/${ticketId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete ticket");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tourism-manager-tickets"] });
      toast.success("Tiket berhasil dihapus");
      setDeletingId(null);
    },
    onError: (error) => {
      toast.error(error.message);
      setDeletingId(null);
    },
  });

  const handleDelete = (ticketId: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus tiket ini?")) {
      setDeletingId(ticketId);
      deleteMutation.mutate(ticketId);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Kelola Tiket</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Kelola Tiket</h1>
        <Link href="/tourism-manager/tickets/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Tiket
          </Button>
        </Link>
      </div>

      {tickets?.tickets?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Belum ada tiket</h3>
            <p className="text-muted-foreground text-center mb-4">
              Mulai dengan membuat tiket masuk wisata pertama Anda
            </p>
            <Link href="/tourism-manager/tickets/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Tiket Pertama
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tickets?.tickets?.map((ticket: any) => (
            <Card key={ticket.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{ticket.name}</CardTitle>
                  <Badge variant={ticket.status === "active" ? "default" : "secondary"}>
                    {ticket.status === "active" ? "Aktif" : "Tidak Aktif"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Harga</p>
                    <p className="text-lg font-semibold">
                      Rp {ticket.price?.toLocaleString()}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Stok</p>
                    <p className="font-medium">{ticket.stock} tiket</p>
                  </div>

                  {ticket.description && (
                    <div>
                      <p className="text-sm text-muted-foreground">Deskripsi</p>
                      <p className="text-sm line-clamp-2">{ticket.description}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Link href={`/tourism-manager/tickets/${ticket.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/tourism-manager/tickets/${ticket.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(ticket.id)}
                      disabled={deletingId === ticket.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
