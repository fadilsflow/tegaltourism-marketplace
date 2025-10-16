import { NextRequest } from "next/server";
import { db } from "@/db";
import { product, store } from "@/db/schema";
import { eq, ilike, desc, and, gte, lte } from "drizzle-orm";
import {
  withAuth,
  withoutAuth,
  createErrorResponse,
  createSuccessResponse,
  validateRequestBody,
  generateId,
  calculateOffset,
  createPaginationMeta,
} from "@/lib/api-utils";
import { createProductSchema } from "@/lib/validations";

/**
 * GET /api/products - Get all products with pagination and search
 */
export async function GET(request: NextRequest) {
  return withoutAuth(request, async (req) => {
    const { searchParams } = new URL(req.url);

    // Get pagination params with defaults
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Get search params with defaults
    const q = searchParams.get("q") || undefined;
    const minPrice = searchParams.get("minPrice")
      ? parseFloat(searchParams.get("minPrice")!)
      : undefined;
    const maxPrice = searchParams.get("maxPrice")
      ? parseFloat(searchParams.get("maxPrice")!)
      : undefined;
    const sortBy =
      (searchParams.get("sortBy") as "name" | "price" | "createdAt") ||
      "createdAt";
    const sortOrder =
      (searchParams.get("sortOrder") as "asc" | "desc") || "desc";

    try {
      // Build query conditions
      const conditions = [eq(product.status, "active")];

      if (q) {
        conditions.push(ilike(product.name, `%${q}%`));
      }

      if (minPrice !== undefined) {
        conditions.push(gte(product.price, minPrice.toString()));
      }

      if (maxPrice !== undefined) {
        conditions.push(lte(product.price, maxPrice.toString()));
      }

      // Build order by
      let orderBy;
      if (sortBy === "name") {
        orderBy = sortOrder === "asc" ? product.name : desc(product.name);
      } else if (sortBy === "price") {
        orderBy = sortOrder === "asc" ? product.price : desc(product.price);
      } else {
        orderBy =
          sortOrder === "asc" ? product.createdAt : desc(product.createdAt);
      }

      // Get total count
      const totalResult = await db
        .select({ count: product.id })
        .from(product)
        .where(and(...conditions));
      const total = totalResult.length;

      // Get products with pagination
      const products = await db
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
          },
        })
        .from(product)
        .leftJoin(store, eq(product.storeId, store.id))
        .where(and(...conditions))
        .orderBy(orderBy)
        .limit(limit)
        .offset(calculateOffset(page, limit));

      const pagination = createPaginationMeta(total, page, limit);

      return createSuccessResponse({
        products,
        pagination,
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      return createErrorResponse("Failed to fetch products", 500);
    }
  });
}

/**
 * POST /api/products - Create a new product
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    const validationResult = await validateRequestBody(
      req,
      createProductSchema
    );
    if (validationResult.error) {
      return createErrorResponse(validationResult.error);
    }

    const { storeId, name, slug, description, price, stock, image, status } =
      validationResult.data!;

    try {
      // Check if user owns the store
      const storeData = await db
        .select({ id: store.id, ownerId: store.ownerId })
        .from(store)
        .where(eq(store.id, storeId))
        .limit(1);

      if (storeData.length === 0) {
        return createErrorResponse("Store not found", 404);
      }

      if (storeData[0].ownerId !== user.id) {
        return createErrorResponse(
          "Unauthorized to create products in this store",
          403
        );
      }

      // Check if slug already exists
      const existingProduct = await db
        .select({ id: product.id })
        .from(product)
        .where(eq(product.slug, slug))
        .limit(1);

      if (existingProduct.length > 0) {
        return createErrorResponse("Product slug already exists");
      }

      // Create new product
      const newProduct = await db
        .insert(product)
        .values({
          id: generateId(),
          storeId,
          name,
          slug,
          description,
          price,
          stock,
          image,
          status,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return createSuccessResponse(newProduct[0], 201);
    } catch (error) {
      console.error("Error creating product:", error);
      return createErrorResponse("Failed to create product", 500);
    }
  });
}
