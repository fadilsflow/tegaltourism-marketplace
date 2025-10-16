import { NextRequest } from "next/server";
import { db } from "@/db";
import { store } from "@/db/schema";
import { eq } from "drizzle-orm";
import { 
  withAuth, 
  withoutAuth, 
  createErrorResponse, 
  createSuccessResponse,
  validateRequestBody
} from "@/lib/api-utils";
import { updateStoreSchema } from "@/lib/validations";

/**
 * GET /api/stores/[id] - Get a specific store
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withoutAuth(request, async () => {
    const { id } = await params;

    try {
      const storeData = await db
        .select({
          id: store.id,
          ownerId: store.ownerId,
          name: store.name,
          slug: store.slug,
          areaId: store.areaId,
          description: store.description,
          logo: store.logo,
          createdAt: store.createdAt,
          updatedAt: store.updatedAt,
        })
        .from(store)
        .where(eq(store.id, id))
        .limit(1);

      if (storeData.length === 0) {
        return createErrorResponse("Store not found", 404);
      }

      return createSuccessResponse(storeData[0]);
    } catch (error) {
      console.error("Error fetching store:", error);
      return createErrorResponse("Failed to fetch store", 500);
    }
  });
}

/**
 * PUT /api/stores/[id] - Update a store
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, user) => {
    const { id } = await params;

    const validationResult = await validateRequestBody(req, updateStoreSchema);
    if (validationResult.error) {
      return createErrorResponse(validationResult.error);
    }

    const updateData = validationResult.data!;

    try {
      // Check if store exists and user is the owner
      const existingStore = await db
        .select({ id: store.id, ownerId: store.ownerId })
        .from(store)
        .where(eq(store.id, id))
        .limit(1);

      if (existingStore.length === 0) {
        return createErrorResponse("Store not found", 404);
      }

      if (existingStore[0].ownerId !== user.id) {
        return createErrorResponse("Unauthorized to update this store", 403);
      }

      // Check if slug already exists (if updating slug)
      if (updateData.slug) {
        const slugExists = await db
          .select({ id: store.id })
          .from(store)
          .where(eq(store.slug, updateData.slug))
          .limit(1);

        if (slugExists.length > 0 && slugExists[0].id !== id) {
          return createErrorResponse("Store slug already exists");
        }
      }

      // Update store
      const updatedStore = await db
        .update(store)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(store.id, id))
        .returning();

      return createSuccessResponse(updatedStore[0]);
    } catch (error) {
      console.error("Error updating store:", error);
      return createErrorResponse("Failed to update store", 500);
    }
  });
}

/**
 * DELETE /api/stores/[id] - Delete a store
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, user) => {
    const { id } = await params;

    try {
      // Check if store exists and user is the owner
      const existingStore = await db
        .select({ id: store.id, ownerId: store.ownerId })
        .from(store)
        .where(eq(store.id, id))
        .limit(1);

      if (existingStore.length === 0) {
        return createErrorResponse("Store not found", 404);
      }

      if (existingStore[0].ownerId !== user.id) {
        return createErrorResponse("Unauthorized to delete this store", 403);
      }

      // Delete store (cascade will handle related products)
      await db
        .delete(store)
        .where(eq(store.id, id));

      return createSuccessResponse({ message: "Store deleted successfully" });
    } catch (error) {
      console.error("Error deleting store:", error);
      return createErrorResponse("Failed to delete store", 500);
    }
  });
}