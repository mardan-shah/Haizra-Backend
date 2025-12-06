import { relations } from 'drizzle-orm';
import { users, storefronts } from './users';
import { addresses, userAddresses } from './addresses';
import { products, productMedia, categories } from './products';
import { auctions, bids } from './auctions';
import { orders, orderItems } from './orders';
import { reviews } from './ratings';
import { payments, escrow } from './transactions';

// --- Users & Storefronts ---
export const usersRelations = relations(users, ({ many, one }) => ({
  userAddresses: many(userAddresses),
  storefront: one(storefronts, {
    fields: [users.id],
    references: [storefronts.userId],
  }),
  reviewsGiven: many(reviews, { relationName: 'reviewsGiven' }),
  reviewsAsSeller: many(reviews, { relationName: 'reviewsAsSeller' }),
  reviewsAsBuyer: many(reviews, { relationName: 'reviewsAsBuyer' }),
  bids: many(bids),
  auctionsWon: many(bids, { relationName: 'winningAuctions' })
}));

export const storefrontsRelations = relations(storefronts, ({ one }) => ({
    user: one(users, {
        fields: [storefronts.userId],
        references: [users.id],
    }),
}));

// --- Products & Categories ---
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  products: many(products),
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'categoryHierarchy'
  }),
  children: many(categories, {
    relationName: 'categoryHierarchy'
  })
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  seller: one(users, {
    fields: [products.sellerId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  media: many(productMedia),
  reviews: many(reviews),
  auction: one(auctions),
}));

export const productMediaRelations = relations(productMedia, ({ one }) => ({
  product: one(products, {
    fields: [productMedia.productId],
    references: [products.id],
  }),
}));

// --- Auctions & Bids ---
export const auctionsRelations = relations(auctions, ({ one, many }) => ({
    product: one(products, {
        fields: [auctions.productId],
        references: [products.id],
    }),
    seller: one(users, {
        fields: [auctions.sellerId],
        references: [users.id],
    }),
    winner: one(users, {
        fields: [auctions.winnerId],
        references: [users.id],
        relationName: 'winningAuctions',
    }),
    bids: many(bids),
}));

export const bidsRelations = relations(bids, ({ one }) => ({
    auction: one(auctions, {
        fields: [bids.auctionId],
        references: [auctions.id],
    }),
    bidder: one(users, {
        fields: [bids.bidderId],
        references: [users.id],
    }),
}));

// --- Orders ---
export const ordersRelations = relations(orders, ({ one, many }) => ({
  buyer: one(users, {
    fields: [orders.buyerId],
    references: [users.id],
  }),
  shippingAddress: one(addresses, {
    fields: [orders.shippingAddressId],
    references: [addresses.id],
    relationName: 'shippingAddress'
  }),
  billingAddress: one(addresses, {
    fields: [orders.billingAddressId],
    references: [addresses.id],
    relationName: 'billingAddress'
  }),
  items: many(orderItems),
  payments: many(payments), // Augmented from transactions logic
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
}));

// --- Ratings ---
export const reviewsRelations = relations(reviews, ({ one }) => ({
    reviewer: one(users, {
        fields: [reviews.reviewerId],
        references: [users.id],
        relationName: 'reviewsGiven',
    }),
    targetSeller: one(users, {
        fields: [reviews.targetSellerId],
        references: [users.id],
        relationName: 'reviewsAsSeller',
    }),
    targetBuyer: one(users, {
        fields: [reviews.targetBuyerId],
        references: [users.id],
        relationName: 'reviewsAsBuyer',
    }),
    targetProduct: one(products, {
        fields: [reviews.targetProductId],
        references: [products.id],
    }),
    order: one(orders, {
        fields: [reviews.orderId],
        references: [orders.id],
    }),
}));

// --- Transactions ---
export const paymentsRelations = relations(payments, ({ one }) => ({
    order: one(orders, {
        fields: [payments.orderId],
        references: [orders.id],
    }),
    escrow: one(escrow)
}));

export const escrowRelations = relations(escrow, ({ one }) => ({
    payment: one(payments, {
        fields: [escrow.paymentId],
        references: [payments.id],
    }),
}));

// --- Addresses ---
export const addressesRelations = relations(addresses, ({ many }) => ({
    userAddresses: many(userAddresses),
    shippingOrders: many(orders, { relationName: 'shippingAddress' }),
    billingOrders: many(orders, { relationName: 'billingAddress' }),
}));

export const userAddressesRelations = relations(userAddresses, ({ one }) => ({
    user: one(users, {
        fields: [userAddresses.userId],
        references: [users.id],
    }),
    address: one(addresses, {
        fields: [userAddresses.addressId],
        references: [addresses.id],
    }),
}));
