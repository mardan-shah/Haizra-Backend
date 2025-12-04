ALTER TABLE "users" ADD COLUMN "firstName" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "lastName" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "address" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "city" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "state" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "country" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "zipCode" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "username" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");