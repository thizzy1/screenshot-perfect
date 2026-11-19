import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

type ProductSpecs = Record<string, unknown>;

/** Mirrors the public.categories table. */
export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
});

/** Mirrors the public.products table; store ownership remains governed by Supabase RLS. */
export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").notNull(),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  specs: jsonb("specs").$type<ProductSpecs>().notNull().default({}),
  price: bigint("price", { mode: "number" }).notNull(),
  gender: text("gender").notNull().default("unisex"),
  collection: text("collection"),
  images: text("images").array().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});

/** Mirrors the public.product_variants table. */
export const productVariants = pgTable("product_variants", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  size: text("size").notNull(),
  stock: integer("stock").notNull().default(0),
});

/** Mirrors the public.orders table; customer/store records are defined by other modules. */
export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  checkoutId: uuid("checkout_id").notNull(),
  customerId: uuid("customer_id").notNull(),
  storeId: uuid("store_id").notNull(),
  status: text("status").notNull().default("pending_payment"),
  subtotal: bigint("subtotal", { mode: "number" }).notNull(),
  shippingFee: bigint("shipping_fee", { mode: "number" }).notNull().default(0),
  total: bigint("total", { mode: "number" }).notNull(),
  commission: bigint("commission", { mode: "number" }).notNull().default(0),
  shippingName: text("shipping_name").notNull(),
  shippingPhone: text("shipping_phone").notNull(),
  shippingAddress: text("shipping_address").notNull(),
  shippingCity: text("shipping_city").notNull(),
  shippingPostal: text("shipping_postal").notNull(),
  courier: text("courier").notNull(),
  paymentMethod: text("payment_method").notNull(),
  paymentChannel: text("payment_channel"),
  paymentRef: text("payment_ref"),
  paidAt: timestamp("paid_at", { withTimezone: true, mode: "string" }),
  trackingNumber: text("tracking_number"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});

/** Mirrors the public.order_items table. */
export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  size: text("size"),
  image: text("image"),
  price: bigint("price", { mode: "number" }).notNull(),
  quantity: integer("quantity").notNull(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  variants: many(productVariants),
  orderItems: many(orderItems),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
}));
