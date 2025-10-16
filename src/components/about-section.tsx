import { MapPin, Camera } from "lucide-react"
import Image from "next/image"
import { Badge } from "./ui/badge"

export default function ContentSection() {
    return (
        <section className="py-16 md:py-32  ">
            <div className=" md:space-y-16">
                <Badge variant={"secondary"} className="mb-8">Tentang</Badge>

                <h2 className="relative z-10 max-w-xl text-4xl font-medium lg:text-5xl">
                    Tegal Tourism Marketplace
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 md:gap-12 lg:gap-24">
                    <div className="relative space-y-4">
                        <p className="text-muted-foreground">
                            TTM (Tegal Tourism Marketplace) merupakan platform wisata 360° yang
                            memungkinkan pengguna untuk menjelajahi destinasi wisata di wilayah
                            Tegal secara virtual dan menemukan produk khas dari setiap lokasi.
                        </p>
                        <p className="text-muted-foreground">
                            Tegal memiliki kekayaan wisata yang beragam, mulai dari wisata sejarah,
                            alam, budaya, hingga kuliner khas yang mencerminkan keunikan daerah
                            dan warisan budaya yang kental.
                        </p>
                        <p className="text-muted-foreground">
                            Platform ini memfasilitasi pengalaman wisata 360° yang imersif,
                            memungkinkan pengunjung untuk merasakan keindahan destinasi Tegal
                            dari mana saja, sambil mendukung UMKM lokal melalui marketplace terintegrasi.
                        </p>

                        <div className="grid grid-cols-2 gap-3 pt-6 sm:gap-4">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <MapPin className="size-4" />
                                    <h3 className="text-sm font-medium">Wisata 360°</h3>
                                </div>
                                <p className="text-muted-foreground text-sm">
                                    Pengalaman virtual imersif untuk menjelajahi destinasi wisata
                                    Tegal dari mana saja.
                                </p>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Camera className="size-4" />
                                    <h3 className="text-sm font-medium">Produk Khas</h3>
                                </div>
                                <p className="text-muted-foreground text-sm">
                                    Temukan dan beli produk khas dari setiap destinasi wisata
                                    yang dikunjungi secara virtual.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="relative mt-6 sm:mt-0">
                        <div className="bg-linear-to-b aspect-67/34 relative rounded-2xl from-zinc-300 to-transparent p-px dark:from-zinc-700">

                            <Image
                                src="/about.png"
                                className="rounded-[15px] shadow dark:hidden"
                                alt="Tegal Tourism Destinations"
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
