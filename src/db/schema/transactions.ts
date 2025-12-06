// transactions.ts
import { pgTable, serial, varchar, timestamp, integer, decimal, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { orders } from './orders';

// --- Enums for Payment Status and Providers ---
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'failed', 'refunded', 'held_in_escrow']);
export const paymentProviderEnum = pgEnum('payment_provider', ['stripe', 'easypaisa', 'jazzcash', 'cod_internal']);

// --- Payments Table ---
// This table logs all payment transactions related to an order.
export const payments = pgTable('payments', {
    id: serial('id').primaryKey(),
    orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    provider: paymentProviderEnum('provider').notNull(),
    // The transaction ID from the external payment provider.
    transactionId: varchar('transaction_id', { length: 255 }),
    status: paymentStatusEnum('status').notNull(),
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
});

export const escrowStatusEnum = pgEnum('escrow_status', ['held', 'released', 'refunded', 'disputed']);

// --- Escrow Table ---
// Holds payments until the buyer confirms receipt or a return is settled.
export const escrow = pgTable('escrow', {
    id: serial('id').primaryKey(),
    paymentId: integer('payment_id').notNull().unique().references(() => payments.id, { onDelete: 'cascade' }),
    releaseAt: timestamp('release_at'), // When the funds are scheduled to be released
    status: escrowStatusEnum('status'),
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
});
