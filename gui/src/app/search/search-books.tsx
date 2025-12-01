"use client";

import { useState, useTransition, useRef } from "react";
import { searchBooks } from "@/actions/books";
import type { BookResult } from "@/actions/books";
import { checkOut } from "@/actions/checkout";

export function SearchBooks() {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<BookResult[]>([]);
	const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
	const [borrowerCardId, setBorrowerCardId] = useState<string>("");
	const [isPending, startTransition] = useTransition();
	const [isCheckingOut, setIsCheckingOut] = useState(false);
	const searchCounterRef = useRef(0);

	const handleCheckboxChange = (isbn13: string, checked: boolean) => {
		if (checked) {
			setSelectedBooks([...selectedBooks, isbn13]);
		} else {
			setSelectedBooks(selectedBooks.filter((id) => id !== isbn13));
		}
	};

	const handleSearch = (value: string) => {
		setQuery(value);
		const currentSearch = ++searchCounterRef.current;

		startTransition(async () => {
			const newResults = await searchBooks(value);
			// Only update if this is still the most recent search
			if (currentSearch === searchCounterRef.current) {
				setResults(newResults);
			}
		});
	};

	const handleCheckout = async () => {
		if (selectedBooks.length === 0 || borrowerCardId.length !== 8) {
			return;
		}

		setIsCheckingOut(true);
		try {
			// Check out each selected book
			for (const isbn13 of selectedBooks) {
				await checkOut(isbn13, borrowerCardId);
			}
			// Clear selections after successful checkout
			setSelectedBooks([]);
			setBorrowerCardId("");
			// Optionally refresh search results to show updated checkout status
		} catch (error) {
			console.error("Failed to check out books:", error);
			const errorMessage = error instanceof Error ? error.message : "Failed to check out books. Please try again.";
			alert(errorMessage);
		} finally {
			setIsCheckingOut(false);
		}
	};

	return (
		<div>
			<input
				type="text"
				value={query}
				onChange={(e) => handleSearch(e.target.value)}
				placeholder="The Great Gatsby"
				className="border border-black rounded-lg px-2 py-1"
			/>
			<p>
				{isPending
					? "Loading..."
					: results.length === 0
						? "0 results"
						: `${results[0].numResults} results`}
			</p>
			<table className="table-fixed w-full border-collapse border border-black [&_td,&_th]:px-2 [&_td,&_th]:border [&_td,&_th]:border-black">
				<thead>
					<tr>
						<th className="text-center" scope="col">
							Select
						</th>
						<th className="text-left" scope="col">
							Title
						</th>
						<th className="text-left" scope="col">
							ISBN13
						</th>
						<th className="text-left" scope="col">
							Authors
						</th>
						<th className="text-center" scope="col">
							Checked out?
						</th>
					</tr>
				</thead>
				<tbody>
					{results.map((book) => {
						return (
							<tr key={book.isbn13}>
								<td className="text-center">
									<input
										type="checkbox"
										checked={selectedBooks.includes(book.isbn13)}
										onChange={(e) =>
											handleCheckboxChange(book.isbn13, e.target.checked)
										}
									/>
								</td>
								<th className="text-left" scope="row">
									{book.title}
								</th>
								<td className="text-left">{book.isbn13}</td>
								<td className="text-left">{book.authorNames.join(", ")}</td>
								<td className="text-center">
									{book.isCheckedOut ? "Yes" : "No"}
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
			{selectedBooks.length > 0 && (
				<div className="mt-4 space-y-2">
					<input
						type="text"
						value={borrowerCardId}
						onChange={(e) => {
							const value = e.target.value;
							// Only allow exactly 8 characters - no more, no less
							if (value.length <= 8) {
								setBorrowerCardId(value);
							}
						}}
						placeholder="Enter borrower card ID (exactly 8 characters)"
						className="border border-black rounded-lg px-2 py-1"
						maxLength={8}
					/>
					{borrowerCardId.length > 0 && borrowerCardId.length !== 8 && (
						<p className="text-sm text-red-600">
							Card ID must be exactly 8 characters (current: {borrowerCardId.length})
						</p>
					)}
					<button
						onClick={handleCheckout}
						disabled={borrowerCardId.length !== 8 || isCheckingOut}
						className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
					>
						{isCheckingOut ? "Checking out..." : "Check out"}
					</button>
				</div>
			)}
		</div>
	);
}
