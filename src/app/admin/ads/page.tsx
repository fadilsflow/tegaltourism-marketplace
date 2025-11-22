"use client";

import { getAdsAdmin, deleteAd } from "@/actions/ads";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { toast } from "sonner";

export default function AdsPage() {
    const queryClient = useQueryClient();

    const { data: ads, isLoading } = useQuery({
        queryKey: ["admin-ads"],
        queryFn: () => getAdsAdmin(),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteAd,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-ads"] });
            toast.success("Ad deleted successfully");
        },
        onError: () => {
            toast.error("Failed to delete ad");
        },
    });

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="container mx-auto py-10 px-6 md:px-12">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Manage Ads</h1>
                <Link href="/admin/ads/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Create Ad
                    </Button>
                </Link>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Image</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Reward</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Period</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {ads?.map((ad) => (
                            <TableRow key={ad.id}>
                                <TableCell>
                                    <div className="relative h-12 w-20">
                                        <Image
                                            src={ad.imageUrl}
                                            alt={ad.title}
                                            fill
                                            className="object-cover rounded-md"
                                        />
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">{ad.title}</TableCell>
                                <TableCell>{ad.rewardCoin} Coins</TableCell>
                                <TableCell>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs ${ad.status === "published"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-gray-100 text-gray-800"
                                            }`}
                                    >
                                        {ad.status}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm">
                                        <div>{format(new Date(ad.startDate), "MMM d, yyyy")}</div>
                                        <div className="text-muted-foreground">to</div>
                                        <div>{format(new Date(ad.endDate), "MMM d, yyyy")}</div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Link href={`/admin/ads/${ad.id}`}>
                                            <Button variant="ghost" size="icon">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => {
                                                if (confirm("Are you sure you want to delete this ad?")) {
                                                    deleteMutation.mutate(ad.id);
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {ads?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10">
                                    No ads found. Create one to get started.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
