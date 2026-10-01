# Spec: Relational Junction Tables Over PostgreSQL JSONB or Native Arrays (ADR-0004)

Triage Label: `ready-for-agent`

---

## Problem Statement

PostgreSQL supports non-scalar data types such as `JSONB` and native arrays (e.g. `categories TEXT[]`). Storing multi-valued associations directly within a single table column tempts developers to avoid relational joins. However, this anti-pattern introduces severe drawbacks:
1. It violates First Normal Form (1NF) atomicity requirements, undermining the foundational theoretical criteria of an academic Database Systems curriculum.
2. It destroys database-enforced referential integrity: if a category is renamed, merged, or deleted, database engines cannot automatically validate or cascade changes across unstructured JSONB or array values, leading to "ghost" taxonomy data.
3. It prevents the use of standard ANSI SQL `JOIN`, `GROUP BY`, and relational aggregate operators, requiring non-standard, database-specific JSON/array functions that complicate queries and harm query portability.

---

## Solution

Enforce strict relational **Many-to-Many Junction Tables** (`book_categories` and `book_authors`) governed by composite primary keys and cascading foreign key constraints:
1. Normalize catalog taxonomy into discrete relational entities: `categories`, `authors`, and `publishers`.
2. Model many-to-many relationships through dedicated junction tables:
   - `book_categories` with composite primary key `(book_id, category_id)`.
   - `book_authors` with composite primary key `(book_id, author_id)` and an attribution role attribute (`author_role`).
3. Enforce referential integrity via `ON DELETE CASCADE` constraints: deleting a book removes its associative links, while deleting a category removes only the link without deleting the book itself.
4. Utilize standard ANSI SQL `JOIN` statements with composite key indexing, enabling fast multi-dimensional categorization and analytical aggregations (e.g. revenue per category, authors per book).

---

## User Stories

1. As a store customer, I want to find books that span multiple categories (e.g. both "Computer Science" and "Web Development"), so that I can discover cross-disciplinary reading materials easily.
2. As a store customer, I want to filter the catalog by selecting a specific category, so that I view only relevant books indexed under that category.
3. As a store customer, I want to view all contributing authors and their respective roles (e.g. Main Author, Co-Author, Translator) on a book detail page, so that I have complete bibliographic information.
4. As a store administrator, I want to assign multiple categories to a single book when creating or editing a title, so that the book is accurately discovered across all relevant genres.
5. As a store administrator, I want to assign multiple authors to a single book, so that collaborative works are properly attributed.
6. As a store administrator, I want to delete an obsolete category without deleting the associated books, so that catalog inventory is preserved.
7. As a store administrator, I want to delete a book and have the system automatically clean up its category and author association rows, so that orphaned junction records do not accumulate in the database.
8. As a database instructor/evaluator, I want the database schema to satisfy 1NF, 2NF, and 3NF/BCNF normalization rules, so that I can verify the student's mastery of relational design theory.
9. As a database instructor/evaluator, I want to inspect composite primary key definitions on junction tables, so that I can confirm that duplicate entity pairings are rejected at the database engine level.
10. As a database instructor/evaluator, I want to see multi-table ANSI SQL `JOIN` and `GROUP BY` queries in analytical reports, so that I can evaluate relational querying proficiency rather than proprietary JSON parsing functions.
11. As a database administrator, I want foreign keys on junction tables to use `ON DELETE CASCADE`, so that referential integrity is maintained automatically by the database engine without application-side manual cleanup scripts.
12. As a database administrator, I want reverse foreign key lookups (e.g. finding all books for a category or author) to leverage foreign key indexes, so that category-based queries execute with high performance.
13. As a software developer, I want the repository to reject duplicate insertions of the same book-category pair, so that data inconsistencies are impossible.
14. As a software developer, I want to query a book alongside its associated categories and authors in a single query using relational joins, so that network round-trips to the database are minimized.
15. As a software developer, I want relational errors (like attempting to link a non-existent book ID or category ID) to trigger standard PostgreSQL foreign key violation errors (`23503`), so that bugs are caught immediately during execution.

---

## Implementation Decisions

### 1. Relational Junction Table Schemas
- **`book_categories` table**:
  - `book_id`: `BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE`
  - `category_id`: `BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE`
  - `PRIMARY KEY (book_id, category_id)` (Composite Primary Key).
  - Explicit secondary index on `category_id` to optimize reverse lookups (`WHERE category_id = ...`).
- **`book_authors` table**:
  - `book_id`: `BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE`
  - `author_id`: `BIGINT NOT NULL REFERENCES authors(id) ON DELETE CASCADE`
  - `author_role`: `VARCHAR(50) NOT NULL DEFAULT 'main_author'`
  - `PRIMARY KEY (book_id, author_id)` (Composite Primary Key).
  - Explicit secondary index on `author_id` to optimize author catalog lookups.

### 2. Normalization Compliance
- **1NF**: All columns contain atomic, indivisible scalar values; no repeating groups, comma-separated lists, or nested JSON structures.
- **2NF**: In `book_categories`, all attributes are part of the primary key. In `book_authors`, `author_role` depends fully on the combination of `(book_id, author_id)`.
- **3NF / BCNF**: No non-key attribute transitively depends on the primary key; category names and author biographies live strictly in `categories` and `authors` tables respectively.

### 3. Querying Patterns
- Catalog searches employ standard inner and left joins:
  ```sql
  SELECT b.*, c.name AS category_name, a.name AS author_name, ba.author_role
  FROM books b
  JOIN book_categories bc ON b.id = bc.book_id
  JOIN categories c ON bc.category_id = c.id
  JOIN book_authors ba ON b.id = ba.book_id
  JOIN authors a ON ba.author_id = a.id
  WHERE b.is_active = TRUE;
  ```
- Analytical aggregations group by category or author identity:
  ```sql
  SELECT c.name, COUNT(DISTINCT b.id) AS total_books, SUM(oi.unit_price) AS total_revenue
  FROM categories c
  JOIN book_categories bc ON c.id = bc.category_id
  JOIN books b ON bc.book_id = b.id
  LEFT JOIN order_items oi ON b.id = oi.book_id
  GROUP BY c.id, c.name;
  ```

---

## Testing Decisions

### What Makes a Good Test
- Tests must verify relational integrity constraints, cascading behaviors, and join correctness across the catalog boundary.
- Tests must prove:
  1. A single book successfully links to multiple distinct categories and authors.
  2. Attempting to insert a duplicate `(book_id, category_id)` fails with a primary key violation (`23505`).
  3. Inserting a link referencing a non-existent `book_id` or `category_id` fails with a foreign key violation (`23503`).
  4. Deleting a `Category` row cascades and removes matching rows in `book_categories` while leaving the corresponding `Book` row intact.
  5. Deleting a `Book` row cascades and removes matching rows in `book_categories` and `book_authors` while leaving the `Category` and `Author` rows intact.
  6. Standard relational `JOIN` queries return accurate aggregated category and author lists for books.

### Modules Tested
- **Database Schema & DDL Migration**: Verifies composite primary key and foreign key cascade constraint enforcement.
- **Catalog Repository**: Verifies creation, association, and retrieval of multi-category and multi-author book records.
- **Analytical Reporting Engine**: Verifies multi-table queries grouping sales and book counts by category.

### Prior Art
- Classical relational database schema designs for library management, e-commerce catalog taxonomies, and academic grading rubrics.

---

## Out of Scope
- Hierarchical category trees (self-referencing parent/child categories); flat multi-category taxonomy is sufficient for the scope of this mini-project.
- Dynamic tagging clouds with open user-generated tags; taxonomy is controlled by store administrators.

---

## Further Notes
- This specification formalizes [ADR 0004: Relational Junction Tables Over PostgreSQL JSONB or Native Arrays](file:///c:/Users/bond/Documents/miniproject-db-e-book/docs/adr/0004-relational-junction-tables-over-jsonb.md).
- Companion architectural decisions: [ADR 0003: Neon Serverless PostgreSQL with Direct SQL Queries](file:///c:/Users/bond/Documents/miniproject-db-e-book/docs/adr/0003-neon-serverless-postgresql.md).
