import { NextRequest } from "next/server";
import { db } from "@/db";
import { cart, cartItem, product, store } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { 
  withAuth, 
  createErrorResponse, 
  createSuccessResponse,
  validateRequestBody,
  generateId
} from "@/lib/api-utils";
import { addToCartSchema } from "@/lib/validations";

/**
 * GET /api/cart - Get user's cart with items
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      // Get or create user's cart
      let userCart = await db
        .select({ id: cart.id })
        .from(cart)
        .where(eq(cart.userId, user.id))
        .limit(1);

      if (userCart.length === 0) {
        // Create cart if doesn't exist
        const newCart = await db
          .insert(cart)
          .values({
            id: generateId(),
            userId: user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        
        userCart = newCart;
      }

      // Get cart items with product details
      const items = await db
        .select({
          id: cartItem.id,
          quantity: cartItem.quantity,
          product: {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            stock: product.stock,
            image: product.image,
            status: product.status,
          },
          store: {
            id: store.id,
            name: store.name,
            slug: store.slug,
          },
        })
        .from(cartItem)
        .leftJoin(product, eq(cartItem.productId, product.id))
        .leftJoin(store, eq(product.storeId, store.id))
        .where(eq(cartItem.cartId, userCart[0].id));

      // Calculate total
      const total = items.reduce((sum, item) => {
        if (item.product?.price) {
          return sum + (parseFloat(item.product.price) * item.quantity);
        }
        return sum;
      }, 0);

      return createSuccessResponse({
        cart: {
          id: userCart[0].id,
          items,
          total: total.toFixed(2),
          itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
        },
      });
    } catch (error) {
      console.error("Error fetching cart:", error);
      return createErrorResponse("Failed to fetch cart", 500);
    }
  });
}

/**
 * POST /api/cart - Add item to cart
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    const validationResult = await validateRequestBody(req, addToCartSchema);
    if (validationResult.error) {
      return createErrorResponse(validationResult.error);
    }

    const { productId, quantity } = validationResult.data!;

    try {
      // Check if product exists and is active
      const productData = await db
        .select({
          id: product.id,
          stock: product.stock,
          status: product.status,
        })
        .from(product)
        .where(eq(product.id, productId))
        .limit(1);

      if (productData.length === 0) {
        return createErrorResponse("Product not found", 404);
      }

      if (productData[0].status !== "active") {
        return createErrorResponse("Product is not available");
      }

      if (productData[0].stock < quantity) {
        return createErrorResponse("Insufficient stock");
      }

      // Get or create user's cart
      let userCart = await db
        .select({ id: cart.id })
        .from(cart)
        .where(eq(cart.userId, user.id))
        .limit(1);

      if (userCart.length === 0) {
        const newCart = await db
          .insert(cart)
          .values({
            id: generateId(),
            userId: user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        
        userCart = newCart;
      }

      // Check if item already exists in cart
      const existingItem = await db
        .select({ id: cartItem.id, quantity: cartItem.quantity })
        .from(cartItem)
        .where(and(
          eq(cartItem.cartId, userCart[0].id),
          eq(cartItem.productId, productId)
        ))
        .limit(1);

      if (existingItem.length > 0) {
        // Update existing item
        const newQuantity = existingItem[0].quantity + quantity;
        
        if (productData[0].stock < newQuantity) {
          return createErrorResponse("Insufficient stock for requested quantity");
        }

        const updatedItem = await db
          .update(cartItem)
          .set({ quantity: newQuantity })
          .where(eq(cartItem.id, existingItem[0].id))
          .returning();

        return createSuccessResponse(updatedItem[0]);
      } else {
        // Add new item
        const newItem = await db
          .insert(cartItem)
          .values({
            id: generateId(),
            cartId: userCart[0].id,
            productId,
            quantity,
          })
          .returning();

        return createSuccessResponse(newItem[0], 201);
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      return createErrorResponse("Failed to add item to cart", 500);
    }
  });
}

/**
 * DELETE /api/cart - Clear cart
 */
export async function DELETE(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      // Get user's cart
      const userCart = await db
        .select({ id: cart.id })
        .from(cart)
        .where(eq(cart.userId, user.id))
        .limit(1);

      if (userCart.length === 0) {
        return createErrorResponse("Cart not found", 404);
      }

      // Delete all cart items
      await db
        .delete(cartItem)
        .where(eq(cartItem.cartId, userCart[0].id));

      return createSuccessResponse({ message: "Cart cleared successfully" });
    } catch (error) {
      console.error("Error clearing cart:", error);
      return createErrorResponse("Failed to clear cart", 500);
    }
  });
}