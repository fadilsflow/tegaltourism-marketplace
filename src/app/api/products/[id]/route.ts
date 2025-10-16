import { NextRequest } from "next/server";
import { db } from "@/db";
import { product, store } from "@/db/schema";
import { eq } from "drizzle-orm";
import { 
  withAuth, 
  withoutAuth, 
  createErrorResponse, 
  createSuccessResponse,
  validateRequestBody
} from "@/lib/api-utils";
import { updateProductSchema } from "@/lib/validations";

/**
 * GET /api/products/[id] - Get a specific product
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withoutAuth(request, async () => {
    const { id } = await params;

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
        .where(eq(product.id, id))
        .limit(1);

      if (productData.length === 0) {
        return createErrorResponse("Product not found", 404);
      }

      return createSuccessResponse(productData[0]);
    } catch (error) {
      console.error("Error fetching product:", error);
      return createErrorResponse("Failed to fetch product", 500);
    }
  });
}

/**
 * PUT /api/products/[id] - Update a product
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, user) => {
    const { id } = await params;

    const validationResult = await validateRequestBody(req, updateProductSchema);
    if (validationResult.error) {
      return createErrorResponse(validationResult.error);
    }

    const updateData = validationResult.data!;

    try {
      // Check if product exists and user owns the store
      const existingProduct = await db
        .select({
          id: product.id,
          storeId: product.storeId,
          slug: product.slug,
          store: {
            ownerId: store.ownerId,
          },
        })
        .from(product)
        .leftJoin(store, eq(product.storeId, store.id))
        .where(eq(product.id, id))
        .limit(1);

      if (existingProduct.length === 0) {
        return createErrorResponse("Product not found", 404);
      }

      if (existingProduct[0].store?.ownerId !== user.id) {
        return createErrorResponse("Unauthorized to update this product", 403);
      }

      // Check if slug already exists (if updating slug)
      if (updateData.slug && updateData.slug !== existingProduct[0].slug) {
        const slugExists = await db
          .select({ id: product.id })
          .from(product)
          .where(eq(product.slug, updateData.slug))
          .limit(1);

        if (slugExists.length > 0) {
          return createErrorResponse("Product slug already exists");
        }
      }

      // Update product
      const updatedProduct = await db
        .update(product)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(product.id, id))
        .returning();

      return createSuccessResponse(updatedProduct[0]);
    } catch (error) {
      console.error("Error updating product:", error);
      return createErrorResponse("Failed to update product", 500);
    }
  });
}

/**
 * DELETE /api/products/[id] - Delete a product
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, user) => {
    const { id } = await params;

    try {
      // Check if product exists and user owns the store
      const existingProduct = await db
        .select({
          id: product.id,
          store: {
            ownerId: store.ownerId,
          },
        })
        .from(product)
        .leftJoin(store, eq(product.storeId, store.id))
        .where(eq(product.id, id))
        .limit(1);

      if (existingProduct.length === 0) {
        return createErrorResponse("Product not found", 404);
      }

      if (existingProduct[0].store?.ownerId !== user.id) {
        return createErrorResponse("Unauthorized to delete this product", 403);
      }

      // Delete product
      await db
        .delete(product)
        .where(eq(product.id, id));

      return createSuccessResponse({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      return createErrorResponse("Failed to delete product", 500);
    }
  });
}