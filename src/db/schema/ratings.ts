// ratings.ts
import { pgTable, text, varchar, timestamp, integer, primaryKey, boolean, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { products } from './products';
import { orders } from './orders';

// Rating Target Enum (for future flexibility)
const reviewTargetEnum = ['buyer', 'seller', 'product'] as const;

// --- Reviews Table ---
export const reviews = pgTable('reviews', {
    id: uuid('id').defaultRandom().primaryKey(),
    
    // Who is reviewing who/what
    reviewerId: uuid('reviewer_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
    reviewTargetType: varchar('review_target_type', { length: 20, enum: reviewTargetEnum }).notNull(),
    
    // The subject of the review (either seller, buyer, or product)
    targetSellerId: uuid('target_seller_id').references(() => users.id, { onDelete: 'set null' }), // When reviewing a seller
    targetBuyerId: uuid('target_buyer_id').references(() => users.id, { onDelete: 'set null' }), // When reviewing a buyer
    targetProductId: uuid('target_product_id').references(() => products.id, { onDelete: 'set null' }), // When reviewing a product
    
    // Required context for the review
    orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    
    rating: integer('rating').notNull(), // 1 to 5 scale
    comment: text('comment'),
    isNegative: boolean('is_negative').default(false).notNull(), // Simplified "negative review section"
    
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
}, (t) => ({
    // Ensures a user can only review a specific order once
    uniqueOrderReview: uniqueIndex('order_review_idx').on(t.reviewerId, t.orderId, t.reviewTargetType), 
}));