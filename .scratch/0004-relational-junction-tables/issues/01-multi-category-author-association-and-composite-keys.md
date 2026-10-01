# 01: Multi-Category & Multi-Author Association and Composite Key Guard Slice

**What to build:** An association and assignment mechanism allowing books to link to multiple categories in `book_categories` and multiple authors with distinct contribution roles (e.g. `main_author`, `co_author`, `translator`) in `book_authors`. The system strictly enforces composite primary keys `(book_id, category_id)` and `(book_id, author_id)` at the database engine level, rejecting duplicate pairings with a classified conflict error, and enforces foreign key constraints preventing links to non-existent books, categories, or authors.

**Blocked by:** None (can start immediately)

**Status:** completed

- [x] A single book can be successfully linked to multiple distinct categories in `book_categories`.
- [x] A single book can be successfully linked to multiple distinct authors with roles in `book_authors`.
- [x] Attempting to insert a duplicate `(book_id, category_id)` violates the composite primary key and throws a `ConflictError`.
- [x] Attempting to insert a duplicate `(book_id, author_id)` violates the composite primary key and throws a `ConflictError`.
- [x] Attempting to link a non-existent `book_id` or `category_id` violates foreign key constraints and throws a `NotFoundError`.
- [x] Attempting to link a non-existent `author_id` violates foreign key constraints and throws a `NotFoundError`.
- [x] The `author_role` attribute correctly stores the contributor's responsibility (defaults to `main_author`).

