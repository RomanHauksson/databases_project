"use server";
import { db } from "@/db/db";
import { borrower, bookLoans, fines } from "@/db/schema";

import { eq, sql, not, inArray, and, or, isNull, like } from "drizzle-orm";

type Borrower = typeof borrower.$inferSelect;

/**
 * Generates a unique 8-character card ID in the format ID000001
 */
const generateCardId = async (): Promise<string> => {
  // Get all existing card IDs that match the pattern ID######
  const existingBorrowers = await db
    .select({ cardId: borrower.cardId })
    .from(borrower)
    .where(like(borrower.cardId, "ID%"));

  let maxNumber = 0;

  // Extract the numeric part from existing IDs and find the maximum
  for (const borrowerRecord of existingBorrowers) {
    const match = borrowerRecord.cardId.match(/^ID(\d{6})$/);
    if (match) {
      const number = parseInt(match[1], 10);
      if (number > maxNumber) {
        maxNumber = number;
      }
    }
  }

  // Generate the next sequential ID
  const nextNumber = maxNumber + 1;

  // Format as ID + 6-digit zero-padded number
  const cardId = `ID${String(nextNumber).padStart(6, "0")}`;

  // Safety check: ensure it's exactly 8 characters
  if (cardId.length !== 8) {
    throw new Error("Generated card ID is not 8 characters. Please try again.");
  }

  return cardId;
};

export const createBorrower = async ({
  ssn,
  name,
  address,
  phoneNumber,
}: Omit<Borrower, "cardId">) => {
  // Check if a borrower with the same SSN already exists
  const existing = await db
    .select()
    .from(borrower)
    .where(eq(borrower.ssn, ssn))
    .limit(1);

  if (existing.length > 0) {
    throw new Error("Invalid input: you already have a card");
  }

  // Generate a unique card ID
  const cardId = await generateCardId();

  // Insert new borrower
  const inserted = await db
    .insert(borrower)
    .values({
      cardId,
      ssn,
      name,
      address,
      phoneNumber,
    })
    .returning();

  // returning() always returns an array; return the row itself
  return inserted[0];
};

// See Vercel's docs on making cron jobs: https://vercel.com/docs/cron-jobs/quickstart?framework=nextjs-app

export const payBorrowerFines = async (
  borrowerCardId: Borrower["cardId"],
) => {
  // First, get all loan IDs for this borrower
  const loans = await db
    .select({ id: bookLoans.id })
    .from(bookLoans)
    .where(eq(bookLoans.borrowerCardId, borrowerCardId));

  if (loans.length === 0) {
    return;
  }

  const loanIds = loans.map((loan) => loan.id);

  // Update all unpaid fines for these loans to paid
  await db
    .update(fines)
    .set({ paid: true })
    .where(
      and(
        inArray(fines.loanId, loanIds),
        or(eq(fines.paid, false), isNull(fines.paid)),
      ),
    );
};

export const getBorrowerFines = async ({
  hidePaidFines = true,
}: {
  hidePaidFines?: boolean;
}): Promise<
  {
    borrowerCardId: Borrower["cardId"];
    totalAmount: number;
  }[]
> => {
  const baseQuery = db
    .select({
      borrowerCardId: bookLoans.borrowerCardId,
      totalAmount: sql<number>`COALESCE(SUM(${fines.amount}::numeric), 0)`,
    })
    .from(fines)
    .innerJoin(bookLoans, eq(fines.loanId, bookLoans.id));

  const filteredQuery = hidePaidFines
    ? baseQuery.where(not(fines.paid))
    : baseQuery;

  const result = await filteredQuery.groupBy(bookLoans.borrowerCardId);

  return result;
};

export const getFinesForBorrower = async (
  borrowerCardId: Borrower["cardId"],
  hidePaidFines = true,
): Promise<number> => {
  const baseQuery = db
    .select({
      totalAmount: sql<number>`COALESCE(SUM(${fines.amount}::numeric), 0)`,
    })
    .from(fines)
    .innerJoin(bookLoans, eq(fines.loanId, bookLoans.id))
    .where(
      hidePaidFines
        ? and(eq(bookLoans.borrowerCardId, borrowerCardId), not(fines.paid))
        : eq(bookLoans.borrowerCardId, borrowerCardId),
    );

  const result = await baseQuery;

  return Number(result[0]?.totalAmount || 0);
};
