"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { claimAdReward, trackAdClick, trackAdImpression } from "@/actions/ads";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface Ad {
    id: string;
    imageUrl: string;
    title: string;
    targetUrl: string;
    rewardCoin: number;
}

export function AdCarousel({ ads }: { ads: Ad[] }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const queryClient = useQueryClient();

    const currentAd = ads && ads.length > 0 ? ads[currentIndex] : null;

    // Auto-rotate
    useEffect(() => {
        if (!ads || ads.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % ads.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [ads]);

    // Track impression
    useEffect(() => {
        if (currentAd) {
            trackAdImpression(currentAd.id).catch(console.error);
        }
    }, [currentAd]);

    if (!ads || ads.length === 0 || !currentAd) {
        return null;
    }

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % ads.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
    };

    const handleAdClick = async () => {
        // Track click
        trackAdClick(currentAd.id).catch(console.error);

        // Open target URL
        window.open(currentAd.targetUrl, "_blank");

        // Claim reward
        try {
            const result = await claimAdReward(currentAd.id);
            if (result.success) {
                toast.success(`You earned ${result.reward} coins!`);
                queryClient.invalidateQueries({ queryKey: ["user-coin-balance"] });
            } else if (result.error) {
                // Only show error if it's relevant to the user interaction
                if (result.error === "Already claimed") {
                    toast.info("You have already claimed this reward.");
                } else if (result.error === "Unauthorized") {
                    toast.error("Please login to claim rewards.");
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="relative w-full aspect-[21/4] group">
            <div
                className="relative w-full h-full overflow-hidden cursor-pointer"
                onClick={handleAdClick}
            >
                <Image
                    src={currentAd.imageUrl}
                    alt={currentAd.title}
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 text-white">
                    <h3 className="font-bold text-xl mb-1">{currentAd.title}</h3>
                    {currentAd.rewardCoin > 0 && (
                        <span className="inline-flex items-center bg-yellow-500 text-black text-xs px-3 py-1 rounded-full font-bold shadow-sm">
                            +{currentAd.rewardCoin} Coins Reward
                        </span>
                    )}
                </div>
            </div>

            {ads.length > 1 && (
                <>
                    <Button
                        variant="outline"
                        size="icon"
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-md"
                        onClick={(e) => {
                            e.stopPropagation();
                            handlePrev();
                        }}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-md"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleNext();
                        }}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>

                    <div className="absolute bottom-4 right-4 flex gap-1">
                        {ads.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-6 bg-white' : 'w-2 bg-white/50'}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
