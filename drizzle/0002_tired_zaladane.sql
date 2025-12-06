ALTER TABLE "users" DROP CONSTRAINT "users_email_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_username_unique";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "firstName";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "lastName";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "address";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "city";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "state";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "country";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "zipCode";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "phone";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "username";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "updated_at";