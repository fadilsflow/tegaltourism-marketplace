import { NextRequest } from "next/server";
import { db } from "@/db";
import { address } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { 
  withAuth, 
  createErrorResponse, 
  createSuccessResponse,
  validateRequestBody,
  generateId
} from "@/lib/api-utils";
import { createAddressSchema } from "@/lib/validations";

/**
 * GET /api/addresses - Get user's addresses
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const addresses = await db
        .select({
          id: address.id,
          recipientName: address.recipientName,
          phone: address.phone,
          street: address.street,
          city: address.city,
          province: address.province,
          postalCode: address.postalCode,
          isDefault: address.isDefault,
          createdAt: address.createdAt,
        })
        .from(address)
        .where(eq(address.userId, user.id))
        .orderBy(desc(address.isDefault), desc(address.createdAt));

      return createSuccessResponse({ addresses });
    } catch (error) {
      console.error("Error fetching addresses:", error);
      return createErrorResponse("Failed to fetch addresses", 500);
    }
  });
}

/**
 * POST /api/addresses - Create a new address
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    const validationResult = await validateRequestBody(req, createAddressSchema);
    if (validationResult.error) {
      return createErrorResponse(validationResult.error);
    }

    const { recipientName, phone, street, city, province, postalCode, isDefault } = validationResult.data!;

    try {
      // If this is set as default, unset other default addresses
      if (isDefault) {
        await db
          .update(address)
          .set({ isDefault: false })
          .where(eq(address.userId, user.id));
      }

      // Create new address
      const newAddress = await db
        .insert(address)
        .values({
          id: generateId(),
          userId: user.id,
          recipientName,
          phone,
          street,
          city,
          province,
          postalCode,
          isDefault,
          createdAt: new Date(),
        })
        .returning();

      return createSuccessResponse(newAddress[0], 201);
    } catch (error) {
      console.error("Error creating address:", error);
      return createErrorResponse("Failed to create address", 500);
    }
  });
}