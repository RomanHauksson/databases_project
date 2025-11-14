"use server";
import { db } from "@/db/db";
import { book, authors, bookAuthors, bookLoans } from "@/db/schema";
import { eq, ilike, isNull, sql } from "drizzle-orm";

export type BookResult = {
  title: string;
  isbn13: string;
  authorNames: string[];
  isCheckedOut: boolean;
};

export const searchBooks = async (
  searchTerm: string
): Promise<BookResult[]> => {
  if (searchTerm === "") {
    return [];
  }

  const books = await db
    .select({
      isbn13: book.isbn13,
      title: book.title,
    })
    .from(book)
    .where(ilike(book.title, `%${searchTerm}%`))
    .limit(50);

  // For each book, get authors and checkout status
  const booksWithDetails = await Promise.all(
    books.map(async (bookItem) => {
      // Get authors for this book
      const bookAuthorsResult = await db
        .select({
          authorName: authors.name,
        })
        .from(bookAuthors)
        .innerJoin(authors, eq(bookAuthors.authorId, authors.id))
        .where(eq(bookAuthors.bookIsbn13, bookItem.isbn13));

      const authorNames = bookAuthorsResult
        .map((ba) => ba.authorName)
        .filter((name): name is string => name !== null);

      // Check if the book is currently checked out (has a loan with no date_in)
      const activeLoans = await db
        .select()
        .from(bookLoans)
        .where(
          sql`${bookLoans.bookIsbn13} = ${bookItem.isbn13} AND ${bookLoans.dateIn} IS NULL`
        )
        .limit(1);

      const isCheckedOut = activeLoans.length > 0;

      return {
        title: bookItem.title ?? "",
        isbn13: bookItem.isbn13,
        authorNames,
        isCheckedOut,
      };
    })
  );

  return booksWithDetails;
};
