import {
  mysqlTable as pgTable,
  text,
  timestamp,
  boolean,
  decimal as numeric,
  int as integer,
  varchar,
} from "drizzle-orm/mysql-core";

/* ======================
   AUTH -> better-auth generated
   ====================== */

export const user = pgTable("user", {
  id: varchar("id", { length: 191 }).primaryKey(),
  name: text("name").notNull(),
  email: varchar("email", { length: 191 }).notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  // Admin plugin fields
  role: text("role").default("user"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
});

export const session = pgTable("session", {
  id: varchar("id", { length: 191 }).primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: varchar("token", { length: 191 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: varchar("user_id", { length: 191 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  // Admin plugin field
  impersonatedBy: text("impersonated_by"),
});

export const account = pgTable("account", {
  id: varchar("id", { length: 191 }).primaryKey(),
  accountId: varchar("account_id", { length: 191 }).notNull(),
  providerId: varchar("provider_id", { length: 191 }).notNull(),
  userId: varchar("user_id", { length: 191 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const verification = pgTable("verification", {
  id: varchar("id", { length: 191 }).primaryKey(),
  identifier: varchar("identifier", { length: 191 }).notNull(),
  value: varchar("value", { length: 191 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* ======================
   STORE & PRODUCT
   ====================== */
export const store = pgTable("store", {
  id: varchar("id", { length: 191 }).primaryKey(),
  ownerId: varchar("owner_id", { length: 191 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 191 }).notNull().unique(), // /store/[slug]
  areaId: text("area_id"),
  description: text("description"),
  logo: text("logo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const product = pgTable("product", {
  id: varchar("id", { length: 191 }).primaryKey(),
  storeId: varchar("store_id", { length: 191 })
    .notNull()
    .references(() => store.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 191 }).notNull().unique(), // /product/[slug]
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
  id: varchar("id", { length: 191 }).primaryKey(),
  userId: varchar("user_id", { length: 191 })
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
  id: varchar("id", { length: 191 }).primaryKey(),
  userId: varchar("user_id", { length: 191 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const cartItem = pgTable("cart_item", {
  id: varchar("id", { length: 191 }).primaryKey(),
  cartId: varchar("cart_id", { length: 191 })
    .notNull()
    .references(() => cart.id, { onDelete: "cascade" }),
  productId: varchar("product_id", { length: 191 })
    .notNull()
    .references(() => product.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull(),
});

/* ======================
   ORDER
   ====================== */
export const order = pgTable("order", {
  id: varchar("id", { length: 191 }).primaryKey(),
  buyerId: varchar("buyer_id", { length: 191 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  addressId: varchar("address_id", { length: 191 })
    .notNull()
    .references(() => address.id, { onDelete: "restrict" }),
  status: text("status").$defaultFn(() => "pending"), // pending, paid, shipped, completed, cancelled
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  serviceFee: numeric("service_fee", { precision: 10, scale: 2 })
    .notNull()
    .default("0.00"),
  buyerServiceFee: numeric("buyer_service_fee", { precision: 10, scale: 2 })
    .notNull()
    .default("0.00"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orderItem = pgTable("order_item", {
  id: varchar("id", { length: 191 }).primaryKey(),
  orderId: varchar("order_id", { length: 191 })
    .notNull()
    .references(() => order.id, { onDelete: "cascade" }),
  productId: varchar("product_id", { length: 191 })
    .notNull()
    .references(() => product.id, { onDelete: "cascade" }),
  storeId: varchar("store_id", { length: 191 })
    .notNull()
    .references(() => store.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(), // snapshot harga
});

/* ======================
   PAYMENT (Midtrans)
   ====================== */
export const payment = pgTable("payment", {
  id: varchar("id", { length: 191 }).primaryKey(),
  orderId: varchar("order_id", { length: 191 })
    .notNull()
    .references(() => order.id, { onDelete: "cascade" }),
  transactionId: varchar("transaction_id", { length: 191 }).notNull(), // dari Midtrans
  status: text("status").$defaultFn(() => "pending"), // pending, settlement, deny, expire, cancel
  grossAmount: numeric("gross_amount", { precision: 10, scale: 2 }).notNull(),
  paymentType: varchar("payment_type", { length: 191 }), // e.g. bank_transfer, gopay
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/* ======================
   SYSTEM SETTINGS
   ====================== */
export const systemSettings = pgTable("system_settings", {
  id: varchar("id", { length: 191 }).primaryKey(),
  key: varchar("key", { length: 191 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
