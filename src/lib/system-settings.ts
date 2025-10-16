import { db } from "@/db";
import { systemSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Get a system setting value by key
 */
export async function getSystemSetting(key: string): Promise<string | null> {
  try {
    const result = await db
      .select({ value: systemSettings.value })
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);

    return result.length > 0 ? result[0].value : null;
  } catch (error) {
    console.error(`Error fetching system setting ${key}:`, error);
    return null;
  }
}

/**
 * Get service fee percentage from database
 * Falls back to default value if not found
 */
export async function getServiceFeePercentage(): Promise<number> {
  const value = await getSystemSetting("service_fee_percentage");
  
  // If no value found, try to create default settings
  if (!value) {
    try {
      // Try to create default settings
      const { generateId } = await import("@/lib/api-utils");
      await db.insert(systemSettings).values({
        id: generateId(),
        key: "service_fee_percentage",
        value: "5",
        description: "Service fee percentage charged to sellers",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log("Created default service fee setting");
      return 5; // Return default value
    } catch (error) {
      console.error("Error creating default service fee setting:", error);
      return 5; // Fallback to default
    }
  }
  
  const percentage = parseFloat(value);
  return Math.max(0, Math.min(100, percentage)); // Ensure it's between 0-100%
}
