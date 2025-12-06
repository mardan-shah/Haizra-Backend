ALTER TABLE "users" ADD COLUMN "completed_buy_orders" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "completed_sell_orders" integer DEFAULT 0 NOT NULL;