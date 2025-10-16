"use client";

import React from "react";

import Link from "next/link";
import HeroSection from "@/components/hero-section";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import ProductList from "@/components/product-list";
import StoreList from "@/components/store-list";
import AboutSecton from "@/components/about-section";
import CtaSection from "@/components/cta-section";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <>
      <div className="flex flex-col  gap-8 py-10 ">

        <section className="flex flex-col ">
          <HeroSection />
        </section>



        <section id="products" className="  flex flex-col container mx-auto px-6 md:px-12">
          <Badge variant={"secondary"} className="mb-8">Produk</Badge>
          <div className="flex items-center justify-between mb-4">
            <div >
              <h2 className="relative z-10 max-w-xl text-xl font-medium lg:text-2xl">Produk Terbaru</h2>
              {/* <p className="text-md text-muted-foreground font-light">
                Temukan produk terbaru
              </p> */}
            </div>
            <Link href="/products">
              <Button variant="outline" className="hidden sm:flex">
                Lihat Semua
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <ProductList sortBy="latest" limit={8} />

          <div className="mt-6 text-center sm:hidden">
            <Link href="/products">
              <Button variant="outline">
                Lihat Semua Produk
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        <section className="  flex flex-col  container mx-auto px-6 md:px-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="relative z-10 max-w-xl text-xl font-medium lg:text-2xl">Produk Terpopuler</h2>
              {/* <p className="text-md text-muted-foreground font-light">
                Temukan produk terpopuler dari berbagai kategori
              </p> */}
            </div>
            <Link href="/products?sortBy=name&sortOrder=asc">
              <Button variant="outline" className="hidden sm:flex">
                Lihat Semua
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <ProductList sortBy="popular" limit={8} />

          <div className="mt-6 text-center sm:hidden">
            <Link href="/products?sortBy=name&sortOrder=asc">
              <Button variant="outline">
                Lihat Semua Produk Populer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>


        <section id="stores" className=" py-8 md:py-16 flex flex-col container mx-auto px-6 md:px-12">
          <Badge variant={"secondary"} className="mb-8">Toko</Badge>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="relative z-10 max-w-xl text-xl font-medium lg:text-2xl">Toko Terbaru</h2>
              <p className="text-md text-muted-foreground font-light">
                Temukan toko terbaru di platform kami
              </p>
            </div>
            <Link href="/stores">
              <Button variant="outline" className="hidden sm:flex">
                Lihat Semua
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <StoreList limit={8} />

          <div className="mt-6 text-center sm:hidden">
            <Link href="/stores">
              <Button variant="outline">
                Lihat Semua Toko
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>


        <section id="about" className="flex flex-col container mx-auto px-6 md:px-12 border-t border-dotted">
          <AboutSecton />
        </section>
        <section className="flex flex-col container mx-auto px-6 md:px-12">
          <CtaSection />
        </section>
      </div>
    </>
  );
}
