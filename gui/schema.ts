import {
  pgTable,
  text,
  char,
  serial,
  date,
  numeric,
  boolean,
  primaryKey,
} from "drizzle-orm/pg-core";

export const book = pgTable("book", {
  isbn: char("isbn", { length: 13 }).primaryKey(),
  title: text("title"),
});

export const bookAuthors = pgTable(
  "book_authors",
  {
    authorId: serial("author_id"),
    isbn: char("isbn", { length: 13 }),
  },
  (table) => [primaryKey({ columns: [table.authorId, table.isbn] })]
);

export const authors = pgTable("authors", {
  id: serial("id").primaryKey(),
  name: text("name"),
});

export const borrower = pgTable("borrower", {
  cardId: serial("card_id").primaryKey(),
  ssn: char("isbn", { length: 9 }),
  name: text("name"),
  address: text("address"),
  phoneNumber: text("phone_number"),
});

export const bookLoans = pgTable("book_loans", {
  id: serial("id").primaryKey(),
  isbn: char("isbn", { length: 13 }),
  cardId: text("card_id"),
  address: text("address"),
  phoneNumber: text("phone_number"),
  dateOut: date("date_out"),
  dueDate: date("due_date"),
  dateIn: date("date_in"),
});

export const fines = pgTable("fines", {
  loanId: serial("loan_id").primaryKey(),
  amount: numeric("amount"),
  paid: boolean(),
});
