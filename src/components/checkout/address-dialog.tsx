"use client";

import React from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type Address = {
  id: string;
  recipientName: string;
  phone?: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
  createdAt: string;
};

interface AddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address?: Address | null;
  onSuccess?: () => void;
}

export function AddressDialog({
  open,
  onOpenChange,
  address,
  onSuccess,
}: AddressDialogProps) {
  const isEditing = !!address;
  const [formData, setFormData] = React.useState({
    recipientName: "",
    phone: "",
    street: "",
    city: "",
    province: "",
    postalCode: "",
    isDefault: false,
  });

  // Reset form when address changes or dialog opens
  React.useEffect(() => {
    if (open) {
      setFormData({
        recipientName: address?.recipientName || "",
        phone: address?.phone || "",
        street: address?.street || "",
        city: address?.city || "",
        province: address?.province || "",
        postalCode: address?.postalCode || "",
        isDefault: address?.isDefault || false,
      });
    }
  }, [address, open]);

  // Create address mutation
  const createAddressMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/api/addresses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create address");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Address created successfully!");
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error creating address:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create address"
      );
    },
  });

  // Update address mutation
  const updateAddressMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!address) throw new Error("No address to update");

      const response = await fetch(`/api/addresses/${address.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update address");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Address updated successfully!");
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error updating address:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update address"
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.recipientName.trim()) {
      toast.error("Recipient name is required");
      return;
    }
    if (!formData.street.trim()) {
      toast.error("Street address is required");
      return;
    }
    if (!formData.city.trim()) {
      toast.error("City is required");
      return;
    }
    if (!formData.province.trim()) {
      toast.error("Province is required");
      return;
    }
    if (!formData.postalCode.trim()) {
      toast.error("Postal code is required");
      return;
    }

    if (isEditing) {
      updateAddressMutation.mutate(formData);
    } else {
      createAddressMutation.mutate(formData);
    }
  };

  const isLoading =
    createAddressMutation.isPending || updateAddressMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {isEditing ? "Edit Alamat" : "Tambah Alamat Baru"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Ubah alamat pengiriman anda"
              : "Tambahkan alamat pengiriman baru untuk pesanan Anda"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Recipient Name */}
          <div className="space-y-2">
            <Label htmlFor="recipientName">Nama Penerima</Label>
            <Input
              id="recipientName"
              placeholder="Nama Lengkap"
              value={formData.recipientName}
              onChange={(e) =>
                setFormData({ ...formData, recipientName: e.target.value })
              }
              required
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Nomor HP</Label>
            <Input
              id="phone"
              placeholder="+62 812 3456 7890"
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
          </div>

          {/* Street Address */}
          <div className="space-y-2">
            <Label htmlFor="street">Alamat Jalan</Label>
            <Input
              id="street"
              placeholder="Nama jalan, nomor rumah, gedung"
              value={formData.street}
              onChange={(e) =>
                setFormData({ ...formData, street: e.target.value })
              }
              required
            />
          </div>

          {/* City and Province */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Kota</Label>
              <Input
                id="city"
                placeholder="kota"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="province">Provinsi</Label>
              <Input
                id="province"
                placeholder="Provinsi"
                value={formData.province}
                onChange={(e) =>
                  setFormData({ ...formData, province: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Postal Code */}
          <div className="space-y-2">
            <Label htmlFor="postalCode">Kode POS</Label>
            <Input
              id="postalCode"
              placeholder="12345"
              value={formData.postalCode}
              onChange={(e) =>
                setFormData({ ...formData, postalCode: e.target.value })
              }
              required
            />
          </div>

          {/* Default Address */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Alamat Default</Label>
              <p className="text-sm text-muted-foreground">
                Gunakan ini sebagai alamat pengiriman default Anda
              </p>
            </div>
            <Switch
              checked={formData.isDefault}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isDefault: checked })
              }
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>{isEditing ? "Update Alamat" : "Tambah Alamat"}</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}