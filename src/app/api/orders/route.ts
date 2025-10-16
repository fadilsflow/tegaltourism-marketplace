import { NextRequest } from "next/server";
import { db } from "@/db";
import {
  order,
  orderItem,
  product,
  store,
  address,
  cart,
  cartItem,
} from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import {
  withAuth,
  createErrorResponse,
  createSuccessResponse,
  validateRequestBody,
  validateQueryParams,
  generateId,
  calculateOffset,
  createPaginationMeta,
} from "@/lib/api-utils";
import { createOrderSchema, paginationSchema } from "@/lib/validations";
import { calculateServiceFee, getBuyerServiceFee } from "@/lib/config";

/**
 * GET /api/orders - Get user's orders with pagination
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
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

    try {
      // Get total count
      const totalResult = await db
        .select({ count: order.id })
        .from(order)
        .where(eq(order.buyerId, user.id));
      const total = totalResult.length;

      // Get orders with pagination
      const orders = await db
        .select({
          id: order.id,
          status: order.status,
          total: order.total,
          serviceFee: order.serviceFee,
          buyerServiceFee: order.buyerServiceFee,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          address: {
            id: address.id,
            recipientName: address.recipientName,
            street: address.street,
            city: address.city,
            province: address.province,
            postalCode: address.postalCode,
          },
        })
        .from(order)
        .leftJoin(address, eq(order.addressId, address.id))
        .where(eq(order.buyerId, user.id))
        .orderBy(desc(order.createdAt))
        .limit(limit)
        .offset(calculateOffset(page, limit));

      // Get order items for each order
      const ordersWithItems = await Promise.all(
        orders.map(async (orderData) => {
          const items = await db
            .select({
              id: orderItem.id,
              quantity: orderItem.quantity,
              price: orderItem.price,
              product: {
                id: product.id,
                name: product.name,
                slug: product.slug,
                image: product.image,
              },
              store: {
                id: store.id,
                name: store.name,
                slug: store.slug,
              },
            })
            .from(orderItem)
            .leftJoin(product, eq(orderItem.productId, product.id))
            .leftJoin(store, eq(orderItem.storeId, store.id))
            .where(eq(orderItem.orderId, orderData.id));

          return {
            ...orderData,
            items,
          };
        })
      );

      const pagination = createPaginationMeta(total, page, limit);

      return createSuccessResponse({
        orders: ordersWithItems,
        pagination,
      });
    } catch (error) {
      console.error("Error fetching orders:", error);
      return createErrorResponse("Failed to fetch orders", 500);
    }
  });
}

/**
 * POST /api/orders - Create a new order
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    const validationResult = await validateRequestBody(req, createOrderSchema);
    if (validationResult.error) {
      return createErrorResponse(validationResult.error);
    }

    const { addressId, items } = validationResult.data!;

    try {
      // Verify address belongs to user
      const addressData = await db
        .select({ id: address.id })
        .from(address)
        .where(and(eq(address.id, addressId), eq(address.userId, user.id)))
        .limit(1);

      if (addressData.length === 0) {
        return createErrorResponse("Address not found", 404);
      }

      // Validate products and calculate total
      let total = 0;
      const validatedItems = [];

      for (const item of items) {
        const productData = await db
          .select({
            id: product.id,
            storeId: product.storeId,
            price: product.price,
            stock: product.stock,
            status: product.status,
          })
          .from(product)
          .where(eq(product.id, item.productId))
          .limit(1);

        if (productData.length === 0) {
          return createErrorResponse(
            `Product ${item.productId} not found`,
            404
          );
        }

        const prod = productData[0];

        if (prod.status !== "active") {
          return createErrorResponse(
            `Product ${item.productId} is not available`
          );
        }

        if (prod.stock < item.quantity) {
          return createErrorResponse(
            `Insufficient stock for product ${item.productId}`
          );
        }

        const itemTotal = parseFloat(prod.price) * item.quantity;
        total += itemTotal;

        validatedItems.push({
          productId: item.productId,
          storeId: prod.storeId,
          quantity: item.quantity,
          price: prod.price,
        });
      }

      // Calculate service fee using database value
      const serviceFeeAmount = await calculateServiceFee(total);

      // Calculate buyer service fee using database value
      const buyerServiceFeeAmount = await getBuyerServiceFee();

      // Create order
      const newOrder = await db
        .insert(order)
        .values({
          id: generateId(),
          buyerId: user.id,
          addressId,
          status: "pending",
          total: total.toFixed(2),
          serviceFee: serviceFeeAmount.toFixed(2),
          buyerServiceFee: buyerServiceFeeAmount.toFixed(2),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Create order items
      const orderItems = await db
        .insert(orderItem)
        .values(
          validatedItems.map((item) => ({
            id: generateId(),
            orderId: newOrder[0].id,
            productId: item.productId,
            storeId: item.storeId,
            quantity: item.quantity,
            price: item.price,
          }))
        )
        .returning();

      // Update product stock
      for (const item of validatedItems) {
        const currentProduct = await db
          .select({ stock: product.stock })
          .from(product)
          .where(eq(product.id, item.productId))
          .limit(1);

        if (currentProduct.length > 0) {
          await db
            .update(product)
            .set({
              stock: currentProduct[0].stock - item.quantity,
            })
            .where(eq(product.id, item.productId));
        }
      }

      // Clear user's cart if items came from cart
      const userCart = await db
        .select({ id: cart.id })
        .from(cart)
        .where(eq(cart.userId, user.id))
        .limit(1);

      if (userCart.length > 0) {
        await db.delete(cartItem).where(eq(cartItem.cartId, userCart[0].id));
      }

      return createSuccessResponse(
        {
          order: newOrder[0],
          items: orderItems,
        },
        201
      );
    } catch (error) {
      console.error("Error creating order:", error);
      return createErrorResponse("Failed to create order", 500);
    }
  });
}
