"use server";
import { db } from "@/db/db";
import { book } from "@/db/schema";
import { eq } from "drizzle-orm";

export const searchBooks = async (searchTerm: string) => {
  const books = await db
    .select()
    .from(book)
    .where(eq(book.isbn13, "9780001047976"));

  return books;
};
