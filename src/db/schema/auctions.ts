// auctions.ts
import { pgTable, text, varchar, timestamp, integer, numeric, primaryKey, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { products } from './products';

// Auction Status Enum
const auctionStatusEnum = ['open', 'closed', 'settled', 'cancelled'] as const;

// --- Auctions Table ---
export const auctions = pgTable('auctions', {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id').notNull().unique().references(() => products.id, { onDelete: 'cascade' }),
    sellerId: uuid('seller_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
    
    startPrice: numeric('start_price', { precision: 10, scale: 2 }).notNull(),
    currentPrice: numeric('current_price', { precision: 10, scale: 2 }).notNull(),
    
    startTime: timestamp('start_time').default(sql`now()`).notNull(),
    endTime: timestamp('end_time').notNull(), // Auction duration is defined here
    
    status: varchar('status', { length: 50, enum: auctionStatusEnum }).default('open').notNull(),
    totalBids: integer('total_bids').default(0).notNull(),
    
    // Winning bid details
    winningBidId: uuid('winning_bid_id'),
    winnerId: uuid('winner_id').references(() => users.id, { onDelete: 'set null' }),
    
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
});

// --- Bids Table ---
export const bids = pgTable('bids', {
    id: uuid('id').defaultRandom().primaryKey(),
    auctionId: uuid('auction_id').notNull().references(() => auctions.id, { onDelete: 'cascade' }),
    bidderId: uuid('bidder_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
    
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
    
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
});