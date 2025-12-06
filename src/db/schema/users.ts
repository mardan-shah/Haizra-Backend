import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  decimal,
  pgEnum,
  index,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const verificationStatusEnum = pgEnum('verification_status', [
  'not_verified',
  'pending',
  'verified',
  'rejected',
]);

// --- Users Table ---
// This table holds all user account and profile data.
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 256 }).notNull().unique(),
  username: varchar('username', { length: 64 }).notNull().unique(),
  password: text('password').notNull(), // Hashed password
  name: varchar('name', { length: 200 }), // Combined name
  phone: varchar('phone', { length: 20 }),
  profilePictureUrl: varchar('profile_picture_url', { length: 512 }),
  
  // Ratings and Seller Status
  buyerRating: decimal('buyer_rating', { precision: 3, scale: 2 }).default('0.00'),
  sellerRating: decimal('seller_rating', { precision: 3, scale: 2 }).default('0.00'),
  isVerifiedSeller: boolean('is_verified_seller').default(false).notNull(),
  idVerificationStatus: verificationStatusEnum('id_verification_status').default('not_verified').notNull(),
  
  // Cash on Delivery specific
  codStrikes: integer('cod_strikes').default(0).notNull(),

  // Order Stats
  completedBuyOrders: integer('completed_buy_orders').default(0).notNull(),
  completedSellOrders: integer('completed_sell_orders').default(0).notNull(),

  createdAt: timestamp('created_at').default(sql`now()`).notNull(),
  updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
}, (table) => ({
  usernameIdx: index('username_idx').on(table.username),
}));

// --- Storefronts Table ---
// A dedicated storefront for a verified seller (1-to-1 with users).
export const storefronts = pgTable('storefronts', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
    storeName: varchar('store_name', { length: 255 }).notNull().unique(),
    description: text('description'),
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
});