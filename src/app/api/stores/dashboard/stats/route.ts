import { NextRequest } from "next/server";
import { db } from "@/db";
import { product, store, order, orderItem } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import {
  withAuth,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api-utils";

/**
 * GET /api/seller/dashboard/stats - Get seller dashboard statistics
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (_, user) => {
    try {
      // Get user's store
      const userStore = await db
        .select({ id: store.id })
        .from(store)
        .where(eq(store.ownerId, user.id))
        .limit(1);

      if (userStore.length === 0) {
        return createErrorResponse("Store not found", 404);
      }

      const storeId = userStore[0].id;

      // Get all products for the store
      const products = await db
        .select({
          id: product.id,
          status: product.status,
          stock: product.stock,
        })
        .from(product)
        .where(eq(product.storeId, storeId));

      // Calculate product statistics
      const totalProducts = products.length;
      const activeProducts = products.filter(
        (p) => p.status === "active"
      ).length;
      const lowStockProducts = products.filter((p) => p.stock < 10).length;

      // Get all orders containing seller's products
      const ordersWithItems = await db
        .select({
          orderId: order.id,
          status: order.status,
          createdAt: order.createdAt,
        })
        .from(order)
        .innerJoin(orderItem, eq(order.id, orderItem.orderId))
        .where(eq(orderItem.storeId, storeId))
        .groupBy(order.id, order.status, order.createdAt);

      // Calculate order statistics
      const totalOrders = ordersWithItems.length;
      const pendingOrders = ordersWithItems.filter(
        (o) => o.status === "pending"
      ).length;

      // Calculate recent orders (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentOrdersCount = ordersWithItems.filter(
        (o) => new Date(o.createdAt) >= thirtyDaysAgo
      ).length;

      // Calculate total revenue (sum of seller's share from orders after service fee)
      const orderItems = await db
        .select({
          price: orderItem.price,
          quantity: orderItem.quantity,
          orderTotal: order.total,
          serviceFee: order.serviceFee,
        })
        .from(orderItem)
        .innerJoin(order, eq(orderItem.orderId, order.id))
        .where(
          and(
            eq(orderItem.storeId, storeId),
            inArray(order.status, ["paid", "shipped", "completed"])
          )
        );

      let totalRevenue = 0;
      let totalServiceFeePaid = 0;
      let totalGrossRevenue = 0;

      orderItems.forEach((item) => {
        const itemTotal = parseFloat(item.price.toString()) * item.quantity;
        const orderTotal = parseFloat(item.orderTotal.toString());
        const serviceFee = parseFloat(item.serviceFee.toString());
        
        // Calculate seller's proportional service fee
        const sellerServiceFee = (itemTotal * serviceFee) / orderTotal;
        
        totalGrossRevenue += itemTotal;
        totalServiceFeePaid += sellerServiceFee;
        totalRevenue += (itemTotal - sellerServiceFee);
      });

      return createSuccessResponse({
        totalProducts,
        activeProducts,
        totalOrders,
        pendingOrders,
        totalRevenue: totalRevenue.toFixed(2),
        totalGrossRevenue: totalGrossRevenue.toFixed(2),
        totalServiceFeePaid: totalServiceFeePaid.toFixed(2),
        recentOrdersCount,
        lowStockProducts,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      return createErrorResponse("Failed to fetch dashboard statistics", 500);
    }
  });
}
