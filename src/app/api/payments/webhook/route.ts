import { NextRequest } from "next/server";
import crypto from "crypto";
import { db } from "@/db";
import { payment, order, orderItem, product, ticketQr } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { generateQRCode, generateTicketQRData } from "@/lib/qr-utils";
import { nanoid } from "nanoid";

/**
 * POST /api/payments/webhook - Handle Midtrans payment notifications
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      order_id,
      transaction_status,
      // transaction_id,
      gross_amount,
      signature_key,
      status_code,
    } = body;

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      console.error("[Webhook] Missing MIDTRANS_SERVER_KEY");
      return new Response("Server key not configured", { status: 500 });
    }

    // Signature check
    const expectedSignature = crypto
      .createHash("sha512")
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest("hex");

    if (signature_key !== expectedSignature) {
      console.error(`[Webhook] Invalid signature, order=${order_id}`);
      return new Response("Invalid signature", { status: 401 });
    }

    // Extract original order_id from midtransOrderId (remove timestamp suffix)
    const originalOrderId = order_id.includes('_') ? order_id.split('_')[0] : order_id;
    
    // Ambil payment record using original order_id
    const paymentData = await db
      .select({ id: payment.id, orderId: payment.orderId })
      .from(payment)
      .where(eq(payment.orderId, originalOrderId))
      .limit(1);

    if (paymentData.length === 0) {
      console.error(`[Webhook] Payment not found, originalOrderId=${originalOrderId}, midtransOrderId=${order_id}`);
      return new Response("Payment not found", { status: 404 });
    }

    // Map Midtrans status ke sistem internal
    let paymentStatus: string;
    let orderStatus: string | null = null;

    switch (transaction_status) {
      case "capture":
      case "settlement":
        paymentStatus = "settlement";
        orderStatus = "paid";
        break;
      case "pending":
        paymentStatus = "pending";
        break;
      case "deny":
        paymentStatus = "deny";
        orderStatus = "cancelled";
        break;
      case "cancel":
      case "expire":
        paymentStatus = transaction_status;
        orderStatus = "cancelled";
        break;
      default:
        paymentStatus = transaction_status;
    }

    // Update payment
    await db
      .update(payment)
      .set({ status: paymentStatus, updatedAt: new Date() })
      .where(eq(payment.id, paymentData[0].id));

    // Update order kalau perlu
    if (orderStatus) {
      await db
        .update(order)
        .set({ status: orderStatus, updatedAt: new Date() })
        .where(eq(order.id, paymentData[0].orderId));

      // Generate QR codes for ticket orders when payment is confirmed
      if (orderStatus === "paid") {
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
              eq(orderItem.orderId, paymentData[0].orderId),
              eq(product.type, "ticket")
            ));

          // Generate QR code for each ticket item
          for (const item of ticketItems) {
            for (let i = 0; i < item.quantity; i++) {
              const qrData = generateTicketQRData(
                paymentData[0].orderId,
                item.id,
                item.productName
              );
              
              const qrCode = await generateQRCode(qrData);
              
              await db.insert(ticketQr).values({
                id: nanoid(),
                orderId: paymentData[0].orderId,
                orderItemId: item.id,
                qrCode,
                qrData,
                isUsed: false,
                createdAt: new Date(),
              });
            }
          }
        } catch (qrError) {
          console.error("[Webhook] Error generating QR codes:", qrError);
          // Don't fail the webhook if QR generation fails
        }
      }
    }

    // Minimal logging
    console.info(
      `[Webhook] Success: order=${order_id}, status=${paymentStatus}`
    );

    return Response.json({
      message: "Webhook processed successfully",
      paymentStatus,
      orderStatus,
    });
  } catch (err) {
    console.error("[Webhook] Internal error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
