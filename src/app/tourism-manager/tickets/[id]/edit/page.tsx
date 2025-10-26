"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ImageUpload } from "@/components/image-upload";

export default function EditTicketPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    image: "",
  });

  // Fetch ticket data
  const { data: ticket, isLoading: ticketLoading } = useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: async () => {
      const response = await fetch(`/api/tourism-manager/tickets/${ticketId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch ticket");
      }
      return response.json();
    },
    enabled: !!ticketId,
  });

  // Update form data when ticket is loaded
  useEffect(() => {
    if (ticket) {
      setFormData({
        name: ticket.name || "",
        description: ticket.description || "",
        price: ticket.price || "",
        stock: ticket.stock?.toString() || "",
        image: ticket.image || "",
      });
    }
  }, [ticket]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/tourism-manager/tickets/${ticketId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update ticket");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tourism-manager-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      toast.success("Tiket berhasil diperbarui");
      router.push("/tourism-manager/tickets");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.stock) {
      toast.error("Mohon lengkapi semua field yang wajib diisi");
      return;
    }

    updateMutation.mutate({
      ...formData,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (ticketLoading) {
    return (
      <div className="container mx-auto px-4 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/tourism-manager/tickets">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Edit Tiket</h1>
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

  if (!ticket) {
    return (
      <div className="container mx-auto px-4 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/tourism-manager/tickets">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Edit Tiket</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-medium mb-2">Tiket tidak ditemukan</h3>
            <p className="text-muted-foreground text-center">
              Tiket yang Anda cari tidak ditemukan atau tidak dapat diakses
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/tourism-manager/tickets">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Edit Tiket</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Tiket</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Tiket *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Contoh: Tiket Masuk Candi Borobudur"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Harga (Rp) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  placeholder="50000"
                  min="0"
                  step="1"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">Stok Tiket *</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => handleInputChange("stock", e.target.value)}
                  placeholder="100"
                  min="1"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Gambar Tiket</Label>
                <ImageUpload
                  value={formData.image}
                  onChange={(url) => handleInputChange("image", url)}
                  uploadPreset="jrm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Deskripsikan tiket wisata ini..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/tourism-manager/tickets">
                <Button type="button" variant="outline">
                  Batal
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
