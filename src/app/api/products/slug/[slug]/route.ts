import { NextRequest } from "next/server";
import { db } from "@/db";
import { product, store } from "@/db/schema";
import { eq } from "drizzle-orm";
import { 
  withoutAuth, 
  createErrorResponse, 
  createSuccessResponse
} from "@/lib/api-utils";

/**
 * GET /api/products/slug/[slug] - Get a specific product by slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return withoutAuth(request, async () => {
    const { slug } = await params;

    try {
      const productData = await db
        .select({
          id: product.id,
          storeId: product.storeId,
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price,
          stock: product.stock,
          image: product.image,
          status: product.status,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          store: {
            id: store.id,
            name: store.name,
            slug: store.slug,
            logo: store.logo,
          },
        })
        .from(product)
        .leftJoin(store, eq(product.storeId, store.id))
        .where(eq(product.slug, slug))
        .limit(1);

      if (productData.length === 0) {
        return createErrorResponse("Product not found", 404);
      }

      // Only return active products for public viewing
      if (productData[0].status !== "active") {
        return createErrorResponse("Product not available", 404);
      }

      return createSuccessResponse(productData[0]);
    } catch (error) {
      console.error("Error fetching product by slug:", error);
      return createErrorResponse("Failed to fetch product", 500);
    }
  });
}