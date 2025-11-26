"use server";
import { db } from "@/db/db"
import {
    bookLoans,
    fines,
    book
} from "@/db/schema"
import { eq, isNull, and, sql, count } from "drizzle-orm"

export const checkOut = async (isbn13: string, borrowerCardId: string): Promise<void> => {
    try {
        // Check how many books the borrower currently has checked out
        const currentLoans = await db
            .select({ count: sql<number>`count(*)` })
            .from(bookLoans)
            .where(
                and(
                    eq(bookLoans.borrowerCardId, borrowerCardId),
                    isNull(bookLoans.dateIn)
                )
            );
        
        const currentCount = Number(currentLoans[0]?.count || 0);
        
        if (currentCount >= 3) {
            throw new Error(`Cannot check out more books. You already have ${currentCount} book(s) checked out. Maximum is 3.`);
        }
        
        const today = new Date();
        const dueDate = new Date(today);
        dueDate.setDate(dueDate.getDate() + 14);
        
        // Format date as YYYY-MM-DD using local timezone
        const formatDate = (date: Date): string => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        
        await db
        .insert(bookLoans)
        .values({
            bookIsbn13: isbn13,
            borrowerCardId: borrowerCardId,
            dateOut: formatDate(today),
            dueDate: formatDate(dueDate),
        });
    }
    catch (err)
    {
        console.error("Checkout error:", err);
        // Provide more detailed error message
        const errorMessage = err instanceof Error ? err.message : "Failed to check out book";
        throw new Error(`Failed to check out book: ${errorMessage}`);
    }
};

export const getCheckedOutBooks = async () => {
	const loans = await db
		.select({
			bookIsbn13: bookLoans.bookIsbn13,
			bookTitle: book.title,
			borrowerCardId: bookLoans.borrowerCardId,
			dateOut: bookLoans.dateOut,
			dueDate: bookLoans.dueDate,
		})
		.from(bookLoans)
		.innerJoin(book, eq(bookLoans.bookIsbn13, book.isbn13))
		.where(isNull(bookLoans.dateIn))
		.orderBy(bookLoans.dateOut);

	return loans;
};