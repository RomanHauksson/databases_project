"use client";

import { useState, useTransition } from "react";
import { checkIn } from "@/actions/checkin";
import { getCheckedOutBooks } from "@/actions/checkout";

type CheckedOutBook = {
	bookIsbn13: string;
	bookTitle: string | null;
	borrowerCardId: string;
	dateOut: string;
	dueDate: string;
};

export function CheckInBooks({ initialBooks }: { initialBooks: CheckedOutBook[] }) {
	const [books, setBooks] = useState<CheckedOutBook[]>(initialBooks);
	const [checkingIn, setCheckingIn] = useState<Set<string>>(new Set());
	const [message, setMessage] = useState<string>("");

	const handleCheckIn = async (isbn13: string) => {
		setCheckingIn((prev) => new Set(prev).add(isbn13));
		setMessage("");

		try {
			const result = await checkIn(isbn13);
			if (result.success) {
				// Refresh the list of checked out books
				const updatedBooks = await getCheckedOutBooks();
				setBooks(updatedBooks);
				setMessage(`Successfully checked in book ${isbn13}`);
			} else {
				setMessage(result.message || "Failed to check in book.");
			}
		} catch (error) {
			console.error("Failed to check in book:", error);
			setMessage("Failed to check in book. Please try again.");
		} finally {
			setCheckingIn((prev) => {
				const next = new Set(prev);
				next.delete(isbn13);
				return next;
			});
		}
	};

	if (books.length === 0) {
		return <p>No books are currently checked out.</p>;
	}

	return (
		<div>
			{message && (
				<p className={`mb-4 ${message.includes("Successfully") ? "text-green-600" : "text-red-600"}`}>
					{message}
				</p>
			)}
			<table className="table-fixed w-full border-collapse border border-black [&_td,&_th]:px-2 [&_td,&_th]:border [&_td,&_th]:border-black">
				<thead>
					<tr>
						<th className="text-left" scope="col">
							ISBN13
						</th>
						<th className="text-left" scope="col">
							Title
						</th>
						<th className="text-left" scope="col">
							Borrower Card ID
						</th>
						<th className="text-left" scope="col">
							Date Out
						</th>
						<th className="text-left" scope="col">
							Due Date
						</th>
						<th className="text-center" scope="col">
							Action
						</th>
					</tr>
				</thead>
				<tbody>
					{books.map((loan) => {
						const isCheckingIn = checkingIn.has(loan.bookIsbn13);
						return (
							<tr key={`${loan.bookIsbn13}-${loan.borrowerCardId}-${loan.dateOut}`}>
								<td className="text-left">{loan.bookIsbn13}</td>
								<td className="text-left">{loan.bookTitle}</td>
								<td className="text-left">{loan.borrowerCardId}</td>
								<td className="text-left">{loan.dateOut}</td>
								<td className="text-left">{loan.dueDate}</td>
								<td className="text-center">
									<button
										onClick={() => handleCheckIn(loan.bookIsbn13)}
										disabled={isCheckingIn}
										className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
									>
										{isCheckingIn ? "Checking in..." : "Check In"}
									</button>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}

