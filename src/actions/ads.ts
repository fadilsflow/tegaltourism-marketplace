"use server";

import { db } from "@/db";
import { ads, adClaims, walletTransactions } from "@/db/schema";
import { auth } from "@/lib/auth";
import { createAdSchema, updateAdSchema } from "@/lib/validations";
import { eq, and, desc, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";

export async function getActiveAds() {
    const now = new Date();
    return await db.query.ads.findMany({
        where: and(
            eq(ads.status, "published"),
            sql`${ads.startDate} <= ${now}`,
            sql`${ads.endDate} >= ${now}`
        ),
        orderBy: [desc(ads.sortOrder), desc(ads.createdAt)],
    });
}

export async function claimAdReward(adId: string) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return { error: "Unauthorized" };
    }

    const userId = session.user.id;

    // Check if ad exists and is active
    const ad = await db.query.ads.findFirst({
        where: eq(ads.id, adId),
    });

    if (!ad) return { error: "Ad not found" };
    if (ad.status !== "published") return { error: "Ad is not active" };

    const now = new Date();
    if (now < ad.startDate || now > ad.endDate) {
        return { error: "Ad is expired or not started yet" };
    }

    // Check quota
    if (ad.quota !== null) {
        const claimsCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(adClaims)
            .where(eq(adClaims.adId, adId))
            .then((res) => res[0].count);

        if (claimsCount >= ad.quota) {
            return { error: "Ad quota reached" };
        }
    }

    // Check if already claimed
    const existingClaim = await db.query.adClaims.findFirst({
        where: and(eq(adClaims.adId, adId), eq(adClaims.userId, userId)),
    });

    if (existingClaim) {
        return { error: "Already claimed" };
    }

    // Transaction
    try {
        await db.transaction(async (tx) => {
            await tx.insert(adClaims).values({
                id: createId(),
                adId,
                userId,
            });

            if (ad.rewardCoin > 0) {
                await tx.insert(walletTransactions).values({
                    id: createId(),
                    userId,
                    amount: ad.rewardCoin,
                    type: "reward_ad",
                    adId,
                });
            }
        });
        return { success: true, reward: ad.rewardCoin };
    } catch (error) {
        console.error("Claim error:", error);
        return { error: "Failed to claim reward" };
    }
}

// Admin Actions

async function checkAdmin() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    // Assuming 'admin' or 'tourism-manager' can manage ads
    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "tourism-manager")) {
        throw new Error("Unauthorized");
    }
    return session.user;
}

export async function createAd(data: z.infer<typeof createAdSchema>) {
    await checkAdmin();
    const validated = createAdSchema.parse(data);

    await db.insert(ads).values({
        id: createId(),
        ...validated,
    });
    return { success: true };
}

export async function updateAd(id: string, data: z.infer<typeof updateAdSchema>) {
    await checkAdmin();
    const validated = updateAdSchema.parse(data);

    await db.update(ads).set(validated).where(eq(ads.id, id));
    return { success: true };
}

export async function deleteAd(id: string) {
    await checkAdmin();
    await db.delete(ads).where(eq(ads.id, id));
    return { success: true };
}

export async function getAdsAdmin() {
    await checkAdmin();
    return await db.query.ads.findMany({
        orderBy: [desc(ads.createdAt)],
    });
}

export async function getAdById(id: string) {
    await checkAdmin();
    return await db.query.ads.findFirst({
        where: eq(ads.id, id),
    });
}

export async function trackAdClick(adId: string) {
    await db.update(ads).set({ clicks: sql`${ads.clicks} + 1` }).where(eq(ads.id, adId));
}

export async function trackAdImpression(adId: string) {
    await db.update(ads).set({ impressions: sql`${ads.impressions} + 1` }).where(eq(ads.id, adId));
}

export async function getUserCoinBalance() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return 0;
    }

    const result = await db
        .select({ total: sql<number>`sum(${walletTransactions.amount})` })
        .from(walletTransactions)
        .where(eq(walletTransactions.userId, session.user.id));

    return result[0]?.total || 0;
}

