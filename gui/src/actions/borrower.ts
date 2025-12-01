import { db } from "@/db/db"
import {
    borrower,
    bookLoans,
    fines,
} from "@/db/schema"

import { eq, sql, not } from "drizzle-orm";

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