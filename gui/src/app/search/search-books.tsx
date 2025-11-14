"use client";

import { useState, useTransition, useRef } from "react";
import { searchBooks } from "@/actions/books";
import type { BookResult } from "@/actions/books";

export function SearchBooks() {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<BookResult[]>([]);
	const [isPending, startTransition] = useTransition();
	const searchCounterRef = useRef(0);

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

	return (
		<div>
			<input
				type="text"
				value={query}
				onChange={(e) => handleSearch(e.target.value)}
				placeholder="The Great Gatsby"
				className="border border-black rounded-lg px-2 py-1"
			/>
			<p>{isPending ? "Loading..." : `${results.length} results`}</p>
			<table className="table-fixed w-full border-collapse border border-black [&_td,&_th]:px-2 [&_td,&_th]:border [&_td,&_th]:border-black">
				<thead>
					<tr>
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
		</div>
	);
}
