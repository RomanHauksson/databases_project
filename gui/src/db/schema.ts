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
  isbn13: char("isbn13", { length: 13 }).primaryKey(),
  title: text("title"),
});

export const authors = pgTable("authors", {
  id: serial("id").primaryKey(),
  name: text("name"),
});

export const bookAuthors = pgTable(
  "book_authors",
  {
    authorId: serial("author_id").references(() => authors.id),
    bookIsbn13: char("book_isbn13", { length: 13 }).references(
      () => book.isbn13
    ),
  },
  (table) => [primaryKey({ columns: [table.authorId, table.bookIsbn13] })]
);

export const borrower = pgTable("borrower", {
  cardId: char("card_id", { length: 8 }).primaryKey(),
  ssn: char("ssn", { length: 11 }),
  name: text("name"),
  address: text("address"),
  phoneNumber: text("phone_number"),
});

export const bookLoans = pgTable("book_loans", {
  id: serial("id").primaryKey(),
  bookIsbn13: char("book_isbn13", { length: 13 }).references(() => book.isbn13),
  borrowerCardId: char("borrower_card_id", { length: 8 }).references(
    () => borrower.cardId
  ),
  dateOut: date("date_out"),
  dueDate: date("due_date"),
  dateIn: date("date_in"),
});

export const fines = pgTable("fines", {
  loanId: serial("loan_id")
    .primaryKey()
    .references(() => bookLoans.id),
  amount: numeric("amount"), // TODO: change to fixed-precision with two decimal places
  paid: boolean(),
});
