CREATE TABLE "book" (
	"isbn" char(13) PRIMARY KEY NOT NULL,
	"title" text
);
--> statement-breakpoint
DROP TABLE "demo_users" CASCADE;