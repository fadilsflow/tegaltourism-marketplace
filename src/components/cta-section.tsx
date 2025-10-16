import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function CallToAction() {
    return (
        <section className="py-16">
            <div className="mx-auto container rounded-3xl border px-6 py-12 text-center md:py-20 lg:py-32">
                <h2 className="text-balance text-4xl font-semibold lg:text-5xl">
                    Siap Menjelajah Wisata atau Berjualan?
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                    Jelajahi destinasi wisata Tegal 360° dan temukan produk khas dari setiap lokasi,
                    atau daftarkan usaha Anda sebagai mitra dan jangkau wisatawan yang lebih luas.
                </p>

                <div className="mt-12 flex flex-wrap justify-center gap-4">
                    {/* Tombol utama untuk wisatawan */}
                    <Button asChild size="lg">
                        <Link href="/products">
                            <span>Jelajahi Destinasi</span>
                        </Link>
                    </Button>

                    {/* Tombol sekunder untuk calon mitra */}
                    <Button asChild size="lg" variant="outline">
                        <Link href="/seller/dashboard">
                            <span>Jadi Mitra</span>
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    )
}