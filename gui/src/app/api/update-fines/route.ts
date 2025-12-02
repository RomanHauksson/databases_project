import { and, eq, isNull, lt } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db/db";
import { bookLoans, fines } from "@/db/schema";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const truncateToUTCDate = (date: Date): Date =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );

const parseDateOnly = (value: string | Date | null): Date | null => {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return truncateToUTCDate(date);
};

const diffInDays = (later: Date, earlier: Date): number =>
  Math.floor(
    (truncateToUTCDate(later).getTime() -
      truncateToUTCDate(earlier).getTime()) /
      MS_PER_DAY,
  );

export const POST = async () => {
  try {
    const today = truncateToUTCDate(new Date());
    const todayISO = today.toISOString().slice(0, 10);

    const overdueWithoutFine = await db
      .select({ loanId: bookLoans.id })
      .from(bookLoans)
      .leftJoin(fines, eq(fines.loanId, bookLoans.id))
      .where(
        and(
          isNull(bookLoans.dateIn),
          lt(bookLoans.dueDate, todayISO),
          isNull(fines.loanId),
        ),
      );

    let insertedFines = 0;

    if (overdueWithoutFine.length) {
      await db.insert(fines).values(
        overdueWithoutFine.map(({ loanId }) => ({
          loanId,
          amount: "0.00",
          paid: false,
        })),
      );
      insertedFines = overdueWithoutFine.length;
    }

    const finesWithLoans = await db
      .select({
        loanId: fines.loanId,
        currentAmount: fines.amount,
        dateOut: bookLoans.dateOut,
        dueDate: bookLoans.dueDate,
        dateIn: bookLoans.dateIn,
      })
      .from(fines)
      .innerJoin(bookLoans, eq(bookLoans.id, fines.loanId));

    let updatedAmounts = 0;

    for (const fine of finesWithLoans) {
      const dateOut = parseDateOnly(fine.dateOut);
      const dueDate = parseDateOnly(fine.dueDate);
      const endDate = parseDateOnly(fine.dateIn) ?? today;

      if (!dateOut || !dueDate) {
        continue;
      }

      const totalDaysOut = Math.max(0, diffInDays(endDate, dateOut));
      const allowedDays = Math.max(0, diffInDays(dueDate, dateOut));
      const daysLate = Math.max(0, totalDaysOut - allowedDays);
      const newAmount = (daysLate * 0.25).toFixed(2);

      if (fine.currentAmount === newAmount) {
        continue;
      }

      await db
        .update(fines)
        .set({ amount: newAmount })
        .where(eq(fines.loanId, fine.loanId));
      updatedAmounts += 1;
    }

    return NextResponse.json({
      inserted: insertedFines,
      updated: updatedAmounts,
      timestamp: today.toISOString(),
    });
  } catch (error) {
    console.error("Failed to update fines", error);
    return NextResponse.json(
      { message: "Failed to update fines" },
      { status: 500 },
    );
  }
};
