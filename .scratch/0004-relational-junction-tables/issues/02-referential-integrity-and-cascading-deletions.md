# 02: Referential Integrity & Cascading Deletion Verification Slice

**What to build:** Verification and enforcement of database-level `ON DELETE CASCADE` referential integrity across the catalog taxonomy. Deleting a category or author automatically removes junction associations without deleting the underlying books, while deleting a book cascades and cleans up all its associative rows in `book_categories` and `book_authors` without deleting the associated categories or authors, guaranteeing zero orphaned rows and complete 3NF compliance.

**Blocked by:** 01: Multi-Category & Multi-Author Association and Composite Key Guard Slice

**Status:** completed

- [x] Deleting a `Category` row cascades and automatically removes all associated rows in `book_categories`.
- [x] Deleting a `Category` row leaves all linked `Book` records completely intact.
- [x] Deleting an `Author` row cascades and automatically removes all associated rows in `book_authors`.
- [x] Deleting an `Author` row leaves all linked `Book` records completely intact.
- [x] Deleting a `Book` row cascades and automatically removes all its corresponding entries in both `book_categories` and `book_authors`.
- [x] Deleting a `Book` row leaves the referenced `Category` and `Author` records intact.
- [x] The database engine enforces all cascading deletions automatically without relying on application-level manual cleanup scripts.

