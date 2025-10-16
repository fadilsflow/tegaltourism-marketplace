import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/hero-header";
import Footer from "@/components/layout/footer";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/layout/query-provider";
import { CartProvider } from "@/components/layout/cart-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Marketplace Jejak Rempah Nusantara",
  description:
    "Menyusuri Warisan Budaya dan Petualangan Aromatik di Jalan Rempah-Rempah",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <CartProvider>
            <Header />
            <main className="min-h-screen">
              {children}
            </main>
            <Toaster position="top-center" />
            <Footer />
          </CartProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
