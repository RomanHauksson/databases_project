"use client";

import { useState } from "react";
import { getFinesForBorrower, payBorrowerFines } from "@/actions/borrower";

export function BorrowerFines() {
	const [cardId, setCardId] = useState("");
	const [finesAmount, setFinesAmount] = useState<number | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isPaying, setIsPaying] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	const handleLookup = async () => {
		if (cardId.length !== 8) {
			setErrorMessage("Card ID must be exactly 8 characters");
			return;
		}

		setIsLoading(true);
		setErrorMessage(null);
		setSuccessMessage(null);
		setFinesAmount(null);

		try {
			const amount = await getFinesForBorrower(cardId, true);
			setFinesAmount(amount);
		} catch (error) {
			const errorMsg =
				error instanceof Error
					? error.message
					: "Failed to lookup fines. Please try again.";
			setErrorMessage(errorMsg);
		} finally {
			setIsLoading(false);
		}
	};

	const handlePayFines = async () => {
		if (cardId.length !== 8) {
			setErrorMessage("Card ID must be exactly 8 characters");
			return;
		}

		if (finesAmount === null || finesAmount === 0) {
			setErrorMessage("No fines to pay");
			return;
		}

		setIsPaying(true);
		setErrorMessage(null);
		setSuccessMessage(null);

		try {
			await payBorrowerFines(cardId);
			setSuccessMessage("Fines paid successfully!");
			// Refresh the fines amount
			const newAmount = await getFinesForBorrower(cardId, true);
			setFinesAmount(newAmount);
		} catch (error) {
			const errorMsg =
				error instanceof Error
					? error.message
					: "Failed to pay fines. Please try again.";
			setErrorMessage(errorMsg);
		} finally {
			setIsPaying(false);
		}
	};

	return (
		<div className="max-w-md space-y-4">
			<div>
				<label htmlFor="cardId" className="block mb-1">
					Borrower Card ID
				</label>
				<div className="flex gap-2">
					<input
						id="cardId"
						type="text"
						value={cardId}
						onChange={(e) => {
							const value = e.target.value;
							if (value.length <= 8) {
								setCardId(value);
								setFinesAmount(null);
								setErrorMessage(null);
								setSuccessMessage(null);
							}
						}}
						placeholder="Enter 8-character card ID"
						maxLength={8}
						className="flex-1 border border-black rounded-lg px-2 py-1"
					/>
					<button
						type="button"
						onClick={handleLookup}
						disabled={cardId.length !== 8 || isLoading}
						className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
					>
						{isLoading ? "Loading..." : "Lookup"}
					</button>
				</div>
				{cardId.length > 0 && cardId.length !== 8 && (
					<p className="text-sm text-red-600 mt-1">
						Card ID must be exactly 8 characters (current: {cardId.length})
					</p>
				)}
			</div>

			{finesAmount !== null && (
				<div className="p-4 border border-black rounded-lg bg-gray-50">
					<div className="flex justify-between items-center mb-4">
						<span className="font-semibold">Outstanding Fines:</span>
						<span className="text-xl font-bold">
							${finesAmount.toFixed(2)}
						</span>
					</div>
					{finesAmount > 0 ? (
						<button
							type="button"
							onClick={handlePayFines}
							disabled={isPaying}
							className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
						>
							{isPaying ? "Processing..." : "Pay All Fines"}
						</button>
					) : (
						<p className="text-green-600 font-semibold">
							No outstanding fines!
						</p>
					)}
				</div>
			)}

			{errorMessage && (
				<div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
					<p>{errorMessage}</p>
				</div>
			)}

			{successMessage && (
				<div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
					<p>{successMessage}</p>
				</div>
			)}
		</div>
	);
}

