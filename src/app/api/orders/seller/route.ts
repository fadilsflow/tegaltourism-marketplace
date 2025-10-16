import { NextRequest } from "next/server";
import { db } from "@/db";
import { order, orderItem, product, store, address } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  withAuth,
  createErrorResponse,
  createSuccessResponse,
  validateQueryParams,
  calculateOffset,
  createPaginationMeta,
} from "@/lib/api-utils";
import { paginationSchema } from "@/lib/validations";

/**
 * GET /api/orders/seller - Get orders for seller's products with pagination
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
      // First, get the seller's store
      const sellerStore = await db
        .select({ id: store.id })
        .from(store)
        .where(eq(store.ownerId, user.id))
        .limit(1);

      if (sellerStore.length === 0) {
        return createErrorResponse(
          "Store not found. Please create a store first.",
          404
        );
      }

      const storeId = sellerStore[0].id;

      // Get total count of orders containing seller's products
      const totalResult = await db
        .select({ orderId: order.id })
        .from(order)
        .innerJoin(orderItem, eq(order.id, orderItem.orderId))
        .innerJoin(product, eq(orderItem.productId, product.id))
        .where(eq(product.storeId, storeId))
        .groupBy(order.id);

      const total = totalResult.length;

      // Get orders with pagination
      const orders = await db
        .select({
          id: order.id,
          buyerId: order.buyerId,
          status: order.status,
          total: order.total,
          serviceFee: order.serviceFee,
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
        .innerJoin(orderItem, eq(order.id, orderItem.orderId))
        .innerJoin(product, eq(orderItem.productId, product.id))
        .leftJoin(address, eq(order.addressId, address.id))
        .where(eq(product.storeId, storeId))
        .groupBy(
          order.id,
          order.buyerId,
          order.status,
          order.total,
          order.createdAt,
          order.updatedAt,
          address.id,
          address.recipientName,
          address.phone,
          address.street,
          address.city,
          address.province,
          address.postalCode
        )
        .orderBy(desc(order.createdAt))
        .limit(limit)
        .offset(calculateOffset(page, limit));

      // Get order items for each order (only seller's products)
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
            .where(
              and(
                eq(orderItem.orderId, orderData.id),
                eq(product.storeId, storeId)
              )
            );

          // Calculate total for seller's items only
          const sellerTotal = items.reduce(
            (sum, item) => sum + parseFloat(item.price) * item.quantity,
            0
          );

          // Calculate service fee for seller's portion of the order
          const sellerServiceFee = (sellerTotal * parseFloat(orderData.serviceFee)) / parseFloat(orderData.total);
          const sellerEarnings = sellerTotal - sellerServiceFee;

          return {
            ...orderData,
            items,
            sellerTotal: sellerTotal.toFixed(2),
            sellerServiceFee: sellerServiceFee.toFixed(2),
            sellerEarnings: sellerEarnings.toFixed(2),
          };
        })
      );

      const pagination = createPaginationMeta(total, page, limit);

      return createSuccessResponse({
        orders: ordersWithItems,
        pagination,
      });
    } catch (error) {
      console.error("Error fetching seller orders:", error);
      return createErrorResponse("Failed to fetch orders", 500);
    }
  });
}
