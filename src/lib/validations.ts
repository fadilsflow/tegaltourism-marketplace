import { z } from "zod";

/* ======================
   STORE VALIDATIONS
   ====================== */
export const createStoreSchema = z.object({
  name: z
    .string()
    .min(1, "Store name is required")
    .max(100, "Store name too long"),
  slug: z
    .string()
    .min(1, "Store slug is required")
    .max(50, "Store slug too long")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    ),
  areaId: z.string().optional(),
  description: z.string().optional(),
  logo: z.string().optional(),
});

export const updateStoreSchema = z.object({
  name: z
    .string()
    .min(1, "Store name is required")
    .max(100, "Store name too long"),
  slug: z
    .string()
    .min(1, "Store slug is required")
    .max(50, "Store slug too long")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    ),
  areaId: z.string().min(1, "The area must be selected"),
  description: z.string().optional(),
  logo: z.string().url("Invalid logo URL").optional().or(z.literal("")),
});

/* ======================
   USER VALIDATIONS
   ====================== */
export const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  image: z.string().url("Invalid image URL").optional().or(z.literal("")),
});

/* ======================
   PRODUCT VALIDATIONS
   ====================== */
export const createProductSchema = z.object({
  storeId: z.string().min(1, "Store ID is required"),
  name: z
    .string()
    .min(1, "Product name is required")
    .max(200, "Product name too long"),
  slug: z
    .string()
    .min(1, "Product slug is required")
    .max(100, "Product slug too long")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    ),
  description: z.string().optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  image: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const updateProductSchema = createProductSchema
  .partial()
  .omit({ storeId: true });

/* ======================
   ADDRESS VALIDATIONS
   ====================== */
export const createAddressSchema = z.object({
  recipientName: z
    .string()
    .min(1, "Recipient name is required")
    .max(100, "Name too long"),
  phone: z
    .string()
    .regex(/^[0-9+\-\s()]+$/, "Invalid phone number format")
    .optional(),
  street: z
    .string()
    .min(1, "Street address is required")
    .max(200, "Street address too long"),
  city: z.string().min(1, "City is required").max(100, "City name too long"),
  province: z
    .string()
    .min(1, "Province is required")
    .max(100, "Province name too long"),
  postalCode: z
    .string()
    .min(1, "Postal code is required")
    .max(10, "Postal code too long"),
  isDefault: z.boolean().default(false),
});

export const updateAddressSchema = createAddressSchema.partial();

/* ======================
   CART VALIDATIONS
   ====================== */
export const addToCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z
    .number()
    .int()
    .min(1, "Quantity must be at least 1")
    .max(99, "Quantity too large"),
});

export const updateCartItemSchema = z.object({
  quantity: z
    .number()
    .int()
    .min(1, "Quantity must be at least 1")
    .max(99, "Quantity too large"),
});

/* ======================
   ORDER VALIDATIONS
   ====================== */
export const createOrderSchema = z.object({
  addressId: z.string().min(1, "Address ID is required"),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Product ID is required"),
        quantity: z.number().int().min(1, "Quantity must be at least 1"),
      })
    )
    .min(1, "At least one item is required"),
});

export const checkoutSchema = z.object({
  addressId: z.string().min(1, "Delivery address is required"),
  paymentMethod: z.enum(["pay_now", "pay_later"]).refine((val) => val, {
    message: "Payment method is required",
  }),
  notes: z.string().max(500, "Notes too long").optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "paid", "shipped", "completed", "cancelled"]),
});

/* ======================
   PAYMENT VALIDATIONS
   ====================== */
export const createPaymentSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  paymentType: z.string().optional(),
});

export const paymentWebhookSchema = z.object({
  order_id: z.string(),
  transaction_status: z.string(),
  transaction_id: z.string(),
  gross_amount: z.string(),
  payment_type: z.string().optional(),
  signature_key: z.string(),
});

/* ======================
   COMMON VALIDATIONS
   ====================== */
export const paginationSchema = z.object({
  page: z
    .string()
    .transform((val) => parseInt(val) || 1)
    .pipe(z.number().min(1)),
  limit: z
    .string()
    .transform((val) => parseInt(val) || 10)
    .pipe(z.number().min(1).max(100)),
});

export const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  minPrice: z
    .string()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .optional(),
  maxPrice: z
    .string()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .optional(),
  sortBy: z.enum(["name", "price", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
