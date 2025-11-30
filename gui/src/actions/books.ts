"use server";
import { db } from "@/db/db";
import {
	book,
	authors,
	bookAuthors,
	bookLoans,
	borrower,
	fines,
} from "@/db/schema";
import { eq, ilike, sql, or, not } from "drizzle-orm";

type Book = typeof book.$inferSelect;
type Authors = typeof authors.$inferSelect;

export type BookResult = Book & {
	authorNames: Authors["name"][];
	isCheckedOut: boolean;
	numResults: number;
};

export const searchBooks = async (
	searchTerm: string,
): Promise<BookResult[]> => {
	if (searchTerm === "") {
		return [];
	}

	const books = await db
		.select({
			isbn13: book.isbn13,
			title: book.title,
			authorNames: sql<string[]>`array_agg(${authors.name})`,
			isCheckedOut: sql<boolean>`BOOL_OR(${bookLoans.bookIsbn13} IS NOT NULL AND ${bookLoans.dateIn} IS NULL)`,
			numResults: sql<number>`COUNT(*) OVER()`,
		})
		.from(book)
		.leftJoin(bookAuthors, eq(book.isbn13, bookAuthors.bookIsbn13))
		.leftJoin(authors, eq(bookAuthors.authorId, authors.id))
		.leftJoin(bookLoans, eq(book.isbn13, bookLoans.bookIsbn13))
		.where(
			or(
				ilike(book.title, `%${searchTerm}%`),
				ilike(book.isbn13, `%${searchTerm}%`),
				ilike(authors.name, `%${searchTerm}%`),
			),
		)
		.groupBy(book.isbn13)
		.limit(50);

	return books;
};

export const checkOut = async (isbn13: string, borrowerCardId: string) => {};

type BookLoan = typeof bookLoans.$inferSelect;

export const searchBookLoans = async (
	searchTerm: string,
): Promise<BookLoan[]> => {
	if (searchTerm === "") {
		return [];
	}

	const loans = await db
		.select({
			id: bookLoans.id,
			bookIsbn13: bookLoans.bookIsbn13,
			borrowerCardId: bookLoans.borrowerCardId,
			dateOut: bookLoans.dateOut,
			dueDate: bookLoans.dueDate,
			dateIn: bookLoans.dateIn,
		})
		.from(bookLoans)
		.leftJoin(book, eq(bookLoans.bookIsbn13, book.isbn13))
		.leftJoin(borrower, eq(bookLoans.borrowerCardId, borrower.cardId))
		.where(
			or(
				ilike(bookLoans.bookIsbn13, `%${searchTerm}%`),
				ilike(book.title, `%${searchTerm}%`),
				ilike(bookLoans.borrowerCardId, `%${searchTerm}%`),
				ilike(borrower.name, `%${searchTerm}%`),
			),
		)
		.limit(50);

	return loans;
};

export const checkIn = async (isbn13: string) => {};

type Borrower = typeof borrower.$inferSelect;

export const createBorrower = async ({
	ssn,
	name,
	address,
	phoneNumber,
}: Omit<Borrower, "cardId">) => {
	try {
        // Insert borrower and return the created row
        const result = await db
            .insert(borrower)
            .values({
                ssn,
                name,
                address,
                phoneNumber,
            })
            .returning();

        // result[0] contains the new borrower record, including the generated cardId
        return result[0];
    } catch (error: any) {
        // Drizzle/Postgres unique violation error code
        if (error.code === "23505") {
            // This means UNIQUE constraint failed (likely SSN)
            throw new Error("Invalid input: borrower already has a card");
        }

        // Unexpected error, rethrow
        throw error;
    }};  

// See Vercel's docs on making cron jobs: https://vercel.com/docs/cron-jobs/quickstart?framework=nextjs-app

export const payBorrowerFines = async (
	borrowerCardId: Borrower["cardId"],
) => {};

export const getBorrowerFines = async ({
	hidePaidFines = true,
}: {
	hidePaidFines?: boolean;
}): Promise<
	{
		borrowerCardId: Borrower["cardId"];
		totalAmount: number;
	}[]
> => {
	const baseQuery = db
		.select({
			borrowerCardId: bookLoans.borrowerCardId,
			totalAmount: sql<number>`COALESCE(SUM(${fines.amount}::numeric), 0)`,
		})
		.from(fines)
		.innerJoin(bookLoans, eq(fines.loanId, bookLoans.id));

	const filteredQuery = hidePaidFines
		? baseQuery.where(not(fines.paid))
		: baseQuery;

	const result = await filteredQuery.groupBy(bookLoans.borrowerCardId);

	return result;
};
