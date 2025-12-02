"use server";
import { db } from "@/db/db";
import {
    bookLoans,
    book,
    borrower
} from "@/db/schema";

import { eq, ilike, or, and, isNull } from "drizzle-orm";

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

export const checkIn = async (isbn13: string) => {
	try {
		const activeLoan = await db
			.select()
			.from(bookLoans)
			.where(
				and(
					eq(bookLoans.bookIsbn13, isbn13),
					isNull(bookLoans.dateIn)
				)
			)
			.limit(1);

		if (activeLoan.length === 0) {
			return { success: false, message: "No active loan found for this book." };
		}

		// Format date as YYYY-MM-DD using local timezone (same standard as checkout.ts)
		const today = new Date();
		const formatDate = (date: Date): string => {
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			return `${year}-${month}-${day}`;
		};

		await db
			.update(bookLoans)
			.set({ dateIn: formatDate(today) })
			.where(eq(bookLoans.id, activeLoan[0].id));

		return { success: true };
	} catch (err) {
		console.error("Check-in error:", err);
		const errorMessage = err instanceof Error ? err.message : "Failed to check in book";
		return { success: false, message: errorMessage };
	}
};
