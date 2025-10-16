import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function CallToAction() {
    return (
        <section className="py-16">
            <div className="mx-auto container rounded-3xl border px-6 py-12 text-center md:py-20 lg:py-32">
                <h2 className="text-balance text-4xl font-semibold lg:text-5xl">
                    Siap Menjelajah atau Berjualan?
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                    Jelajahi produk khas Nusantara dari UMKM pilihan, atau daftarkan
                    usaha Anda dan jangkau pasar yang lebih luas bersama JRM.
                </p>

                <div className="mt-12 flex flex-wrap justify-center gap-4">
                    {/* Tombol utama untuk pembeli */}
                    <Button asChild size="lg">
                        <Link href="/products">
                            <span>Jelajahi Produk</span>
                        </Link>
                    </Button>

                    {/* Tombol sekunder untuk calon penjual */}
                    <Button asChild size="lg" variant="outline">
                        <Link href="/seller/dashboard">
                            <span>Mulai Berjualan</span>
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    )
}