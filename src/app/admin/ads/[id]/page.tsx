"use client";

import { getAdById } from "@/actions/ads";
import { AdForm } from "@/components/admin/ad-form";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

export default function EditAdPage() {
    const params = useParams();
    const adId = params.id as string;

    const { data: ad, isLoading } = useQuery({
        queryKey: ["admin-ad", adId],
        queryFn: () => getAdById(adId),
    });

    if (isLoading) return <div>Loading...</div>;
    if (!ad) return <div>Ad not found</div>;

    return (
        <div className="container mx-auto py-10 px-6 md:px-12">
            <h1 className="text-2xl font-bold mb-6">Edit Ad</h1>
            <AdForm
                initialData={
                    ad
                        ? {
                            ...ad,
                            status: (ad.status === "published" ? "published" : "draft") as "published" | "draft",
                            quota: ad.quota ?? undefined,
                            sortOrder: ad.sortOrder ?? 0,
                            description: ad.description ?? undefined,
                        }
                        : undefined
                }
                adId={adId}
            />
        </div>
    );
}
