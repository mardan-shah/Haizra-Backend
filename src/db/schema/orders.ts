// orders.ts
import { pgTable, varchar, timestamp, integer, decimal, pgEnum, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { addresses } from './addresses';
import { products } from './products';

// --- Enums for Order Status and Payment ---
export const orderStatusEnum = pgEnum('order_status', [
  'pending_payment',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
  'disputed'
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'card',
  'easypaisa',
  'jazzcash',
  'cash_on_delivery',
]);

// --- Orders Table ---
// This table tracks a customer's purchase from a seller.
export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  buyerId: uuid('buyer_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  
  // Storing both shipping and billing addresses.
  shippingAddressId: uuid('shipping_address_id').notNull().references(() => addresses.id, { onDelete: 'restrict' }),
  billingAddressId: uuid('billing_address_id').references(() => addresses.id, { onDelete: 'restrict' }),

  status: orderStatusEnum('status').default('pending_payment').notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  
  receiptUrl: varchar('receipt_url', { length: 512 }),
  deliveryStatus: varchar('delivery_status', {length: 255}), 

  createdAt: timestamp('created_at').default(sql`now()`).notNull(),
  updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
});

// --- Order Items Table ---
// A junction table linking products to an order.
export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  quantity: integer('quantity').notNull(),
  // Records the price at the time of purchase to avoid issues with future price changes.
  priceAtPurchase: decimal('price_at_purchase', { precision: 10, scale: 2 }).notNull(),
});