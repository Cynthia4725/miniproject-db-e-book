# 03: Relational Catalog Querying & Multi-Taxonomy Filtering Slice

**What to build:** High-performance catalog querying capabilities using standard ANSI SQL `JOIN` statements that assemble relational entity data into clean domain models without using unstructured JSONB or array columns. Customers and administrators can view complete book details (including all assigned categories and authors with their roles) and filter catalog listings by category or by author leveraging secondary indexes.

**Blocked by:** 01: Multi-Category & Multi-Author Association and Composite Key Guard Slice

**Status:** completed

- [x] Querying book details (`getBookDetails`) joins `books`, `book_categories`, `categories`, `book_authors`, and `authors` to return a consolidated book model.
- [x] Books assigned to multiple categories correctly return all category names and IDs without duplicating base book attributes.
- [x] Books with multiple contributors correctly return all authors alongside their specific `author_role`.
- [x] Filtering the catalog by category (`getBooksByCategory`) leverages secondary index `idx_book_categories_category_id` and returns only books belonging to that category.
- [x] Filtering the catalog by author (`getBooksByAuthor`) leverages secondary index `idx_book_authors_author_id` and returns only books authored by that person.
- [x] All queries satisfy 1NF atomicity and 3NF normalization without using PostgreSQL `JSONB` or `TEXT[]` array columns.

