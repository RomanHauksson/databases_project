CREATE TABLE "authors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text
);
--> statement-breakpoint
CREATE TABLE "book" (
	"isbn" char(13) PRIMARY KEY NOT NULL,
	"title" text
);
--> statement-breakpoint
CREATE TABLE "book_authors" (
	"author_id" serial NOT NULL,
	"isbn" char(13),
	CONSTRAINT "book_authors_author_id_isbn_pk" PRIMARY KEY("author_id","isbn")
);
--> statement-breakpoint
CREATE TABLE "book_loans" (
	"id" serial PRIMARY KEY NOT NULL,
	"isbn" char(13),
	"card_id" text,
	"address" text,
	"phone_number" text,
	"date_out" date,
	"due_date" date,
	"date_in" date
);
--> statement-breakpoint
CREATE TABLE "borrower" (
	"card_id" serial PRIMARY KEY NOT NULL,
	"isbn" char(9),
	"name" text,
	"address" text,
	"phone_number" text
);
--> statement-breakpoint
CREATE TABLE "fines" (
	"loan_id" serial PRIMARY KEY NOT NULL,
	"amount" numeric,
	"paid" boolean
);
