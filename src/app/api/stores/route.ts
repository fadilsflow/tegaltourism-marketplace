import { NextRequest } from "next/server";
import { db } from "@/db";
import { store } from "@/db/schema";
import { eq, ilike, desc } from "drizzle-orm";
import {
  withAuth,
  withoutAuth,
  createErrorResponse,
  createSuccessResponse,
  validateRequestBody,
  validateQueryParams,
  generateId,
  calculateOffset,
  createPaginationMeta,
} from "@/lib/api-utils";
import {
  createStoreSchema,
  paginationSchema,
  searchSchema,
} from "@/lib/validations";

/**
 * GET /api/stores - Get all stores with pagination and search
 */
export async function GET(request: NextRequest) {
  return withoutAuth(request, async (req) => {
    const { searchParams } = new URL(req.url);

    // Validate pagination params
    const paginationResult = validateQueryParams(
      searchParams,
      paginationSchema
    );
    if (paginationResult.error) {
      return createErrorResponse(paginationResult.error);
    }
    const { page, limit } = paginationResult.data!;

    // Validate search params
    const searchResult = validateQueryParams(
      searchParams,
      searchSchema.pick({ q: true, sortBy: true, sortOrder: true })
    );
    if (searchResult.error) {
      return createErrorResponse(searchResult.error);
    }
    const { q, sortBy, sortOrder } = searchResult.data!;

    try {
      // Build query conditions
      const conditions = [];
      if (q) {
        conditions.push(ilike(store.name, `%${q}%`));
      }

      // Build order by
      let orderBy;
      if (sortBy === "name") {
        orderBy = sortOrder === "asc" ? store.name : desc(store.name);
      } else if (sortBy === "createdAt") {
        orderBy = sortOrder === "asc" ? store.createdAt : desc(store.createdAt);
      } else {
        orderBy = desc(store.createdAt); // default
      }

      // Get total count
      const totalResult = await db
        .select({ count: store.id })
        .from(store)
        .where(conditions.length > 0 ? conditions[0] : undefined);
      const total = totalResult.length;

      // Get stores with pagination
      const stores = await db
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
        .where(conditions.length > 0 ? conditions[0] : undefined)
        .orderBy(orderBy)
        .limit(limit)
        .offset(calculateOffset(page, limit));

      const pagination = createPaginationMeta(total, page, limit);

      return createSuccessResponse({
        stores,
        pagination,
      });
    } catch (error) {
      console.error("Error fetching stores:", error);
      return createErrorResponse("Failed to fetch stores", 500);
    }
  });
}

/**
 * POST /api/stores - Create a new store
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    const validationResult = await validateRequestBody(req, createStoreSchema);
    if (validationResult.error) {
      return createErrorResponse(validationResult.error);
    }

    const { name, slug, areaId, description, logo } = validationResult.data!;

    try {
      // Check if user already has a store (one store per user limit)
      const userStore = await db
        .select({ id: store.id })
        .from(store)
        .where(eq(store.ownerId, user.id))
        .limit(1);

      if (userStore.length > 0) {
        return createErrorResponse("You can only have one store per account");
      }

      // Check if slug already exists
      const existingStore = await db
        .select({ id: store.id })
        .from(store)
        .where(eq(store.slug, slug))
        .limit(1);

      if (existingStore.length > 0) {
        return createErrorResponse("Store slug already exists");
      }

      // Create new store
      const newStore = await db
        .insert(store)
        .values({
          id: generateId(),
          ownerId: user.id,
          name,
          slug,
          areaId,
          description,
          logo,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return createSuccessResponse(newStore[0], 201);
    } catch (error) {
      console.error("Error creating store:", error);
      return createErrorResponse("Failed to create store", 500);
    }
  });
}
