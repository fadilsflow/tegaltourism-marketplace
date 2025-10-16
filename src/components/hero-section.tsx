import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "./ui/badge";

export default function HeroSection() {
  return (
    <>
      <main className="overflow-hidden pb-28">
        <section>
          <div className="relative pt-5 ">
            <div className="container mx-auto px-6 md:px-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                {/* Left side - Text content */}
                <div className="flex flex-col">

                  <Badge variant={"secondary"} className="mb-8"> Rempah Nusantara 🇮🇩</Badge>
                  <p className="mt-0 max-w-2xl text-balance text-5xl font-medium md:text-6xl ">
                    Marketplace Jejak{" "}
                    <span className="text-primary">Rempah Nusantara</span>
                  </p>
                  <p className="mt-8 max-w-2xl text-pretty text-lg">
                    Menyusuri Warisan Budaya dan Petualangan Aromatik di Jalan
                    Rempah-Rempah
                  </p>
                  <div className="mt-12 flex flex-col items-start justify-start gap-2 md:flex-row">
                    <Button size={"lg"} asChild className="rounded-full">
                      <Link href="/products" className="flex items-center gap-2">
                        Eksplore Jalur Rempah
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Right side - Hero image */}
                <div className="relative lg:order-last order-first">
                  <div className="relative aspect-[4/3] w-full max-w-lg mx-auto lg:max-w-none">
                    <Image
                      src="https://res.cloudinary.com/dxurnpbrc/image/upload/v1757251427/jejak-rempah_pamwal.png"
                      alt="Jejak Rempah Nusantara - Traditional Spice Heritage"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
