import { NextRequest } from "next/server";
import { db } from "@/db";
import { order, orderItem, product, store, address } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  withAuth,
  createErrorResponse,
  createSuccessResponse,
  validateRequestBody,
} from "@/lib/api-utils";
import { updateOrderStatusSchema } from "@/lib/validations";

/**
 * GET /api/orders/[id] - Get a specific order
 * - Buyers can view their own orders
 * - Store owners can view orders containing their products
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, user) => {
    const { id } = await params;

    try {
      // First, get the basic order data
      const orderData = await db
        .select({
          id: order.id,
          buyerId: order.buyerId,
          status: order.status,
          total: order.total,
          serviceFee: order.serviceFee,
          buyerServiceFee: order.buyerServiceFee,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          address: {
            id: address.id,
            recipientName: address.recipientName,
            phone: address.phone,
            street: address.street,
            city: address.city,
            province: address.province,
            postalCode: address.postalCode,
          },
        })
        .from(order)
        .leftJoin(address, eq(order.addressId, address.id))
        .where(eq(order.id, id))
        .limit(1);

      if (orderData.length === 0) {
        return createErrorResponse("Order not found", 404);
      }

      const orderInfo = orderData[0];

      // Check if user has permission to view this order
      let hasPermission = false;

      // Check if user is the buyer
      if (orderInfo.buyerId === user.id) {
        hasPermission = true;
      } else {
        // Check if user owns any store that has items in this order
        const storeItems = await db
          .select({
            storeId: orderItem.storeId,
            store: {
              ownerId: store.ownerId,
            },
          })
          .from(orderItem)
          .leftJoin(store, eq(orderItem.storeId, store.id))
          .where(eq(orderItem.orderId, id));

        hasPermission = storeItems.some(
          (item) => item.store?.ownerId === user.id
        );
      }

      if (!hasPermission) {
        return createErrorResponse("Order not found", 404);
      }

      // Get order items
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
        .where(eq(orderItem.orderId, id));

      return createSuccessResponse({
        ...orderInfo,
        items,
      });
    } catch (error) {
      console.error("Error fetching order:", error);
      return createErrorResponse("Failed to fetch order", 500);
    }
  });
}

//  PUT /api/orders/[id] - Update order status

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, user) => {
    const { id } = await params;

    const validationResult = await validateRequestBody(
      req,
      updateOrderStatusSchema
    );
    if (validationResult.error) {
      return createErrorResponse(validationResult.error);
    }

    const { status } = validationResult.data!;

    try {
      // First, get the basic order data
      const orderData = await db
        .select({
          id: order.id,
          buyerId: order.buyerId,
          status: order.status,
        })
        .from(order)
        .where(eq(order.id, id))
        .limit(1);

      if (orderData.length === 0) {
        return createErrorResponse("Order not found", 404);
      }

      // Check if user has permission to update this order
      let isStoreOwner = false;
      let isBuyer = false;

      // Check if user is the buyer
      if (orderData[0].buyerId === user.id) {
        isBuyer = true;
      } else {
        // Check if user owns any store that has items in this order
        const storeItems = await db
          .select({
            storeId: orderItem.storeId,
            store: {
              ownerId: store.ownerId,
            },
          })
          .from(orderItem)
          .leftJoin(store, eq(orderItem.storeId, store.id))
          .where(eq(orderItem.orderId, id));

        isStoreOwner = storeItems.some(
          (item) => item.store?.ownerId === user.id
        );
      }

      // Permission validation
      if (!isBuyer && !isStoreOwner) {
        return createErrorResponse("Unauthorized to update this order", 403);
      }

      // Update order status
      const updatedOrder = await db
        .update(order)
        .set({
          status,
          updatedAt: new Date(),
        })
        .where(eq(order.id, id))
        .returning();

      return createSuccessResponse(updatedOrder[0]);
    } catch (error) {
      console.error("Error updating order:", error);
      return createErrorResponse("Failed to update order", 500);
    }
  });
}
