"use server";
import { eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db/db";
import { authors, book, bookAuthors, bookLoans } from "@/db/schema";

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
