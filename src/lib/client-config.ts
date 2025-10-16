/**
 * Client-side configuration constants
 * Safe for use in browser/client components
 */

/**
 * Service fee configuration
 * Percentage of order total that sellers pay as service fee
 * Default: 5% (sellers receive 95% of order total)
 */
export const SERVICE_FEE_PERCENTAGE = 5; // Fallback value

/**
 * Buyer service fee configuration
 * Fixed amount charged to buyers
 * Default: 2000 IDR
 */
export const BUYER_SERVICE_FEE = 2000; // Fallback value

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
 * Synchronous version for client-side calculations (uses fallback value)
 * @returns The buyer service fee amount
 */
export function getBuyerServiceFeeSync(): number {
  return BUYER_SERVICE_FEE;
}
