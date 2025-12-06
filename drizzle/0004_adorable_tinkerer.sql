CREATE TYPE "public"."verification_status" AS ENUM('not_verified', 'pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('image', 'video');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending_payment', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('card', 'easypaisa', 'jazzcash', 'cash_on_delivery');--> statement-breakpoint
CREATE TYPE "public"."escrow_status" AS ENUM('held', 'released', 'refunded', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."payment_provider" AS ENUM('stripe', 'easypaisa', 'jazzcash', 'cod_internal');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'failed', 'refunded', 'held_in_escrow');--> statement-breakpoint
CREATE TABLE "storefronts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"store_name" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "storefronts_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "storefronts_store_name_unique" UNIQUE("store_name")
);
--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" serial PRIMARY KEY NOT NULL,
	"main_address" varchar(255) NOT NULL,
	"secondary_address" varchar(255),
	"city" varchar(100) NOT NULL,
	"state" varchar(100),
	"country" varchar(100) NOT NULL,
	"zip_code" varchar(20),
	"phone" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_addresses" (
	"user_id" integer NOT NULL,
	"address_id" integer NOT NULL,
	"address_type" varchar(20) NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	CONSTRAINT "user_addresses_user_id_address_id_address_type_pk" PRIMARY KEY("user_id","address_id","address_type")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "product_media" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"media_type" "media_type" NOT NULL,
	"url" varchar(512) NOT NULL,
	"watermark_key" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_media_watermark_key_unique" UNIQUE("watermark_key")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"seller_id" integer NOT NULL,
	"category_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "auctions" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"seller_id" integer NOT NULL,
	"start_price" numeric(10, 2) NOT NULL,
	"current_price" numeric(10, 2) NOT NULL,
	"start_time" timestamp DEFAULT now() NOT NULL,
	"end_time" timestamp NOT NULL,
	"status" varchar(50) DEFAULT 'open' NOT NULL,
	"winning_bid_id" integer,
	"winner_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "auctions_product_id_unique" UNIQUE("product_id")
);
--> statement-breakpoint
CREATE TABLE "bids" (
	"id" serial PRIMARY KEY NOT NULL,
	"auction_id" integer NOT NULL,
	"bidder_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"price_at_purchase" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"buyer_id" integer NOT NULL,
	"shipping_address_id" integer NOT NULL,
	"billing_address_id" integer,
	"status" "order_status" DEFAULT 'pending_payment' NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"receipt_url" varchar(512),
	"delivery_status" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"reviewer_id" integer NOT NULL,
	"review_target_type" varchar(20) NOT NULL,
	"target_seller_id" integer,
	"target_buyer_id" integer,
	"target_product_id" integer,
	"order_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"is_negative" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "escrow" (
	"id" serial PRIMARY KEY NOT NULL,
	"payment_id" integer NOT NULL,
	"release_at" timestamp,
	"status" "escrow_status",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "escrow_payment_id_unique" UNIQUE("payment_id")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"provider" "payment_provider" NOT NULL,
	"transaction_id" varchar(255),
	"status" "payment_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" SET DATA TYPE varchar(256);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "username" varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "first_name" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_name" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_picture_url" varchar(512);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "buyer_rating" numeric(3, 2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "seller_rating" numeric(3, 2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_verified_seller" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "id_verification_status" "verification_status" DEFAULT 'not_verified' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "cod_strikes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "storefronts" ADD CONSTRAINT "storefronts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_address_id_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auctions" ADD CONSTRAINT "auctions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auctions" ADD CONSTRAINT "auctions_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auctions" ADD CONSTRAINT "auctions_winner_id_users_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bids" ADD CONSTRAINT "bids_auction_id_auctions_id_fk" FOREIGN KEY ("auction_id") REFERENCES "public"."auctions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bids" ADD CONSTRAINT "bids_bidder_id_users_id_fk" FOREIGN KEY ("bidder_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_shipping_address_id_addresses_id_fk" FOREIGN KEY ("shipping_address_id") REFERENCES "public"."addresses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_billing_address_id_addresses_id_fk" FOREIGN KEY ("billing_address_id") REFERENCES "public"."addresses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_target_seller_id_users_id_fk" FOREIGN KEY ("target_seller_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_target_buyer_id_users_id_fk" FOREIGN KEY ("target_buyer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_target_product_id_products_id_fk" FOREIGN KEY ("target_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow" ADD CONSTRAINT "escrow_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "order_review_idx" ON "reviews" USING btree ("reviewer_id","order_id","review_target_type");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");