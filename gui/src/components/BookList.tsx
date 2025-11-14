import { searchBooks } from "@/actions/books"

export async function BookList({ searchTerm }: { searchTerm: string }) {
  const books = await searchBooks("gatsby");
  return (
    <div>
    <p>Books matching the search term {searchTerm}:</p>
      <ul>
        {books.map((book, i) => <li key={i}>{book.title}</li>)}
      </ul>
    </div>
  );
}