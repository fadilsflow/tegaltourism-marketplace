import { NextRequest } from "next/server";
import { db } from "@/db";
import { order, orderItem, product, store, address, ticketQr } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
  withAuth,
  createErrorResponse,
  createSuccessResponse,
  validateRequestBody,
} from "@/lib/api-utils";
import { updateOrderStatusSchema } from "@/lib/validations";
import { generateQRCode, generateTicketQRData } from "@/lib/qr-utils";
import { nanoid } from "nanoid";

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
            type: product.type,
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

      // Get QR codes for ticket items if order is paid
      let qrCodes = [];
      if (orderInfo.status === "paid") {
        qrCodes = await db
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
            eq(product.type, "ticket")
          ));
      }

      return createSuccessResponse({
        ...orderInfo,
        items,
        qrCodes,
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
      await db
        .update(order)
        .set({
          status,
          updatedAt: new Date(),
        })
        .where(eq(order.id, id))
        .execute();

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

      const updated = await db
        .select({
          id: order.id,
          buyerId: order.buyerId,
          status: order.status,
          total: order.total,
          serviceFee: order.serviceFee,
          buyerServiceFee: order.buyerServiceFee,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        })
        .from(order)
        .where(eq(order.id, id))
        .limit(1);

      return createSuccessResponse(updated[0]);
    } catch (error) {
      console.error("Error updating order:", error);
      return createErrorResponse("Failed to update order", 500);
    }
  });
}
