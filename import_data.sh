source gui/.env
psql $DATABASE_URL <<EOF
TRUNCATE TABLE book, authors, book_authors, borrower RESTART IDENTITY CASCADE;
\copy book FROM 'normalization/data/normalized/book.csv' DELIMITER ',' CSV HEADER
\copy authors FROM 'normalization/data/normalized/authors.csv' DELIMITER ',' CSV HEADER
\copy book_authors FROM 'normalization/data/normalized/book_authors.csv' DELIMITER ',' CSV HEADER
\copy borrower FROM 'normalization/data/normalized/borrower.csv' DELIMITER ',' CSV HEADER
EOF