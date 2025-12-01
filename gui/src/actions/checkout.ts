"use server";
import { db } from "@/db/db"
import {
    bookLoans,
    fines,
    book
} from "@/db/schema"
import { eq, isNull, and, sql, count, or } from "drizzle-orm"

export const checkOut = async (isbn13: string, borrowerCardId: string): Promise<void> => {
    try {
        // Constraint 1: Check if the book is already checked out by another borrower
        const bookAlreadyCheckedOut = await db
            .select()
            .from(bookLoans)
            .where(
                and(
                    eq(bookLoans.bookIsbn13, isbn13),
                    isNull(bookLoans.dateIn)
                )
            )
            .limit(1);
        
        if (bookAlreadyCheckedOut.length > 0) {
            throw new Error(`This book is already checked out by another borrower and cannot be checked out at this time.`);
        }

        // Constraint 2: Check if the borrower has any unpaid fines
        const borrowerFines = await db
            .select()
            .from(fines)
            .innerJoin(bookLoans, eq(fines.loanId, bookLoans.id))
            .where(
                and(
                    eq(bookLoans.borrowerCardId, borrowerCardId),
                    or(
                        eq(fines.paid, false),
                        isNull(fines.paid)
                    )
                )
            )
            .limit(1);
        
        if (borrowerFines.length > 0) {
            throw new Error(`Cannot check out books. You have unpaid fines that must be paid first.`);
        }

        // Constraint 3: Check how many books the borrower currently has checked out (max 3)
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