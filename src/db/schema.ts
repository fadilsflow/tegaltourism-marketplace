import {
  pgTable,
  text,
  timestamp,
  boolean,
  numeric,
  integer,
} from "drizzle-orm/pg-core";

/* ======================
   AUTH -> better-auth generated
   ====================== */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  // Admin plugin fields
  role: text("role").default("user"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  // Admin plugin field
  impersonatedBy: text("impersonated_by"),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date()
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => /* @__PURE__ */ new Date()
  ),
});

/* ======================
   STORE & PRODUCT
   ====================== */
export const store = pgTable("store", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(), // /store/[slug]
  areaId: text("area_id"),
  description: text("description"),
  logo: text("logo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const product = pgTable("product", {
  id: text("id").primaryKey(),
  storeId: text("store_id")
    .notNull()
    .references(() => store.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(), // /product/[slug]
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").notNull(),
  image: text("image"),
  status: text("status").$defaultFn(() => "active"), // active, inactive
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/* ======================
   ADDRESS
   ====================== */
export const address = pgTable("address", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  recipientName: text("recipient_name").notNull(),
  phone: text("phone"),
  street: text("street").notNull(),
  city: text("city").notNull(),
  province: text("province").notNull(),
  postalCode: text("postal_code").notNull(),
  isDefault: boolean("is_default").$defaultFn(() => false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* ======================
   CART
   ====================== */
export const cart = pgTable("cart", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const cartItem = pgTable("cart_item", {
  id: text("id").primaryKey(),
  cartId: text("cart_id")
    .notNull()
    .references(() => cart.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => product.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull(),
});

/* ======================
   ORDER
   ====================== */
export const order = pgTable("order", {
  id: text("id").primaryKey(),
  buyerId: text("buyer_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  addressId: text("address_id")
    .notNull()
    .references(() => address.id, { onDelete: "restrict" }),
  status: text("status").$defaultFn(() => "pending"), // pending, paid, shipped, completed, cancelled
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  serviceFee: numeric("service_fee", { precision: 10, scale: 2 }).notNull().default("0.00"),
  buyerServiceFee: numeric("buyer_service_fee", { precision: 10, scale: 2 }).notNull().default("0.00"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orderItem = pgTable("order_item", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => order.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => product.id, { onDelete: "cascade" }),
  storeId: text("store_id")
    .notNull()
    .references(() => store.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(), // snapshot harga
});

/* ======================
   PAYMENT (Midtrans)
   ====================== */
export const payment = pgTable("payment", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => order.id, { onDelete: "cascade" }),
  transactionId: text("transaction_id").notNull(), // dari Midtrans
  status: text("status").$defaultFn(() => "pending"), // pending, settlement, deny, expire, cancel
  grossAmount: numeric("gross_amount", { precision: 10, scale: 2 }).notNull(),
  paymentType: text("payment_type"), // e.g. bank_transfer, gopay
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/* ======================
   SYSTEM SETTINGS
   ====================== */
export const systemSettings = pgTable("system_settings", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
