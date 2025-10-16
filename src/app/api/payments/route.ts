import { NextRequest } from "next/server";
import { db } from "@/db";
import { payment, order } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
  withAuth,
  createErrorResponse,
  createSuccessResponse,
  validateRequestBody,
  generateId,
} from "@/lib/api-utils";
import { createPaymentSchema } from "@/lib/validations";

/**
 * POST /api/payments - Create a payment for an order
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    const validationResult = await validateRequestBody(
      req,
      createPaymentSchema
    );
    if (validationResult.error) {
      return createErrorResponse(validationResult.error);
    }

    const { orderId, paymentType } = validationResult.data!;

    try {
      // Validate environment variables
      if (!process.env.MIDTRANS_SERVER_KEY) {
        console.error("MIDTRANS_SERVER_KEY is not set");
        return createErrorResponse("Payment service not configured", 500);
      }

      // if (!process.env.NEXT_PUBLIC_APP_URL) {
      //   console.error("NEXT_PUBLIC_APP_URL is not set");
      //   return createErrorResponse("App URL not configured", 500);
      // }

      // Verify order exists and belongs to user
      const orderData = await db
        .select({
          id: order.id,
          buyerId: order.buyerId,
          status: order.status,
          total: order.total,
          buyerServiceFee: order.buyerServiceFee,
        })
        .from(order)
        .where(and(eq(order.id, orderId), eq(order.buyerId, user.id)))
        .limit(1);

      if (orderData.length === 0) {
        return createErrorResponse("Order not found", 404);
      }

      if (orderData[0].status !== "pending") {
        return createErrorResponse("Order is not pending payment", 400);
      }

      // Check if payment already exists
      const existingPayment = await db
        .select({
          id: payment.id,
          transactionId: payment.transactionId,
          status: payment.status,
          createdAt: payment.createdAt,
        })
        .from(payment)
        .where(eq(payment.orderId, orderId))
        .limit(1);

      if (existingPayment.length > 0) {
        const existing = existingPayment[0];

        // If payment is still pending and not too old (less than 24 hours), return existing payment
        const isRecent =
          new Date().getTime() - new Date(existing.createdAt).getTime() <
          24 * 60 * 60 * 1000;

        if (existing.status === "pending" && isRecent) {
          // Return existing payment info - user can continue with the same payment
          return createSuccessResponse({
            payment: existing,
            redirect_url: `https://app.midtrans.com/snap/v2/vtweb/${existing.transactionId}`,
            token: existing.transactionId,
            message: "Using existing payment",
          });
        }

        // If payment is expired or failed, we'll create a new one below
        // (fall through to create new payment)
      }

      // Call Midtrans Snap API
      // Include buyer service fee in the total amount sent to Midtrans
      const grossAmount = Math.round(
        parseFloat(orderData[0].total) +
          parseFloat(orderData[0].buyerServiceFee)
      );

      // Generate unique order_id for Midtrans (add timestamp to make it unique)
      const timestamp = Date.now();
      const midtransOrderId = `${orderId}_${timestamp}`;

      const snapResponse = await fetch(
        "https://app.midtrans.com/snap/v1/transactions",
        // "https://app.sandbox.midtrans.com/snap/v1/transactions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${Buffer.from(
              process.env.MIDTRANS_SERVER_KEY + ":"
            ).toString("base64")}`,
          },
          body: JSON.stringify({
            transaction_details: {
              order_id: midtransOrderId,
              gross_amount: grossAmount,
            },
            customer_details: {
              first_name: user.name || "Customer",
              last_name: "",
              email: user.email || "customer@example.com",
              phone: "",
            },
            item_details: [
              {
                id: `${orderId}_items`,
                price: Math.round(parseFloat(orderData[0].total)),
                quantity: 1,
                name: `Order #${orderId.slice(-8)} - Items`,
              },
              {
                id: `${orderId}_service_fee`,
                price: Math.round(parseFloat(orderData[0].buyerServiceFee)),
                quantity: 1,
                name: `Service Fee`,
              },
            ],
            callbacks: {
              finish: `${
                process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
              }/orders/${orderId}`,
            },
          }),
        }
      );

      const snapData = await snapResponse.json();

      if (!snapResponse.ok) {
        console.error("Midtrans API Error:");
        console.error("Status:", snapResponse.status);
        console.error("Response:", snapData);
        console.error("Request body:", {
          transaction_details: {
            order_id: midtransOrderId,
            gross_amount: grossAmount,
          },
          customer_details: {
            first_name: user.name || "Customer",
            last_name: "",
            email: user.email || "customer@example.com",
            phone: "",
          },
        });

        return createErrorResponse(
          `Failed to create midtrans transaction: ${
            snapData.error_message || snapData.message || "Unknown error"
          }`,
          500
        );
      }

      // Create payment record
      const newPayment = await db
        .insert(payment)
        .values({
          id: generateId(),
          orderId,
          transactionId: snapData.token,
          status: "pending",
          grossAmount: (
            parseFloat(orderData[0].total) +
            parseFloat(orderData[0].buyerServiceFee)
          ).toFixed(2),
          paymentType,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return createSuccessResponse(
        {
          payment: newPayment[0],
          redirect_url: snapData.redirect_url, // used in frontend
          token: snapData.token,
        },
        201
      );
    } catch (error) {
      console.error("Error creating payment:", error);
      return createErrorResponse("Failed to create payment", 500);
    }
  });
}

/**
 * GET /api/payments - Get user's payments
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const payments = await db
        .select({
          id: payment.id,
          transactionId: payment.transactionId,
          status: payment.status,
          grossAmount: payment.grossAmount,
          paymentType: payment.paymentType,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
          order: {
            id: order.id,
            status: order.status,
            total: order.total,
          },
        })
        .from(payment)
        .leftJoin(order, eq(payment.orderId, order.id))
        .where(eq(order.buyerId, user.id))
        .orderBy(payment.createdAt);

      return createSuccessResponse({ payments });
    } catch (error) {
      console.error("Error fetching payments:", error);
      return createErrorResponse("Failed to fetch payments", 500);
    }
  });
}
