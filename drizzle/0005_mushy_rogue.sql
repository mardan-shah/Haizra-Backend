ALTER TABLE "users" ADD COLUMN "name" varchar(200);--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "parent_id" integer;--> statement-breakpoint
CREATE INDEX "username_idx" ON "users" USING btree ("username");--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "first_name";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "last_name";