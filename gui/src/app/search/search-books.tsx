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
			<ul>
				{results.map((book) => {
					return (
						<li key={book.isbn13}>
							{book.title},{" "}
							{book.authorNames.map((name) => (
								<span key={name}>{name}, </span>
							))}
						</li>
					);
				})}
			</ul>
		</div>
	);
}
