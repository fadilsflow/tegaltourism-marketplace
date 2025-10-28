import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { order, orderItem, product, ticketQr } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { generateQRCode, generateTicketQRData } from "@/lib/qr-utils";
import { nanoid } from "nanoid";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get order details
    const orderData = await db
      .select({
        id: order.id,
        status: order.status,
        buyerId: order.buyerId,
      })
      .from(order)
      .where(eq(order.id, id))
      .limit(1);

    if (orderData.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderInfo = orderData[0];

    // Check if user owns this order
    if (orderInfo.buyerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if order is paid
    if (orderInfo.status !== "paid") {
      return NextResponse.json(
        { error: "QR codes can only be generated for paid orders" },
        { status: 400 }
      );
    }

    // Check if QR codes already exist
    const existingQrCodes = await db
      .select({ id: ticketQr.id })
      .from(ticketQr)
      .where(eq(ticketQr.orderId, id))
      .limit(1);

    if (existingQrCodes.length > 0) {
      return NextResponse.json(
        { error: "QR codes already exist for this order" },
        { status: 400 }
      );
    }

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
        eq(product.type, "ticket")
      ));

    if (ticketItems.length === 0) {
      return NextResponse.json(
        { error: "No ticket items found in this order" },
        { status: 400 }
      );
    }

    // Generate QR codes for each ticket item
    const generatedQrCodes = [];
    for (const item of ticketItems) {
      for (let i = 0; i < item.quantity; i++) {
        const qrData = generateTicketQRData(
          id,
          item.id,
          item.productName
        );
        
        const qrCode = await generateQRCode(qrData);
        
        const qrId = nanoid();
        await db.insert(ticketQr).values({
          id: qrId,
          orderId: id,
          orderItemId: item.id,
          qrCode,
          qrData,
          isUsed: false,
          createdAt: new Date(),
        });

        generatedQrCodes.push({
          id: qrId,
          productName: item.productName,
          quantity: 1,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${generatedQrCodes.length} QR codes successfully`,
      qrCodes: generatedQrCodes,
    });
  } catch (error) {
    console.error("Error generating QR codes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
