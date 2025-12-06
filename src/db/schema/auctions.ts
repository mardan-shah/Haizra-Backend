// auctions.ts
import { pgTable, serial, text, varchar, timestamp, integer, numeric, primaryKey } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { products } from './products';

// Auction Status Enum
const auctionStatusEnum = ['open', 'closed', 'settled', 'cancelled'] as const;

// --- Auctions Table ---
export const auctions = pgTable('auctions', {
    id: serial('id').primaryKey(),
    productId: integer('product_id').notNull().unique().references(() => products.id, { onDelete: 'cascade' }),
    sellerId: integer('seller_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
    
    startPrice: numeric('start_price', { precision: 10, scale: 2 }).notNull(),
    currentPrice: numeric('current_price', { precision: 10, scale: 2 }).notNull(),
    
    startTime: timestamp('start_time').default(sql`now()`).notNull(),
    endTime: timestamp('end_time').notNull(), // Auction duration is defined here
    
    status: varchar('status', { length: 50, enum: auctionStatusEnum }).default('open').notNull(),
    totalBids: integer('total_bids').default(0).notNull(),
    
    // Winning bid details
    winningBidId: integer('winning_bid_id'),
    winnerId: integer('winner_id').references(() => users.id, { onDelete: 'set null' }),
    
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
});

// --- Bids Table ---
export const bids = pgTable('bids', {
    id: serial('id').primaryKey(),
    auctionId: integer('auction_id').notNull().references(() => auctions.id, { onDelete: 'cascade' }),
    bidderId: integer('bidder_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
    
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
    
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
});