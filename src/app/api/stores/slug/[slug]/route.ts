import { NextRequest } from "next/server";
import { db } from "@/db";
import { store, product } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  withoutAuth,
  createErrorResponse,
  createSuccessResponse,
  calculateOffset,
  createPaginationMeta,
} from "@/lib/api-utils";

/**
 * GET /api/stores/slug/[slug] - Get a specific store by slug with its products
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return withoutAuth(request, async () => {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);

    // Get pagination params for products
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    try {
      // Get store data
      const storeData = await db
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
        .where(eq(store.slug, slug))
        .limit(1);

      if (storeData.length === 0) {
        return createErrorResponse("Store not found", 404);
      }

      const storeInfo = storeData[0];

      // Get total product count for this store
      const totalResult = await db
        .select({ count: product.id })
        .from(product)
        .where(eq(product.storeId, storeInfo.id));
      const total = totalResult.length;

      // Get store products with pagination
      const products = await db
        .select({
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price,
          stock: product.stock,
          image: product.image,
          status: product.status,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        })
        .from(product)
        .where(eq(product.storeId, storeInfo.id))
        .orderBy(desc(product.createdAt))
        .limit(limit)
        .offset(calculateOffset(page, limit));

      const pagination = createPaginationMeta(total, page, limit);

      return createSuccessResponse({
        store: storeInfo,
        products,
        pagination,
      });
    } catch (error) {
      console.error("Error fetching store by slug:", error);
      return createErrorResponse("Failed to fetch store", 500);
    }
  });
}
