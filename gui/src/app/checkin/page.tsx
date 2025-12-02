import { getCheckedOutBooks } from "@/actions/checkout";
import { CheckInBooks } from "./checkin-books";

export default async function CheckIn() {
	const checkedOutBooks = await getCheckedOutBooks();

	return (
		<div>
			<h1 className="font-bold text-xl mb-4">Check In Books</h1>
			<CheckInBooks initialBooks={checkedOutBooks} />
		</div>
	);
}

