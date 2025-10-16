import { Store, Landmark } from "lucide-react"
import Image from "next/image"
import { Badge } from "./ui/badge"

export default function ContentSection() {
    return (
        <section className="py-16 md:py-32  ">
            <div className=" md:space-y-16">
                <Badge variant={"secondary"} className="mb-8">Tentang</Badge>

                <h2 className="relative z-10 max-w-xl text-4xl font-medium lg:text-5xl">
                    Jejak Rempah Marketplace
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 md:gap-12 lg:gap-24">
                    <div className="relative space-y-4">
                        <p className="text-muted-foreground">
                            JRM (Jejak Rempah Marketplace) merupakan platform jual beli yang
                            dapat digunakan UMKM di sekitar titik simpul jalur rempah untuk
                            memasarkan produknya.
                        </p>
                        <p className="text-muted-foreground">
                            Jejak rempah sendiri tidak hanya melahirkan warisan-warisan
                            berkaitan komoditas saja, tapi juga berkaitan dengan akulturasi
                            budaya yang menciptakan kekhasan kerajinan tangan, kuliner, dan
                            produk lainnya.
                        </p>
                        <p className="text-muted-foreground">
                            Oleh karena itu, JRM memfasilitasi UMKM dan masyarakat umum dalam
                            melakukan jual beli produk-produk barang yang berkaitan erat
                            dengan titik-titik simpul jalur rempah.
                        </p>

                        <div className="grid grid-cols-2 gap-3 pt-6 sm:gap-4">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Store className="size-4" />
                                    <h3 className="text-sm font-medium">Dukung UMKM</h3>
                                </div>
                                <p className="text-muted-foreground text-sm">
                                    Memberikan ruang digital bagi pelaku usaha lokal untuk
                                    memasarkan produknya.
                                </p>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Landmark className="size-4" />
                                    <h3 className="text-sm font-medium">Warisan Budaya</h3>
                                </div>
                                <p className="text-muted-foreground text-sm">
                                    Mengangkat nilai sejarah jalur rempah lewat kerajinan, kuliner
                                    dan produk khas.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="relative mt-6 sm:mt-0">
                        <div className="bg-linear-to-b aspect-67/34 relative rounded-2xl from-zinc-300 to-transparent p-px dark:from-zinc-700">

                            <Image
                                src="/about.jpg"
                                className="rounded-[15px] shadow dark:hidden"
                                alt="illustration light"
                                width={800}
                                height={450}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
