import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { order, orderItem, product, store, user } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

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
      return NextResponse.json({ orders: [] });
    }

    const storeId = tourismStore[0].id;

    // Get orders that contain tickets from this tourism manager
    const orders = await db
      .select({
        id: order.id,
        buyerId: order.buyerId,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt,
        buyer: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
      .from(order)
      .innerJoin(orderItem, eq(order.id, orderItem.orderId))
      .innerJoin(product, eq(orderItem.productId, product.id))
      .innerJoin(user, eq(order.buyerId, user.id))
      .where(and(
        eq(product.storeId, storeId),
        eq(product.type, "ticket")
      ))
      .groupBy(order.id)
      .orderBy(desc(order.createdAt));

    // Get order items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (orderData) => {
        const items = await db
          .select({
            id: orderItem.id,
            productId: orderItem.productId,
            quantity: orderItem.quantity,
            price: orderItem.price,
            product: {
              id: product.id,
              name: product.name,
              image: product.image,
            },
          })
          .from(orderItem)
          .innerJoin(product, eq(orderItem.productId, product.id))
          .where(and(
            eq(orderItem.orderId, orderData.id),
            eq(product.storeId, storeId),
            eq(product.type, "ticket")
          ));

        return {
          ...orderData,
          items,
        };
      })
    );

    return NextResponse.json({ orders: ordersWithItems });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
