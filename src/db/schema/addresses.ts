// addresses.ts
import { pgTable, text, varchar, timestamp, integer, primaryKey, boolean, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { orders } from './orders';

// --- Addresses Table ---
// Stores physical address information, can be shared or reused.
export const addresses = pgTable('addresses', {
    id: uuid('id').defaultRandom().primaryKey(),
    mainAddress: varchar('main_address', { length: 255 }).notNull(),
    secondaryAddress: varchar('secondary_address', { length: 255 }),
    city: varchar('city', { length: 100 }).notNull(),
    state: varchar('state', { length: 100 }),
    country: varchar('country', { length: 100 }).notNull(),
    zipCode: varchar('zip_code', { length: 20 }),
    phone: varchar('phone', { length: 20 }), 
    
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
});

export const addressTypeEnum = ['shipping', 'billing', 'primary'] as const;

// --- User-Address Junction Table (Many-to-Many) ---
// Links users to addresses and defines the type of address.
export const userAddresses = pgTable('user_addresses', {
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    addressId: uuid('address_id').notNull().references(() => addresses.id, { onDelete: 'cascade' }),
    addressType: varchar('address_type', { length: 20, enum: addressTypeEnum }).notNull(),
    isDefault: boolean('is_default').default(false).notNull(), 
    label: varchar('label', { length: 50 }), // User-defined name for the address
}, (t) => ({
    pk: primaryKey({ columns: [t.userId, t.addressId, t.addressType] }),
}));
