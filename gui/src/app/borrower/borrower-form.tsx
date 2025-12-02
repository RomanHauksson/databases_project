"use client";

import { useState } from "react";
import { createBorrower } from "@/actions/borrower";

export function BorrowerForm() {
	const [ssn, setSsn] = useState("");
	const [name, setName] = useState("");
	const [address, setAddress] = useState("");
	const [phoneNumber, setPhoneNumber] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [createdCardId, setCreatedCardId] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setSuccessMessage(null);
		setErrorMessage(null);
		setCreatedCardId(null);

		// Validate SSN format (should be 11 characters: XXX-XX-XXXX)
		if (ssn.length !== 11 || !/^\d{3}-\d{2}-\d{4}$/.test(ssn)) {
			setErrorMessage("SSN must be in format XXX-XX-XXXX (11 characters total)");
			setIsSubmitting(false);
			return;
		}

		try {
			const result = await createBorrower({
				ssn,
				name,
				address,
				phoneNumber,
			});

			setSuccessMessage("Borrower created successfully!");
			setCreatedCardId(result.cardId);
			// Clear form
			setSsn("");
			setName("");
			setAddress("");
			setPhoneNumber("");
		} catch (error) {
			const errorMsg =
				error instanceof Error
					? error.message
					: "Failed to create borrower. Please try again.";
			setErrorMessage(errorMsg);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleSsnChange = (value: string) => {
		// Remove all non-digits
		const digits = value.replace(/\D/g, "");
		// Format as XXX-XX-XXXX
		let formatted = "";
		if (digits.length > 0) {
			formatted = digits.slice(0, 3);
		}
		if (digits.length > 3) {
			formatted += "-" + digits.slice(3, 5);
		}
		if (digits.length > 5) {
			formatted += "-" + digits.slice(5, 9);
		}
		setSsn(formatted);
	};

	return (
		<div className="max-w-md">
			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label htmlFor="ssn" className="block mb-1">
						SSN <span className="text-red-500">*</span>
					</label>
					<input
						id="ssn"
						type="text"
						value={ssn}
						onChange={(e) => handleSsnChange(e.target.value)}
						placeholder="123-45-6789"
						maxLength={11}
						required
						className="w-full border border-black rounded-lg px-2 py-1"
					/>
					<p className="text-sm text-gray-600 mt-1">
						Format: XXX-XX-XXXX (11 characters)
					</p>
				</div>

				<div>
					<label htmlFor="name" className="block mb-1">
						Name <span className="text-red-500">*</span>
					</label>
					<input
						id="name"
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="John Doe"
						required
						className="w-full border border-black rounded-lg px-2 py-1"
					/>
				</div>

				<div>
					<label htmlFor="address" className="block mb-1">
						Address <span className="text-red-500">*</span>
					</label>
					<textarea
						id="address"
						value={address}
						onChange={(e) => setAddress(e.target.value)}
						placeholder="123 Main St, City, State 12345"
						required
						rows={3}
						className="w-full border border-black rounded-lg px-2 py-1"
					/>
				</div>

				<div>
					<label htmlFor="phoneNumber" className="block mb-1">
						Phone Number <span className="text-red-500">*</span>
					</label>
					<input
						id="phoneNumber"
						type="tel"
						value={phoneNumber}
						onChange={(e) => setPhoneNumber(e.target.value)}
						placeholder="(555) 123-4567"
						required
						className="w-full border border-black rounded-lg px-2 py-1"
					/>
				</div>

				<button
					type="submit"
					disabled={isSubmitting}
					className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
				>
					{isSubmitting ? "Creating..." : "Create Borrower"}
				</button>
			</form>

			{successMessage && (
				<div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
					<p>{successMessage}</p>
					{createdCardId && (
						<p className="mt-2 font-semibold">
							Card ID: <span className="font-mono">{createdCardId}</span>
						</p>
					)}
				</div>
			)}

			{errorMessage && (
				<div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
					<p>{errorMessage}</p>
				</div>
			)}
		</div>
	);
}

