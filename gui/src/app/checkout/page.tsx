import { getCheckedOutBooks } from "@/actions/checkout";

export default async function Checkout() {
  const checkedOutBooks = await getCheckedOutBooks();

  return (
    <div>
      <h1 className="font-bold text-xl mb-4">Checked Out Books</h1>
      {checkedOutBooks.length === 0 ? (
        <p>No books are currently checked out.</p>
      ) : (
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
            </tr>
          </thead>
          <tbody>
            {checkedOutBooks.map(
              (loan: {
                bookIsbn13: string;
                bookTitle: string | null;
                borrowerCardId: string;
                dateOut: string;
                dueDate: string;
              }) => {
                return (
                  <tr
                    key={`${loan.bookIsbn13}-${loan.borrowerCardId}-${loan.dateOut}`}
                  >
                    <td className="text-left">{loan.bookIsbn13}</td>
                    <td className="text-left">{loan.bookTitle}</td>
                    <td className="text-left">{loan.borrowerCardId}</td>
                    <td className="text-left">{loan.dateOut}</td>
                    <td className="text-left">{loan.dueDate}</td>
                  </tr>
                );
              },
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
