"use server";
import { db } from "@/db/db";
import { book, authors, bookAuthors, bookLoans, borrower } from "@/db/schema";
import { eq, ilike, sql, or } from "drizzle-orm";

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
): Promise<BookLoan[]> => {};

export const checkIn = async (isbn13: string) => {};

type Borrower = typeof borrower.$inferSelect;

export const createBorrower = async ({
  ssn,
  name,
  address,
  phoneNumber,
}: Omit<Borrower, "cardId">) => {};

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
> => {};
