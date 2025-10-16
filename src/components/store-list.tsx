"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Store } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { Button } from "./ui/button";

type StoreType = {
    id: string;
    name: string;
    slug: string;
    description?: string;
    logo?: string;
    createdAt: string;
};

export default function StoreList({ limit = 8 }: { limit?: number }) {
    // Fetch stores
    const {
        data: storesData,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["stores", "homepage", limit],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: "1",
                limit: limit.toString(),
                sortBy: "createdAt",
                sortOrder: "desc",
            });
            const response = await fetch(`/api/stores?${params}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to fetch stores");
            }
            return response.json();
        },
    });

    const stores = storesData?.stores || [];

    // Loading skeleton component
    const LoadingSkeleton = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(limit)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                    <CardHeader className="pb-3">
                        <div className="flex items-center space-x-3">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="flex-1">
                                <Skeleton className="h-5 w-32 mb-1" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-3/4 mb-4" />
                        <Skeleton className="h-9 w-full" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    if (isLoading) {
        return <LoadingSkeleton />;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-8">
                <Store className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Gagal memuat toko</h3>
                <p className="text-muted-foreground text-center">
                    {error instanceof Error
                        ? error.message
                        : "Terjadi kesalahan saat memuat toko"}
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {stores.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-8">
                    <Store className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Belum ada toko</h3>
                    <p className="text-muted-foreground text-center">
                        Belum ada toko yang terdaftar di platform ini
                    </p>
                </div>
            ) : (
                stores.map((store: StoreType) => (
                    <Link key={store.id} href={`/stores/${store.slug}`}>
                        <div className="border p-6 rounded-xl  overflow-hidden hover:border-primary transition-shadow cursor-pointer h-full">
                            <div className="pb-3 ">
                                <div className="relative flex items-center space-x-3">
                                    {store.logo ? (
                                        <div className="relative h-12 w-12 overflow-hidden rounded-xl">
                                            <Image
                                                fill
                                                src={store.logo}
                                                alt={store.name}
                                                className="object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Store className="h-6 w-6 text-primary" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-md truncate ">
                                            {store.name}
                                        </h3>
                                        <p className="text-xs text-muted-foreground truncate">
                                            @{store.slug}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                {store.description && (
                                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                        {store.description}
                                    </p>
                                )}

                                <div className="justify-end flex">
                                    <Button variant={"outline"} size={"sm"}>
                                        Kunjungi Toko
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))
            )
            }
        </div >
    );
}