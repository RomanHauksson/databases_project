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

  const query = sql`SELECT
  ${book.isbn13},
  ${book.title},
  array_agg(${authors.name}) as author_names,
  BOOL_OR(${bookLoans.bookIsbn13} IS NOT NULL AND ${
    bookLoans.dateIn
  } IS NULL) as is_checked_out
FROM
  ${book} LEFT JOIN ${bookAuthors} ON ${book.isbn13} = ${bookAuthors.bookIsbn13}
  LEFT JOIN ${authors} ON ${bookAuthors.authorId} = ${authors.id}
  LEFT JOIN ${bookLoans} ON ${book.isbn13} = ${bookLoans.bookIsbn13}
WHERE
  ${book.title} ilike ${`%${searchTerm}%`}
  or ${book.isbn13} ilike ${`%${searchTerm}%`}
  or ${authors.name} ilike ${`%${searchTerm}%`}
GROUP BY ${book.isbn13}
LIMIT 50`;

  const result = await db.execute(query);
  return result.rows.map((row: any) => ({
    isbn13: row.isbn13,
    title: row.title,
    authorNames: row.author_names,
    isCheckedOut: row.is_checked_out,
  }));
};
