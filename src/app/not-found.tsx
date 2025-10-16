import { Button } from "@/components/ui/button";
import { SkipBack } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center gap-4">
            <h2 className="text-2xl  border-b pr-3">404 </h2>
            <p>Halaman ini tidak ditemukan.</p>
            <Button>
                <Link href="/" className="flex gap-2 items-center">Kembali ke halaman utama <SkipBack /></Link>
            </Button>
        </div>
    );
}
