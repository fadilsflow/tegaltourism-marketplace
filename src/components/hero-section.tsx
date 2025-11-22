import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "./ui/badge";
import LogoCloud from "./logo-cloud";
import { getActiveAds } from "@/actions/ads";
import { AdCarousel } from "./ad-carousel";
import Image from "next/image";

export default async function HeroSection() {
  const ads = await getActiveAds();

  return (
    <>
      <main className="overflow-hidden pb-28">
        <section className="flex flex-col gap-8">

          <div className="relative pt-5 ">
            <div className="container mx-auto   px-6 md:px-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                {/* Left side - Text content */}
                <div className="flex flex-col">

                  <Badge variant={"secondary"} className="mb-8"> Oleh-Oleh dari wisata Tegal</Badge>
                  <p className="mt-0 max-w-2xl text-balance text-5xl font-medium md:text-6xl ">
                    Marketplace{" "}
                    <span className="text-primary">Tegal Tourism</span>
                  </p>
                  <p className="mt-8 max-w-2xl text-pretty text-lg">
                    Jelajahi Destinasi Wisata Tegal 360° dan Temukan Produk Khas
                    dari Berbagai Lokasi Wisata Terbaik
                  </p>
                  <div className="mt-12 flex flex-col items-start justify-start gap-2 md:flex-row">
                    <Button size={"lg"} asChild className="rounded-full">
                      <Link href="/products" className="flex items-center gap-2">
                        Eksplore Destinasi Wisata
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Right side - Hero image / Ads */}
                <div className="relative lg:order-last order-first">
                  <div className="relative aspect-[4/3] w-full max-w-lg mx-auto lg:max-w-none">
                    <Image
                      src="/logo.png"
                      alt="Tegal Tourism - 360° Virtual Tourism Experience"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>

                </div>
              </div>
            </div>
          </div>
          <LogoCloud />
          <div className="relative mx-auto container w-full  px-6 md:px-12 group">
            <AdCarousel ads={ads} />
          </div>

        </section>
      </main>
    </>
  );
}
