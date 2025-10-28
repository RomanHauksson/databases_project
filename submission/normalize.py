# %% [markdown]
# books.csv has 7 columns: ISBN10, ISBN13, Title, Author, Cover, Publisher, and Pages.

# %% [markdown]
# Before figuring out the functional dependencies, we need to convert the table into the first normal form.  The only multivalued attribute is `Author`.

# %%
import csv

normalized_rows = []

with open("./original_data/books.csv", "r", encoding="utf-8") as f:
    reader = csv.DictReader(f, delimiter="\t")

    for row in reader:
        authors = [author.strip() for author in row["Author"].split(",")]

        for author in authors:
            normalized_row = {
                "ISBN10": row["ISBN10"],
                "ISBN13": row["ISBN13"],
                "Title": row["Title"],
                "Author": author,
                "Cover": row["Cover"],
                "Publisher": row["Publisher"],
                "Pages": row["Pages"],
            }
            normalized_rows.append(normalized_row)

with open("./intermediate_data/books_1nf.csv", "w", encoding="utf-8", newline="") as f:
    fieldnames = ["ISBN10", "ISBN13", "Title", "Author", "Cover", "Publisher", "Pages"]
    writer = csv.DictWriter(f, fieldnames=fieldnames)

    writer.writeheader()
    writer.writerows(normalized_rows)

# %% [markdown]
# Now, there are two candidate keys for this normalized version: `{ISBN10, Author}` and `{ISBN13, Author}`.
#
# These are the full functional dependencies, which don't violate the second normal form:
#
# - {ISBN10, Author} → ISBN13, Title, Cover, Publisher, Pages
# - {ISBN13, Author} → ISBN10, Title, Cover, Publisher, Pages
#
# However, these partial dependencies do violate the second normal form:
#
# - {ISBN10} → ISBN13, Title, Cover, Publisher, Pages
# - {ISBN13} → ISBN10, Title, Cover, Publisher, Pages
#
# This is because Title, Cover, Publisher, and Pages are all non-key attributes, but they each depend on ISBN10 and also depend on ISBN13, and {ISBN10} and {ISBN13} are both proper subsets of the candidate keys `{ISBN10, Author}` and `{ISBN13, Author}`.

# %%
# Use sets to track unique books and book-author pairs
books = {}  # ISBN10 -> book data
book_authors = []  # list of (ISBN10, Author) pairs

with open("./intermediate_data/books_1nf.csv", "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)

    for row in reader:
        isbn10 = row["ISBN10"]

        # Add book if we haven't seen this ISBN10 before
        if isbn10 not in books:
            books[isbn10] = {
                "ISBN10": row["ISBN10"],
                "ISBN13": row["ISBN13"],
                "Title": row["Title"],
                "Cover": row["Cover"],
                "Publisher": row["Publisher"],
                "Pages": row["Pages"],
            }

        # Add book-author relationship
        book_authors.append({"ISBN10": isbn10, "Author": row["Author"]})

with open("./intermediate_data/book_2nf.csv", "w", encoding="utf-8", newline="") as f:
    fieldnames = ["ISBN10", "ISBN13", "Title", "Cover", "Publisher", "Pages"]
    writer = csv.DictWriter(f, fieldnames=fieldnames)

    writer.writeheader()
    writer.writerows(books.values())

with open(
    "./intermediate_data/book_authors_2nf.csv", "w", encoding="utf-8", newline=""
) as f:
    fieldnames = ["ISBN10", "Author"]
    writer = csv.DictWriter(f, fieldnames=fieldnames)

    writer.writeheader()
    writer.writerows(book_authors)

# %% [markdown]
# Now, I need to figure out whether the new book and book_author tables are in 3rd normal form. What are the functional dependencies?
#
# book_authors doesn't have any non-trivial functional dependencies, since one book can have multiple authors and one author can write multiple books. This means it's automatically in 3rd normal form.
#
# books_2nf has the following functional dependencies:
#
# - {ISBN10} → ISBN13, Title, Cover, Publisher, Pages
# - {ISBN13} → ISBN10, Title, Cover, Publisher, Pages
#
# But since {ISBN10} and {ISBN13} are both candidate keys, neither functional dependency breaks the rule for 3rd normal form (no non-key attribute can depend on another non-key attribute).
#
# Now, books.csv has been successfully decomposed into 3rd normal form!

# %% [markdown]
# But there's still redundancy in book_authors, even though it's technically in 3rd normal form. Since one author can write multiple books, their name will be repeated for as many rows as books they've written (including those they've coauthored).

# %%
# Track unique authors and assign IDs
author_to_id = {}  # Author_Name -> Author_ID
next_author_id = 1

book_author_relationships = []

with open("./intermediate_data/book_authors_2nf.csv", "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)

    for row in reader:
        author_name = row["Author"]
        isbn10 = row["ISBN10"]

        # Assign ID to new authors
        if author_name not in author_to_id:
            author_to_id[author_name] = next_author_id
            next_author_id += 1

        # Store book-author relationship with Author_ID
        book_author_relationships.append(
            {"Author_id": author_to_id[author_name], "Isbn": isbn10}
        )

with open("./normalized_data/authors.csv", "w", encoding="utf-8", newline="") as f:
    fieldnames = ["Author_id", "Name"]
    writer = csv.DictWriter(f, fieldnames=fieldnames)

    writer.writeheader()
    for name, author_id in sorted(author_to_id.items(), key=lambda x: x[1]):
        writer.writerow({"Author_id": author_id, "Name": name})

with open("./normalized_data/book_authors.csv", "w", encoding="utf-8", newline="") as f:
    fieldnames = ["Author_id", "Isbn"]
    writer = csv.DictWriter(f, fieldnames=fieldnames)

    writer.writeheader()
    writer.writerows(book_author_relationships)

# %% [markdown]
# I guess technically the current state of the database could cause an update anomoly because the author of a book could also visit the library and borrow a book! In other words, an author could also be a borrower. If they got their legal name changed, we'd have to update it in the borrower table as well as the authors table.
#
# To fix this, we could conceptualize a new entity type called "human", with overlapping subclasses "author" and "borrower". Or, I guess just one subclass called "author" with the multivalued specific attribute "ISBN10" to represent the books that that author wrote, and a relationship between humans and books called "borrows".
#
# But in the authors table, we assume that two authors with the same name are also the same author, whereas we don't make this same assumption about borrowers. This is beacuse we have access to the social security numbers of the borrowers, but not of the authors. We could deduplicate the authors if they all signed up for ORCID, but not every author has done that, and most of the borrowers haven't either. So I guess we'll just have to accept the redundancy, since it won't cause that much of an issue in practice.

# %% [markdown]
# Anyway, borrowers doesn't need to be normalized, I just need to combine and rename some attributes. In future milestones I'm guessing we'll add a table to store which books each borrower has currently checked out.

# %%
rows = []

with open("original_data/borrowers.csv", "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)

    for row in reader:
        rows.append(
            {
                "Card_id": row["ID0000id"],
                "Ssn": row["ssn"],
                "Bname": " ".join([row["first_name"], row["last_name"]])
                .strip()
                .title(),
                "Address": ", ".join([row["address"], row["city"], row["state"]]),
                "Phone": row["phone"],
            }
        )

with open("normalized_data/borrower.csv", "w", encoding="utf-8", newline="") as f:
    fieldnames = ["Card_id", "Ssn", "Bname", "Address", "Phone"]
    writer = csv.DictWriter(f, fieldnames=fieldnames)

    writer.writeheader()
    writer.writerows(rows)

# %% [markdown]
# The diagram only shows two attributes in the "book" schema: ISBN and Title. I also need to make sure that the titles follow the same naming convention.

# %%
rows = []

with open("./intermediate_data/book_2nf.csv", "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)

    for row in reader:
        rows.append({"Isbn": row["ISBN10"], "Title": row["Title"].strip().title()})

with open("./normalized_data/book.csv", "w", encoding="utf-8", newline="") as f:
    fieldnames = ["Isbn", "Title"]
    writer = csv.DictWriter(f, fieldnames=fieldnames)

    writer.writeheader()
    writer.writerows(rows)
