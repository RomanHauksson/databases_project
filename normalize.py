#!/usr/bin/env python3
#Michael - added comments for easier readability 
import csv
import os
from collections import defaultdict

#this checks to see if the string input is valid 
def detect_delimiter(sample_line: str) -> str:
    tab_count = sample_line.count("\t")
    comma_count = sample_line.count(",")
    return "\t" if tab_count > comma_count else ","

#This gets a book for the reader to read. (book class?) 
def read_books(books_path: str):
    with open(books_path, "r", encoding="utf-8", newline="") as f:
        first_line = f.readline()
        if not first_line:
            raise ValueError("books.csv is empty")
        delimiter = detect_delimiter(first_line)
        f.seek(0)
        reader = csv.DictReader(f, delimiter=delimiter)

        isbn10_key = None
        title_key = None
        author_key = None
        # Normalize header keys to expected ones
        header_lower_to_actual = {h.lower(): h for h in reader.fieldnames or []}
        for key in header_lower_to_actual:
            if key == "isbn10":
                isbn10_key = header_lower_to_actual[key]
            if key == "title":
                title_key = header_lower_to_actual[key]
            if key == "author":
                author_key = header_lower_to_actual[key]

        if not (isbn10_key and title_key and author_key):
            raise ValueError(
                "books.csv must include columns: ISBN10, Title, Author (case-insensitive)"
            )

        isbn_to_title: dict[str, str] = {}
        isbn_to_authors: dict[str, list[str]] = {}
        for row in reader:
            isbn = (row.get(isbn10_key) or "").strip()
            if not isbn:
                continue
            title = (row.get(title_key) or "").strip()
            authors_raw = (row.get(author_key) or "").strip()

            # Split authors by comma, strip whitespace, drop empties
            author_names: list[str] = [
                a.strip() for a in authors_raw.split(",") if a.strip()
            ]

            # Record unique book by ISBN (first occurrence wins)
            if isbn not in isbn_to_title:
                isbn_to_title[isbn] = title
            # Merge authors per ISBN
            existing = isbn_to_authors.get(isbn, [])
            merged = existing + [a for a in author_names if a not in existing]
            isbn_to_authors[isbn] = merged

    return isbn_to_title, isbn_to_authors
#end of the book class

#the borrowers class 
def read_borrowers(borrowers_path: str):
    with open(borrowers_path, "r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        # Map header names case-insensitive
        header_lower_to_actual = {h.lower(): h for h in reader.fieldnames or []}

        id_key = header_lower_to_actual.get("id0000id") or header_lower_to_actual.get("id")
        ssn_key = header_lower_to_actual.get("ssn")
        first_key = header_lower_to_actual.get("first_name") #first, last name should be combined 
        last_key = header_lower_to_actual.get("last_name")
        addr_key = header_lower_to_actual.get("address") 
        city_key = header_lower_to_actual.get("city") #no need for city and state 
        state_key = header_lower_to_actual.get("state")
        phone_key = header_lower_to_actual.get("phone") 

        required = [id_key, ssn_key, first_key, last_key, addr_key, city_key, state_key, phone_key]
        #validation of the borrowers class. 
        if any(k is None for k in required): 
            raise ValueError(
                "borrowers.csv must include columns: id, ssn, first_name, last_name, address, city, state, phone"
            )

        borrowers: list[dict[str, str]] = []
        for row in reader:
            card_id = (row.get(id_key) or "").strip()
            if not card_id:
                continue
            ssn = (row.get(ssn_key) or "").strip()
            first = (row.get(first_key) or "").strip()
            last = (row.get(last_key) or "").strip()
            bname = f"{first} {last}".strip()
            addr = (row.get(addr_key) or "").strip()
            city = (row.get(city_key) or "").strip()
            state = (row.get(state_key) or "").strip()
            full_address = ", ".join([p for p in [addr, city, state] if p])
            phone = (row.get(phone_key) or "").strip()

            borrowers.append(
                {
                    "Card_id": card_id,
                    "Ssn": ssn,
                    "Bname": bname,
                    "Address": full_address,
                    "Phone": phone,
                }
            )

    return borrowers
#end of borrowers class

#write to ???
def write_csv(path: str, fieldnames: list[str], rows: list[dict[str, str]]):
    with open(path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)

#author class?
def normalize(books_path: str, borrowers_path: str, output_dir: str):
    isbn_to_title, isbn_to_authors = read_books(books_path)

    # Build authors dictionary: name -> id
    author_name_to_id: dict[str, int] = {}
    authors_rows: list[dict[str, str]] = []
    next_author_id = 1

    # Accumulate from all ISBNs to ensure deterministic ordering by first appearance
    for isbn in isbn_to_authors:
        for name in isbn_to_authors[isbn]:
            normalized_name = " ".join(name.split())  # collapse internal whitespace
            if normalized_name not in author_name_to_id:
                author_name_to_id[normalized_name] = next_author_id
                authors_rows.append({"Author_id": str(next_author_id), "Name": normalized_name})
                next_author_id += 1

    # Build book_authors rows
    book_authors_rows: list[dict[str, str]] = []
    for isbn, author_names in isbn_to_authors.items():
        for name in author_names:
            normalized_name = " ".join(name.split())
            author_id = author_name_to_id[normalized_name]
            book_authors_rows.append({"Author_id": str(author_id), "Isbn": isbn})

    # Build book rows
    book_rows: list[dict[str, str]] = [
        {"Isbn": isbn, "Title": (title or "").strip()} for isbn, title in isbn_to_title.items()
    ]

    # Borrowers
    borrower_rows = read_borrowers(borrowers_path)

    # Write outputs
    os.makedirs(output_dir, exist_ok=True)
    write_csv(os.path.join(output_dir, "authors.csv"), ["Author_id", "Name"], authors_rows)
    write_csv(os.path.join(output_dir, "book.csv"), ["Isbn", "Title"], book_rows)
    write_csv(
        os.path.join(output_dir, "book_authors.csv"), ["Author_id", "Isbn"], book_authors_rows
    )
    write_csv(
        os.path.join(output_dir, "borrower.csv"),
        ["Card_id", "Ssn", "Bname", "Address", "Phone"],
        borrower_rows,
    )

    return {
        "authors_count": len(authors_rows),
        "books_count": len(book_rows),
        "book_authors_count": len(book_authors_rows),
        "borrowers_count": len(borrower_rows),
    }
#end of author class

#looks like a mix of book_author and author (again) classes
def validate_outputs(output_dir: str):
    # Helper to read CSV into list of dicts
    def read_dicts(path: str):
        with open(path, "r", encoding="utf-8", newline="") as f:
            reader = csv.DictReader(f)
            return list(reader)

    authors = read_dicts(os.path.join(output_dir, "authors.csv"))
    books = read_dicts(os.path.join(output_dir, "book.csv"))
    book_authors = read_dicts(os.path.join(output_dir, "book_authors.csv"))
    borrowers = read_dicts(os.path.join(output_dir, "borrower.csv"))

    # PK uniqueness
    author_ids = [a["Author_id"] for a in authors]
    if len(author_ids) != len(set(author_ids)):
        raise AssertionError("Duplicate Author_id found in authors.csv")

    book_isbns = [b["Isbn"] for b in books]
    if len(book_isbns) != len(set(book_isbns)):
        raise AssertionError("Duplicate Isbn found in book.csv")

    borrower_ids = [b["Card_id"] for b in borrowers]
    if len(borrower_ids) != len(set(borrower_ids)):
        raise AssertionError("Duplicate Card_id found in borrower.csv")

    # validation that the author is valid 
    author_id_set = set(author_ids)
    book_isbn_set = set(book_isbns)
    for row in book_authors:
        if row["Author_id"] not in author_id_set:
            raise AssertionError(f"book_authors references missing Author_id {row['Author_id']}")
        if row["Isbn"] not in book_isbn_set:
            raise AssertionError(f"book_authors references missing Isbn {row['Isbn']}")

    return {
        "authors_unique": True,
        "books_unique": True,
        "borrowers_unique": True,
        "book_authors_fk_valid": True,
    }
#end of validate outputs class

#main class, reads the info of the database, determining which table to be modified 
def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    books_path = os.path.join(base_dir, "books.csv")
    borrowers_path = os.path.join(base_dir, "borrowers.csv")
    output_dir = base_dir

    stats = normalize(books_path, borrowers_path, output_dir)
    validation = validate_outputs(output_dir)

    print("Normalization complete.")
    print(
        f"Books: {stats['books_count']}, Authors: {stats['authors_count']}, Book-Authors: {stats['book_authors_count']}, Borrowers: {stats['borrowers_count']}"
    )
    print("Validation:", validation)


if __name__ == "__main__":
    main()


