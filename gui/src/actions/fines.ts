import { db } from "@/db/db"
import { 
    bookLoans, 
    book, 
    fines} from "@/db/schema"

import { eq, and, sql } from "drizzle-orm";
import { isNull } from "drizzle-orm";


export type FineResult = {
  loanId: number;
  fineAmt: string | null;
  paid: boolean | null;
  bookTitle: string | null;
  dateOut: string;
  dueDate: string;
  dateIn: string | null;
  totalFines: number;
};


export async function getBorrowerFines(
  cardId: string,
  includePaid = false
): Promise<FineResult[]> {

  // cardId stays a STRING because borrower_card_id is char(8)
  const conditions = [eq(bookLoans.borrowerCardId, cardId)];

  if (!includePaid) {
    conditions.push(eq(fines.paid, false));
  }

  const rows = await db
    .select({
      loanId: bookLoans.id,
      fineAmt: fines.amount,
      paid: fines.paid,
      bookTitle: book.title,
      dateOut: bookLoans.dateOut,
      dueDate: bookLoans.dueDate,
      dateIn: bookLoans.dateIn,

      totalFines: sql<number>`
        SUM(${fines.amount})
        OVER (PARTITION BY ${bookLoans.borrowerCardId})
      `,
    })
    .from(bookLoans)
    .innerJoin(fines, eq(fines.loanId, bookLoans.id))
    .innerJoin(book, eq(bookLoans.bookIsbn13, book.isbn13))
    .where(and(...conditions))
    .orderBy(bookLoans.id);

  return rows;
}



export async function payFines(id: number) {
  // Checks for row Borrower ID for fines
  
  const stillOut = await db
    .select()
    .from(bookLoans)

    .where(and(eq(bookLoans.id, id), isNull(bookLoans.dateIn)));

  if (stillOut.length > 0) {
    throw new Error("Cannot pay fines for books that are still checked out.");
  }
  

  // Pay all unpaid fines
await db
  .update(fines)
  .set({ paid: true })
  .where(
    and(
      eq(fines.paid, false),
      sql`loan_id IN (SELECT id FROM book_loans WHERE borrower_card_id = ${id})`
    )
  );
}


export async function refreshFines() {
  const loans = await db
    .select()
    .from(bookLoans)
    .where(
      sql`
        (date_in > due_date)
        OR (date_in IS NULL AND NOW() > due_date)
      `
    );

for (const loan of loans) {
  const today = new Date();

  // Convert both date fields from string → JS Date
  const dueDate = new Date(loan.dueDate);
  const dateIn = loan.dateIn ? new Date(loan.dateIn) : today;

  const daysLate = Math.ceil(
    (dateIn.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const fineAmount = daysLate > 0 ? daysLate * 0.25 : 0.0;

  const existingRows = await db
  .select()
  .from(fines)
  .where(eq(fines.loanId, loan.id))
  //.limit(1); optional to only return 1 value

  const existing = existingRows[0]; // undefined if no row


  if (!existing) {
    // Create a new fine entry if one does not yet exist
    await db.insert(fines).values({
      loanId: loan.id,          // correct
      amount: fineAmount.toFixed(2), // must match schema
      paid: false,
    });
    continue;
  }
  // Update existing fine if amount has changed and not yet paid
    if (existing.paid === true) continue;
    if (Number(existing.amount) !== fineAmount) {
      await db
        .update(fines)
        .set({ amount: fineAmount.toFixed(2) })
        .where(eq(fines.loanId, loan.id));
    }
  }
}
