import { NextRequest } from "next/server";
import { db } from "@/db";
import { cart, cartItem, product } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { 
  withAuth, 
  createErrorResponse, 
  createSuccessResponse,
  validateRequestBody
} from "@/lib/api-utils";
import { updateCartItemSchema } from "@/lib/validations";

/**
 * PUT /api/cart/[itemId] - Update cart item quantity
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  return withAuth(request, async (req, user) => {
    const { itemId } = await params;

    const validationResult = await validateRequestBody(req, updateCartItemSchema);
    if (validationResult.error) {
      return createErrorResponse(validationResult.error);
    }

    const { quantity } = validationResult.data!;

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

      // Check if cart item exists and belongs to user's cart
      const existingItem = await db
        .select({
          id: cartItem.id,
          productId: cartItem.productId,
          quantity: cartItem.quantity,
        })
        .from(cartItem)
        .where(and(
          eq(cartItem.id, itemId),
          eq(cartItem.cartId, userCart[0].id)
        ))
        .limit(1);

      if (existingItem.length === 0) {
        return createErrorResponse("Cart item not found", 404);
      }

      // Check product stock
      const productData = await db
        .select({
          id: product.id,
          stock: product.stock,
          status: product.status,
        })
        .from(product)
        .where(eq(product.id, existingItem[0].productId))
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

      // Update cart item
      const updatedItem = await db
        .update(cartItem)
        .set({ quantity })
        .where(eq(cartItem.id, itemId))
        .returning();

      return createSuccessResponse(updatedItem[0]);
    } catch (error) {
      console.error("Error updating cart item:", error);
      return createErrorResponse("Failed to update cart item", 500);
    }
  });
}

/**
 * DELETE /api/cart/[itemId] - Remove item from cart
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  return withAuth(request, async (req, user) => {
    const { itemId } = await params;

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

      // Check if cart item exists and belongs to user's cart
      const existingItem = await db
        .select({ id: cartItem.id })
        .from(cartItem)
        .where(and(
          eq(cartItem.id, itemId),
          eq(cartItem.cartId, userCart[0].id)
        ))
        .limit(1);

      if (existingItem.length === 0) {
        return createErrorResponse("Cart item not found", 404);
      }

      // Delete cart item
      await db
        .delete(cartItem)
        .where(eq(cartItem.id, itemId));

      return createSuccessResponse({ message: "Item removed from cart successfully" });
    } catch (error) {
      console.error("Error removing cart item:", error);
      return createErrorResponse("Failed to remove cart item", 500);
    }
  });
}