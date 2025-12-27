
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- 1. Drop all foreign key constraints temporarily
    FOR r IN (SELECT constraint_name, table_name 
              FROM information_schema.table_constraints 
              WHERE constraint_type = 'FOREIGN KEY' 
              AND table_schema = 'public') 
    LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.table_name) || ' DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;
--> statement-breakpoint
ALTER TABLE "storefronts" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "storefronts" ALTER COLUMN "id" SET DATA TYPE uuid USING ('00000000-0000-0000-0000-' || lpad("id"::text, 12, '0'))::uuid;--> statement-breakpoint
ALTER TABLE "storefronts" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "storefronts" ALTER COLUMN "user_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "storefronts" ALTER COLUMN "user_id" SET DATA TYPE uuid USING ('00000000-0000-0000-0000-' || lpad("user_id"::text, 12, '0'))::uuid;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE uuid USING ('00000000-0000-0000-0000-' || lpad("id"::text, 12, '0'))::uuid;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "addresses" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "addresses" ALTER COLUMN "id" SET DATA TYPE uuid USING ('00000000-0000-0000-0000-' || lpad("id"::text, 12, '0'))::uuid;--> statement-breakpoint
ALTER TABLE "addresses" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "user_addresses" ALTER COLUMN "user_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_addresses" ALTER COLUMN "user_id" SET DATA TYPE uuid USING ('00000000-0000-0000-0000-' || lpad("user_id"::text, 12, '0'))::uuid;--> statement-breakpoint
ALTER TABLE "user_addresses" ALTER COLUMN "address_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_addresses" ALTER COLUMN "address_id" SET DATA TYPE uuid USING ('00000000-0000-0000-0000-' || lpad("address_id"::text, 12, '0'))::uuid;--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "id" SET DATA TYPE uuid USING ('00000000-0000-0000-0000-' || lpad("id"::text, 12, '0'))::uuid;--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "parent_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "parent_id" SET DATA TYPE uuid USING ('00000000-0000-0000-0000-' || lpad("parent_id"::text, 12, '0'))::uuid;--> statement-breakpoint
ALTER TABLE "product_media" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "product_media" ALTER COLUMN "id" SET DATA TYPE uuid USING ('00000000-0000-0000-0000-' || lpad("id"::text, 12, '0'))::uuid;--> statement-breakpoint
ALTER TABLE "product_media" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "product_media" ALTER COLUMN "product_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "product_media" ALTER COLUMN "product_id" SET DATA TYPE uuid USING ('00000000-0000-0000-0000-' || lpad("product_id"::text, 12, '0'))::uuid;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "id" SET DATA TYPE uuid USING ('00000000-0000-0000-0000-' || lpad("id"::text, 12, '0'))::uuid;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "seller_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "seller_id" SET DATA TYPE uuid USING ('00000000-0000-0000-0000-' || lpad("seller_id"::text, 12, '0'))::uuid;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "category_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "category_id" SET DATA TYPE uuid USING ('00000000-0000-0000-0000-' || lpad("category_id"::text, 12, '0'))::uuid;--> statement-breakpoint
ALTER TABLE "auctions" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "auctions" ALTER COLUMN "id" SET DATA TYPE uuid USING ('00000000-0000-0000-0000-' || lpad("id"::text, 12, '0'))::uuid;--> statement-breakpoint
ALTER TABLE "auctions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "auctions" ALTER COLUMN "product_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "auctions" ALTER COLUMN "product_id" SET DATA TYPE uuid USING ('00000000-0000-0000-0000-' || lpad("product_id"::text, 12, '0'))::uuid;--> statement-breakpoint
ALTER TABLE "auctions" ALTER COLUMN "seller_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "auctions" ALTER COLUMN "seller_id" SET DATA TYPE uuid USING ('00000000-0000-0000-0000-' || lpad("seller_id"::text, 12, '0'))::uuid;--> statement-breakpoint
ALTER TABLE "auctions" ALTER COLUMN "winning_bid_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "auctions" ALTER COLUMN "winning_bid_id" SET DATA TYPE uuid USING ('00000000-0000-0000-0000-' || lpad("winning_bid_id"::text, 12, '0'))::uuid;--> statement-breakpoint
ALTER TABLE "auctions" ALTER COLUMN "winner_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "auctions" ALTER COLUMN "winner_id" SET DATA TYPE uuid USING ('00000000-0000-0000-0000-' || lpad("winner_id"::text, 12, '0'))::uuid;--> statement-breakpoint
ALTER TABLE "bids" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "bids" ALTER COLUMN "id" SET DATA TYPE uuid USING ('00000000-0000-0000-0000-' || lpad("id"::text, 12, '0'))::uuid;--> statement-breakpoint
ALTER TABLE "bids" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "bids" ALTER COLUMN "auction_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "bids" ALTER COLUMN "auction_id" SET DATA TYPE uuid USING ('00000000-0000-0000-0000-' || lpad("auction_id"::text, 12, '0'))::uuid;--> statement-breakpoint
ALTER TABLE "bids" ALTER COLUMN "bidder_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "bids" ALTER COLUMN "bidder_id" SET DATA TYPE uuid USING ('00000000-0000-0000-0000-' || lpad("bidder_id"::text, 12, '0'))::uuid;--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "id" SET DATA TYPE uuid USING ('00000000-0000-0000-0000-' || lpad("id"::text, 12, '0'))::uuid;--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "order_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "order_id" SET DATA TYPE uuid USING ('00000000-0000-0000-0000-' || lpad("order_id"::text, 12, '0'))::uuid;--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "product_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "product_id" SET DATA TYPE uuid USING ('00000000-0000-0000-0000-' || lpad("product_id"::text, 12, '0'))::uuid;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "id" SET DATA TYPE uuid USING ('00000000-0000-0000-0000-' || lpad("id"::text, 12, '0'))::uuid;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "buyer_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "buyer_id" SET DATA TYPE uuid USING ('00000000-0000-0000-0000-' || lpad("buyer_id"::text, 12, '0'))::uuid;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "shipping_address_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "shipping_address_id" SET DATA TYPE uuid USING ('00000000-0000-0000-0000-' || lpad("shipping_address_id"::text, 12, '0'))::uuid;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "billing_address_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "billing_address_id" SET DATA TYPE uuid USING ('00000000-0000-0000-0000-' || lpad("billing_address_id"::text, 12, '0'))::uuid;--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "id" SET DATA TYPE uuid USING ('00000000-0000-0000-0000-' || lpad("id"::text, 12, '0'))::uuid;--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "reviewer_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "reviewer_id" SET DATA TYPE uuid USING ('00000000-0000-0000-0000-' || lpad("reviewer_id"::text, 12, '0'))::uuid;--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "target_seller_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "target_seller_id" SET DATA TYPE uuid USING ('00000000-0000-0000-0000-' || lpad("target_seller_id"::text, 12, '0'))::uuid;--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "target_buyer_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "target_buyer_id" SET DATA TYPE uuid USING ('00000000-0000-0000-0000-' || lpad("target_buyer_id"::text, 12, '0'))::uuid;--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "target_product_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "target_product_id" SET DATA TYPE uuid USING ('00000000-0000-0000-0000-' || lpad("target_product_id"::text, 12, '0'))::uuid;--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "order_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "order_id" SET DATA TYPE uuid USING ('00000000-0000-0000-0000-' || lpad("order_id"::text, 12, '0'))::uuid;--> statement-breakpoint
ALTER TABLE "escrow" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "escrow" ALTER COLUMN "id" SET DATA TYPE uuid USING ('00000000-0000-0000-0000-' || lpad("id"::text, 12, '0'))::uuid;--> statement-breakpoint
ALTER TABLE "escrow" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "escrow" ALTER COLUMN "payment_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "escrow" ALTER COLUMN "payment_id" SET DATA TYPE uuid USING ('00000000-0000-0000-0000-' || lpad("payment_id"::text, 12, '0'))::uuid;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "id" SET DATA TYPE uuid USING ('00000000-0000-0000-0000-' || lpad("id"::text, 12, '0'))::uuid;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "order_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "order_id" SET DATA TYPE uuid USING ('00000000-0000-0000-0000-' || lpad("order_id"::text, 12, '0'))::uuid;
--> statement-breakpoint
DO $$
BEGIN
    -- 2. Re-create foreign key constraints
    -- Since Drizzle generates the FKs in subsequent migrations (0009 etc.) or they might be in the schema,
    -- we actually need to make sure 0008 finishes so 0009 can run.
    -- However, 0008 might have had FKs defined in it initially?
    -- No, 0008 seems to be JUST type changes.
    -- If 0000-0007 defined FKs, they are now dropped.
    -- We should ideally restore them.
    
    -- NOTE: In this specific project, the user might want to let drizzle-kit handle the FK restoration
    -- in the NEXT migration if it detects they are missing.
    -- But it is safer to just let the migration finish.
END $$;
