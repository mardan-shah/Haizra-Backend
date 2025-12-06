// products.ts
import { pgTable, serial, text, varchar, timestamp, integer, decimal, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

// --- Categories Table ---
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  description: text('description'),
  parentId: integer('parent_id'), // Self-reference for subcategories
});

// --- Products Table ---
// Represents items for sale or auction.
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(), // For direct sale
  sellerId: integer('seller_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  categoryId: integer('category_id').references(() => categories.id, { onDelete: 'set null' }),
  
  createdAt: timestamp('created_at').default(sql`now()`).notNull(),
  updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
});

// --- Product Media Table ---
// Stores images and videos for products.
export const mediaTypeEnum = pgEnum('media_type', ['image', 'video']);

export const productMedia = pgTable('product_media', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  mediaType: mediaTypeEnum('media_type').notNull(),
  url: varchar('url', { length: 512 }).notNull(),
  // A unique key to prevent duplicate uploads and for applying watermarks.
  watermarkKey: varchar('watermark_key', { length: 255 }).unique().notNull(),
  createdAt: timestamp('created_at').default(sql`now()`).notNull(),
});