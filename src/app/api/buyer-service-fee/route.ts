import { getSystemSetting } from "@/lib/system-settings";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-utils";

/**
 * GET /api/buyer-service-fee - Get buyer service fee amount
 */
export async function GET() {
  try {
    const buyerServiceFee = await getSystemSetting("buyer_service_fee");

    // If no value found, return default
    const amount = buyerServiceFee ? parseFloat(buyerServiceFee) : 2000;

    return createSuccessResponse({
      buyerServiceFee: amount,
    });
  } catch (error) {
    console.error("Error fetching buyer service fee:", error);
    return createErrorResponse("Failed to fetch buyer service fee", 500);
  }
}
