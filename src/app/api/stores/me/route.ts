import { NextRequest } from "next/server";
import { db } from "@/db";
import { store } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  withAuth,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api-utils";

/**
 * GET /api/stores/me - Get current user's store
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const userStore = await db
        .select({
          id: store.id,
          name: store.name,
          slug: store.slug,
          areaId: store.areaId,
          description: store.description,
          logo: store.logo,
          createdAt: store.createdAt,
          updatedAt: store.updatedAt,
        })
        .from(store)
        .where(eq(store.ownerId, user.id))
        .limit(1);

      return createSuccessResponse({
        store: userStore.length > 0 ? userStore[0] : null,
        hasStore: userStore.length > 0,
      });
    } catch (error) {
      console.error("Error fetching user store:", error);
      return createErrorResponse("Failed to fetch user store", 500);
    }
  });
}
