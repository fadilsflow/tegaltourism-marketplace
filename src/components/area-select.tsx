"use client";

import { useQuery } from "@tanstack/react-query";
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
  latitude: number;
  longitude: number;
};

export function AreaSelect({ value, onChange, disabled }: Props) {
  const { data, isLoading } = useQuery<Destination[]>({
    queryKey: ["destinations"],
    queryFn: async () => {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const res = await fetch(`${baseUrl}/api/destination`);
      if (!res.ok) throw new Error("Gagal memuat destinasi");
      return res.json();
    },
  });

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue
          placeholder={isLoading ? "Memuat..." : "Pilih Destinasi"}
        />
      </SelectTrigger>

      <SelectContent className="w-full">
        {data && data.length > 0 ? (
          data.map((dest) => (
            <SelectItem key={dest.id} value={dest.id}>
              {dest.name}
            </SelectItem>
          ))
        ) : (
          <SelectItem disabled value="none">
            Tidak ada destinasi tersedia
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}
