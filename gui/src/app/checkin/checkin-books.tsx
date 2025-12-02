"use client";

import { useState } from "react";
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
	const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set());
	const [checkingIn, setIsCheckingIn] = useState(false);
	const [message, setMessage] = useState<string>("");

	const handleCheckboxChange = (isbn13: string, checked: boolean) => {
		setSelectedBooks((prev) => {
			const next = new Set(prev);
			if (checked) {
				// Enforce maximum of 3 selections
				if (next.size >= 3) {
					setMessage("You can only select up to 3 books at a time.");
					return prev;
				}
				next.add(isbn13);
			} else {
				next.delete(isbn13);
			}
			setMessage("");
			return next;
		});
	};

	const handleBatchCheckIn = async () => {
		if (selectedBooks.size === 0) {
			setMessage("Please select at least one book to check in.");
			return;
		}

		if (selectedBooks.size > 3) {
			setMessage("You can only check in up to 3 books at a time.");
			return;
		}

		setIsCheckingIn(true);
		setMessage("");

		try {
			const isbn13s = Array.from(selectedBooks);
			const results = await Promise.all(
				isbn13s.map((isbn13) => checkIn(isbn13))
			);

			const successful = results.filter((r) => r.success);
			const failed = results.filter((r) => !r.success);

			if (successful.length === isbn13s.length) {
				setMessage(`Successfully checked in ${successful.length} book(s).`);
			} else if (successful.length > 0) {
				setMessage(
					`Successfully checked in ${successful.length} book(s). ${failed.length} failed.`
				);
			} else {
				setMessage("Failed to check in books. Please try again.");
			}

			// Refresh the list of checked out books
			const updatedBooks = await getCheckedOutBooks();
			setBooks(updatedBooks);
			setSelectedBooks(new Set());
		} catch (error) {
			console.error("Failed to check in books:", error);
			setMessage("Failed to check in books. Please try again.");
		} finally {
			setIsCheckingIn(false);
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
						<th className="text-center" scope="col">
							Select
						</th>
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
					</tr>
				</thead>
				<tbody>
					{books.map((loan) => {
						const isSelected = selectedBooks.has(loan.bookIsbn13);
						return (
							<tr key={`${loan.bookIsbn13}-${loan.borrowerCardId}-${loan.dateOut}`}>
								<td className="text-center">
									<input
										type="checkbox"
										checked={isSelected}
										onChange={(e) => handleCheckboxChange(loan.bookIsbn13, e.target.checked)}
										disabled={checkingIn}
									/>
								</td>
								<td className="text-left">{loan.bookIsbn13}</td>
								<td className="text-left">{loan.bookTitle}</td>
								<td className="text-left">{loan.borrowerCardId}</td>
								<td className="text-left">{loan.dateOut}</td>
								<td className="text-left">{loan.dueDate}</td>
							</tr>
						);
					})}
				</tbody>
			</table>
			{selectedBooks.size > 0 && (
				<div className="mt-4 space-y-2">
					<p className="text-sm text-gray-600">
						{selectedBooks.size} book(s) selected (max 3)
					</p>
					<button
						type="button"
						onClick={handleBatchCheckIn}
						disabled={checkingIn || selectedBooks.size === 0 || selectedBooks.size > 3}
						className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
					>
						{checkingIn ? "Checking in..." : `Check In ${selectedBooks.size} Book(s)`}
					</button>
				</div>
			)}
		</div>
	);
}

