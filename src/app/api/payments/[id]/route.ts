import { NextRequest } from "next/server";
import { db } from "@/db";
import { payment, order } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  withAuth,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api-utils";

/**
 * GET /api/payments/[id] - Get payment status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, user) => {
    const { id } = await params;

    try {
      const paymentData = await db
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
            buyerId: order.buyerId,
            status: order.status,
            total: order.total,
          },
        })
        .from(payment)
        .leftJoin(order, eq(payment.orderId, order.id))
        .where(eq(payment.id, id))
        .limit(1);

      if (paymentData.length === 0) {
        return createErrorResponse("Payment not found", 404);
      }

      // Check if user owns this payment
      if (paymentData[0].order?.buyerId !== user.id) {
        return createErrorResponse("Unauthorized to view this payment", 403);
      }

      return createSuccessResponse(paymentData[0]);
    } catch (error) {
      console.error("Error fetching payment:", error);
      return createErrorResponse("Failed to fetch payment", 500);
    }
  });
}
