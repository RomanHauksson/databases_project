import { searchBooks } from "@/actions/books"

export async function BookList({ searchTerm }: { searchTerm: string }) {
  const books = await searchBooks(searchTerm);
  return (
    <div>
    <p>Books matching the search term {searchTerm}:</p>
      <ul>
        {books.map((book, bookIndex) => {
          return <li key={bookIndex}>{book.title}, {
            book.authorNames.map((name, nameIndex) => <span key={nameIndex}>{name}, </span>)
          }</li>
        })}
      </ul>
    </div>
  );
}