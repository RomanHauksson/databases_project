export function BookList({ searchTerm }: { searchTerm: string }) {
  return (
    <div>
    <p>Books matching the search term {searchTerm}:</p>
      <ul>
        <li>The Great Gatsby</li>
        <li>To Kill a Mockingbird</li>
        <li>1984</li>
      </ul>
    </div>
  );
}