import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { order, orderItem, product, store, user, ticketQr } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { generateQRCode, generateTicketQRData } from "@/lib/qr-utils";
import { nanoid } from "nanoid";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || session.user.role !== "tourism-manager") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get tourism manager's store
    const tourismStore = await db
      .select()
      .from(store)
      .where(eq(store.ownerId, session.user.id))
      .limit(1);

    if (tourismStore.length === 0) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const storeId = tourismStore[0].id;

    // Get order details
    const orderData = await db
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
      .innerJoin(user, eq(order.buyerId, user.id))
      .where(eq(order.id, id))
      .limit(1);

    if (orderData.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Get order items for this tourism manager's tickets
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
        eq(orderItem.orderId, id),
        eq(product.storeId, storeId),
        eq(product.type, "ticket")
      ));

    // Get QR codes for this order
    const qrCodes = await db
      .select({
        id: ticketQr.id,
        orderItemId: ticketQr.orderItemId,
        qrCode: ticketQr.qrCode,
        qrData: ticketQr.qrData,
        isUsed: ticketQr.isUsed,
        usedAt: ticketQr.usedAt,
        productName: product.name,
        quantity: orderItem.quantity,
      })
      .from(ticketQr)
      .innerJoin(orderItem, eq(ticketQr.orderItemId, orderItem.id))
      .innerJoin(product, eq(orderItem.productId, product.id))
      .where(and(
        eq(ticketQr.orderId, id),
        eq(product.storeId, storeId),
        eq(product.type, "ticket")
      ));

    return NextResponse.json({
      ...orderData[0],
      items,
      qrCodes,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || session.user.role !== "tourism-manager") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await request.json();

    if (!status || !["pending", "paid", "completed", "cancelled"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'pending', 'paid', 'completed', or 'cancelled'" },
        { status: 400 }
      );
    }

    // Get tourism manager's store
    const tourismStore = await db
      .select()
      .from(store)
      .where(eq(store.ownerId, session.user.id))
      .limit(1);

    if (tourismStore.length === 0) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const storeId = tourismStore[0].id;

    // Check if order exists and belongs to this tourism manager
    const orderData = await db
      .select({ id: order.id })
      .from(order)
      .innerJoin(orderItem, eq(order.id, orderItem.orderId))
      .innerJoin(product, eq(orderItem.productId, product.id))
      .where(and(
        eq(order.id, id),
        eq(product.storeId, storeId),
        eq(product.type, "ticket")
      ))
      .limit(1);

    if (orderData.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update order status
    await db
      .update(order)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(order.id, id));

    // Generate QR codes for ticket orders when status is updated to "paid"
    if (status === "paid") {
      try {
        // Get all ticket items in this order
        const ticketItems = await db
          .select({
            id: orderItem.id,
            productId: orderItem.productId,
            quantity: orderItem.quantity,
            productName: product.name,
          })
          .from(orderItem)
          .innerJoin(product, eq(orderItem.productId, product.id))
          .where(and(
            eq(orderItem.orderId, id),
            eq(product.storeId, storeId),
            eq(product.type, "ticket")
          ));

        // Generate QR code for each ticket item
        for (const item of ticketItems) {
          for (let i = 0; i < item.quantity; i++) {
            const qrData = generateTicketQRData(
              id,
              item.id,
              item.productName
            );
            
            const qrCode = await generateQRCode(qrData);
            
            await db.insert(ticketQr).values({
              id: nanoid(),
              orderId: id,
              orderItemId: item.id,
              qrCode,
              qrData,
              isUsed: false,
              createdAt: new Date(),
            });
          }
        }
      } catch (qrError) {
        console.error("Error generating QR codes:", qrError);
        // Don't fail the order update if QR generation fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Order status updated successfully" 
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}