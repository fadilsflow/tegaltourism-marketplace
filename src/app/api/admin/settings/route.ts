import { NextRequest } from "next/server";
import { db } from "@/db";
import { systemSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  createErrorResponse,
  createSuccessResponse,
  validateRequestBody,
  generateId,
} from "@/lib/api-utils";
import { z } from "zod";

const updateSettingSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string().min(1, "Value is required"),
});

/**
 * Create default system settings
 */
async function createDefaultSettings() {
  try {
    await db.insert(systemSettings).values([
      {
        id: generateId(),
        key: "service_fee_percentage",
        value: "5",
        description: "Service fee percentage charged to sellers",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: generateId(),
        key: "buyer_service_fee",
        value: "2000",
        description: "Fixed service fee amount charged to buyers",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    console.log("Default settings created successfully");
  } catch (error) {
    console.error("Error creating default settings:", error);
    throw error;
  }
}

/**
 * GET /api/admin/settings - Get all system settings or specific setting by key
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (key) {
      // Get specific setting by key
      const setting = await db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.key, key))
        .limit(1);

      if (setting.length === 0) {
        return createErrorResponse("Setting not found", 404);
      }

      return createSuccessResponse({ setting: setting[0] });
    } else {
      // Get all settings
      const settings = await db
        .select()
        .from(systemSettings)
        .orderBy(systemSettings.key);

      // If no settings exist, create default ones
      if (settings.length === 0) {
        await createDefaultSettings();
        // Fetch again after creating defaults
        const newSettings = await db
          .select()
          .from(systemSettings)
          .orderBy(systemSettings.key);
        return createSuccessResponse({ settings: newSettings });
      }

      return createSuccessResponse({ settings });
    }
  } catch (error) {
    console.error("Error fetching settings:", error);
    return createErrorResponse("Failed to fetch settings", 500);
  }
}

/**
 * PUT /api/admin/settings - Update a system setting
 */
export async function PUT(request: NextRequest) {
  const validationResult = await validateRequestBody(
    request,
    updateSettingSchema
  );
  if (validationResult.error) {
    return createErrorResponse(validationResult.error);
  }

  const { key, value } = validationResult.data!;

  try {
    // Check if setting exists
    const existingSetting = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);

    if (existingSetting.length === 0) {
      // Create new setting
      const newSetting = await db
        .insert(systemSettings)
        .values({
          id: generateId(),
          key,
          value,
          updatedAt: new Date(),
        })
        .returning();

      return createSuccessResponse({ setting: newSetting[0] });
    } else {
      // Update existing setting
      const updatedSetting = await db
        .update(systemSettings)
        .set({
          value,
          updatedAt: new Date(),
        })
        .where(eq(systemSettings.key, key))
        .returning();

      return createSuccessResponse({ setting: updatedSetting[0] });
    }
  } catch (error) {
    console.error("Error updating setting:", error);
    return createErrorResponse("Failed to update setting", 500);
  }
}
