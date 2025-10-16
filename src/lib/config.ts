/**
 * Application configuration constants
 * Centralized place for configurable values
 */

import { getServiceFeePercentage, getSystemSetting } from "./system-settings";

/**
 * Service fee configuration
 * Percentage of order total that sellers pay as service fee
 * Default: 5% (sellers receive 95% of order total)
 * This value is now stored in the database and can be changed by admin
 */
export const SERVICE_FEE_PERCENTAGE = 5; // Fallback value

/**
 * Calculate service fee amount from order total
 * @param orderTotal - The total order amount
 * @param percentage - Optional custom percentage, defaults to database value
 * @returns The service fee amount
 */
export async function calculateServiceFee(orderTotal: number, percentage?: number): Promise<number> {
  const feePercentage = percentage ?? await getServiceFeePercentage();
  return (orderTotal * feePercentage) / 100;
}

/**
 * Calculate seller earnings after service fee deduction
 * @param orderTotal - The total order amount
 * @param percentage - Optional custom percentage, defaults to database value
 * @returns The amount seller will receive
 */
export async function calculateSellerEarnings(orderTotal: number, percentage?: number): Promise<number> {
  const serviceFee = await calculateServiceFee(orderTotal, percentage);
  return orderTotal - serviceFee;
}

/**
 * Synchronous version for client-side calculations (uses fallback percentage)
 * @param orderTotal - The total order amount
 * @returns The service fee amount
 */
export function calculateServiceFeeSync(orderTotal: number): number {
  return (orderTotal * SERVICE_FEE_PERCENTAGE) / 100;
}

/**
 * Synchronous version for client-side calculations (uses fallback percentage)
 * @param orderTotal - The total order amount
 * @returns The amount seller will receive
 */
export function calculateSellerEarningsSync(orderTotal: number): number {
  return orderTotal - calculateServiceFeeSync(orderTotal);
}

/**
 * Get buyer service fee amount from database
 * This is a fixed amount charged to buyers
 * @returns The buyer service fee amount
 */
export async function getBuyerServiceFee(): Promise<number> {
  const value = await getSystemSetting("buyer_service_fee");
  
  // If no value found, try to create default setting
  if (!value) {
    try {
      const { db } = await import("@/db");
      const { systemSettings } = await import("@/db/schema");
      const { generateId } = await import("@/lib/api-utils");
      
      await db.insert(systemSettings).values({
        id: generateId(),
        key: "buyer_service_fee",
        value: "2000",
        description: "Fixed service fee amount charged to buyers",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log("Created default buyer service fee setting");
      return 2000; // Return default value
    } catch (error) {
      console.error("Error creating default buyer service fee setting:", error);
      return 2000; // Fallback to default
    }
  }
  
  const amount = parseFloat(value);
  return Math.max(0, amount); // Ensure it's not negative
}

/**
 * Synchronous version for client-side calculations (uses fallback value)
 * @returns The buyer service fee amount
 */
export function getBuyerServiceFeeSync(): number {
  return 2000; // Fallback value
}
