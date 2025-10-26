import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { product, order, orderItem, store } from "@/db/schema";
import { eq, and, sql, gte } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || session.user.role !== "tourism-manager") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get tourism manager's store
    const tourismStore = await db
      .select()
      .from(store)
      .where(eq(store.ownerId, session.user.id))
      .limit(1);

    if (tourismStore.length === 0) {
      return NextResponse.json({
        totalTickets: 0,
        soldTickets: 0,
        totalRevenue: 0,
        monthlyOrders: 0,
        popularTickets: [],
        recentOrders: [],
      });
    }

    const storeId = tourismStore[0].id;

    // Get total tickets
    const totalTicketsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(product)
      .where(and(
        eq(product.storeId, storeId),
        eq(product.type, "ticket")
      ));

    const totalTickets = totalTicketsResult[0]?.count || 0;

    // Get sold tickets count
    const soldTicketsResult = await db
      .select({ count: sql<number>`sum(${orderItem.quantity})` })
      .from(orderItem)
      .innerJoin(product, eq(orderItem.productId, product.id))
      .innerJoin(order, eq(orderItem.orderId, order.id))
      .where(and(
        eq(product.storeId, storeId),
        eq(product.type, "ticket"),
        eq(order.status, "paid")
      ));

    const soldTickets = soldTicketsResult[0]?.count || 0;

    // Get total revenue
    const totalRevenueResult = await db
      .select({ total: sql<number>`sum(${order.total})` })
      .from(order)
      .innerJoin(orderItem, eq(order.id, orderItem.orderId))
      .innerJoin(product, eq(orderItem.productId, product.id))
      .where(and(
        eq(product.storeId, storeId),
        eq(product.type, "ticket"),
        eq(order.status, "paid")
      ));

    const totalRevenue = totalRevenueResult[0]?.total || 0;

    // Get monthly orders
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyOrdersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(order)
      .innerJoin(orderItem, eq(order.id, orderItem.orderId))
      .innerJoin(product, eq(orderItem.productId, product.id))
      .where(and(
        eq(product.storeId, storeId),
        eq(product.type, "ticket"),
        gte(order.createdAt, startOfMonth)
      ));

    const monthlyOrders = monthlyOrdersResult[0]?.count || 0;

    // Get popular tickets
    const popularTickets = await db
      .select({
        id: product.id,
        name: product.name,
        price: product.price,
        soldCount: sql<number>`sum(${orderItem.quantity})`,
      })
      .from(product)
      .leftJoin(orderItem, eq(product.id, orderItem.productId))
      .leftJoin(order, and(
        eq(orderItem.orderId, order.id),
        eq(order.status, "paid")
      ))
      .where(and(
        eq(product.storeId, storeId),
        eq(product.type, "ticket")
      ))
      .groupBy(product.id)
      .orderBy(sql`sum(${orderItem.quantity}) desc`)
      .limit(5);

    // Get recent orders
    const recentOrders = await db
      .select({
        id: order.id,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
      })
      .from(order)
      .innerJoin(orderItem, eq(order.id, orderItem.orderId))
      .innerJoin(product, eq(orderItem.productId, product.id))
      .where(and(
        eq(product.storeId, storeId),
        eq(product.type, "ticket")
      ))
      .groupBy(order.id)
      .orderBy(sql`${order.createdAt} desc`)
      .limit(5);

    return NextResponse.json({
      totalTickets,
      soldTickets,
      totalRevenue,
      monthlyOrders,
      popularTickets,
      recentOrders,
    });
  } catch (error) {
    console.error("Error fetching tourism manager stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
