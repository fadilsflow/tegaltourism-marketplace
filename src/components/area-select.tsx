"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  value?: string;
  onChange: (val: string) => void;
  disabled?: boolean;
};

type Destination = {
  id: string;
  name: string;
};

const DESTINATIONS: Destination[] = [
  { id: "sindang", name: "Sindang Kemad" },
  { id: "cempaka", name: "Desa Cempaka" },
  { id: "guci", name: "Guci" },
  { id: "sigedong", name: "Sigedong" },
  { id: "sawahbatu", name: "Sawah Batu" },
  { id: "lembah_rembulan", name: "Lembah Rembulan" },
  { id: "semedo", name: "Museum Semedo" },
  { id: "cacaban", name: "Cacaban" },
  { id: "purin", name: "Purwahamba" },
  { id: "penusupan", name: "Desa Wisata Karang Cengis" },
  { id: "kalimus", name: "Kalimus" },
];

export function AreaSelect({ value, onChange, disabled }: Props) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Pilih Destinasi" />
      </SelectTrigger>

      <SelectContent className="w-full">
        {DESTINATIONS.map((dest) => (
          <SelectItem key={dest.id} value={dest.id}>
            {dest.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
