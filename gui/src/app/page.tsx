import { BookList } from "@/components/BookList";

export default function Home() {
  return (
    <div>
      <h1>Book search</h1>
      <BookList searchTerm="scott"/>
    </div>
  );
}
