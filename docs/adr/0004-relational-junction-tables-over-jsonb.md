# ADR 0004: Relational Junction Tables Over PostgreSQL JSONB or Native Arrays

## Status
Accepted

## Context
PostgreSQL natively supports multi-value types like `TEXT[]` and `JSONB`, allowing attributes such as categories and authors to be stored directly inside the `books` table without creating secondary tables. However, this academic project evaluates students on relational theory, normalization (1NF through 3NF/BCNF), and referential integrity constraints.

## Decision
We enforce traditional **relational junction tables** (`book_categories` and `book_authors`) with composite primary keys and cascading foreign keys, rather than embedding JSONB or arrays into the `books` table.

## Considered Options
- **JSONB or Array Column in `books`**: Rejected because it violates 1NF atomicity principles and weakens foreign key referential integrity against deleted categories or authors.

## Consequences
- **Positive**:
  - The schema satisfies strict 3NF/BCNF standards.
  - Foreign key cascades prevent orphaned relationships automatically.
  - Queries demonstrate standard ANSI SQL `JOIN` and `GROUP BY` techniques expected in a Database Systems curriculum.
- **Negative**:
  - Requires writing multi-table `JOIN` statements when retrieving book catalogs.
