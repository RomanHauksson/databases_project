import { eq, ilike, or } from "drizzle-orm";
import { db } from "@/db/db";
import { book, bookLoans, borrower } from "@/db/schema";

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

// export const checkIn = async (isbn13: string) => {};
