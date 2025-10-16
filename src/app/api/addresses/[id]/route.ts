import { NextRequest } from "next/server";
import { db } from "@/db";
import { address } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { 
  withAuth, 
  createErrorResponse, 
  createSuccessResponse,
  validateRequestBody
} from "@/lib/api-utils";
import { updateAddressSchema } from "@/lib/validations";

/**
 * GET /api/addresses/[id] - Get a specific address
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, user) => {
    const { id } = await params;

    try {
      const addressData = await db
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
        .where(and(eq(address.id, id), eq(address.userId, user.id)))
        .limit(1);

      if (addressData.length === 0) {
        return createErrorResponse("Address not found", 404);
      }

      return createSuccessResponse(addressData[0]);
    } catch (error) {
      console.error("Error fetching address:", error);
      return createErrorResponse("Failed to fetch address", 500);
    }
  });
}

/**
 * PUT /api/addresses/[id] - Update an address
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, user) => {
    const { id } = await params;

    const validationResult = await validateRequestBody(req, updateAddressSchema);
    if (validationResult.error) {
      return createErrorResponse(validationResult.error);
    }

    const updateData = validationResult.data!;

    try {
      // Check if address exists and belongs to user
      const existingAddress = await db
        .select({ id: address.id })
        .from(address)
        .where(and(eq(address.id, id), eq(address.userId, user.id)))
        .limit(1);

      if (existingAddress.length === 0) {
        return createErrorResponse("Address not found", 404);
      }

      // If setting as default, unset other default addresses
      if (updateData.isDefault) {
        await db
          .update(address)
          .set({ isDefault: false })
          .where(eq(address.userId, user.id));
      }

      // Update address
      const updatedAddress = await db
        .update(address)
        .set(updateData)
        .where(and(eq(address.id, id), eq(address.userId, user.id)))
        .returning();

      return createSuccessResponse(updatedAddress[0]);
    } catch (error) {
      console.error("Error updating address:", error);
      return createErrorResponse("Failed to update address", 500);
    }
  });
}

/**
 * DELETE /api/addresses/[id] - Delete an address
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, user) => {
    const { id } = await params;

    try {
      // Check if address exists and belongs to user
      const existingAddress = await db
        .select({ id: address.id })
        .from(address)
        .where(and(eq(address.id, id), eq(address.userId, user.id)))
        .limit(1);

      if (existingAddress.length === 0) {
        return createErrorResponse("Address not found", 404);
      }

      // Delete address
      await db
        .delete(address)
        .where(and(eq(address.id, id), eq(address.userId, user.id)));

      return createSuccessResponse({ message: "Address deleted successfully" });
    } catch (error) {
      console.error("Error deleting address:", error);
      return createErrorResponse("Failed to delete address", 500);
    }
  });
}