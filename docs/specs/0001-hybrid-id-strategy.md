# Spec: Hybrid Identifier Strategy (ADR-0001)

Triage Label: `ready-for-agent`

---

## Problem Statement

When building an e-commerce platform for digital e-books, exposing sequential database identifiers (e.g. `order_id=1042`, `token_id=58`) in public URLs and client interfaces invites enumeration attacks. Malicious users or scrapers can increment integer numbers to discover competitor order volumes, snoop on another customer's order status, or tamper with digital asset download links. 

Conversely, replacing all internal primary keys with random UUID strings introduces performance penalties: 128-bit random keys cause B-tree index fragmentation, increase storage footprints for foreign key references across high-traffic junction tables (`order_items`, `download_logs`), and significantly complicate direct SQL queries during academic inspection and grading.

---

## Solution

Implement a **Hybrid Identifier Strategy** across the persistence and API layers:
1. Every relational database table utilizes an internal, sequential 64-bit integer (`BIGINT GENERATED ALWAYS AS IDENTITY`) as its primary key, optimizing relational joins, index clustering, and academic query readability.
2. Sensitive, customer-facing entities—specifically **Orders** and **DownloadTokens**—maintain a secondary, non-sequential **UUID v4** identifier column (`order_number` and `token` respectively), guarded by unique B-Tree indexes and non-null constraints.
3. All public REST/HTTP endpoints, client links, and user-facing notifications reference only the UUID identifier.
4. Internal relational foreign keys (`order_items.order_id`, `payments.order_id`, `download_logs.download_token_id`) strictly reference the internal `BIGINT` primary key, keeping join operations lightweight and ensuring complete referential integrity.
5. Outbound serialization layers automatically sanitize database entities to prevent the internal `BIGINT id` from leaking into public API responses.

---

## User Stories

1. As a customer, I want my order confirmation link to use a cryptographic, unguessable identifier, so that unauthorized strangers cannot view my purchase details by altering a sequential number in their browser.
2. As a customer, I want my e-book download link to rely on an unguessable token, so that third parties cannot steal or scrape my purchased files.
3. As a customer, I want to share my order number with customer support without revealing how many orders the store has processed before mine.
4. As a customer, I want the system to reject tampered or malformed order numbers with an appropriate error message, so that I know immediately if a link was truncated or corrupted.
5. As a store administrator, I want to search and inspect orders using both the customer's public order UUID and internal management filters, so that I can support customers efficiently.
6. As a store administrator, I want download tokens to be distinct and uniquely tied to each purchased book, so that revoking a compromised token does not affect the rest of the customer's library.
7. As a security auditor, I want sequential database IDs to be completely stripped from public JSON payloads, so that no information leakage occurs across public network boundaries.
8. As a security auditor, I want duplicate UUID insertions to be strictly prevented by database-level unique constraints, so that the probability of identifier collisions is effectively zero.
9. As a database instructor/evaluator, I want multi-table relational joins between orders, order items, books, and download logs to join on 64-bit integer keys, so that foreign key indexing adheres to standard relational database design principles.
10. As a database instructor/evaluator, I want to run analytical SQL queries using concise numeric IDs rather than cumbersome UUIDs, so that manual inspection and query verification during grading is clean and effortless.
11. As a database administrator, I want database indexes on `order_number` and `token` to be explicitly defined as unique B-trees, so that lookups by public identifier execute in logarithmic O(log N) time.
12. As a software developer, I want the order creation service to generate a standard UUID v4 automatically upon insert, so that caller functions do not have to coordinate or manually compute unique identifiers.
13. As a software developer, I want the token provisioning service to generate a fresh UUID v4 with quota and expiry timestamps, so that fulfillment logic remains decoupled from token format details.
14. As a software developer, I want database migrations to enforce `NOT NULL` and `UNIQUE` constraints on all UUID columns, so that invalid states cannot be persisted even if application code fails.
15. As a software developer, I want clean repository methods to resolve entities by their public UUIDs, so that API controllers do not have to write manual conversion SQL.

---

## Implementation Decisions

### 1. Database Schema Specifications
- **`orders` table**:
  - `id`: `BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY` (internal surrogate key).
  - `order_number`: `VARCHAR(64)` (or native PostgreSQL `UUID`), `NOT NULL UNIQUE`.
  - An explicit unique B-tree index is maintained on `order_number`.
  - Child tables (`order_items`, `payments`, `user_library`) store `order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE/RESTRICT`, never referencing `order_number`.
- **`download_tokens` table**:
  - `id`: `BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY` (internal surrogate key).
  - `token`: `VARCHAR(64)` (or native PostgreSQL `UUID`), `NOT NULL UNIQUE`.
  - An explicit unique B-tree index is maintained on `token`.
  - Child audit table `download_logs` references `download_token_id BIGINT REFERENCES download_tokens(id) ON DELETE SET NULL`.
- **All other entities** (`users`, `books`, `categories`, `authors`, `publishers`, `coupons`):
  - Retain `BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY` for internal joins and non-sensitive management.

### 2. Identifier Generation Strategy
- UUID values are generated using standard RFC 4122 Version 4 cryptographic pseudo-random algorithms (`gen_random_uuid()` in PostgreSQL or standard crypto library in application runtime).
- UUID generation occurs within the database insert default or within the data access repository prior to transaction commit.

### 3. API Contract & Surface Sanitization
- Public REST endpoints accept and return UUIDs exclusively:
  - `GET /api/orders/:order_number` (where `:order_number` is a validated UUID v4 string).
  - `GET /api/books/download?token=:token` (where `:token` is a validated UUID v4 string).
- API serialization transforms internal entities into public Data Transfer Objects (DTOs), omitting the internal `id` column from responses sent to unauthorized or external clients.
- Admin APIs allow querying by both `id` and `order_number` for support flexibility.

### 4. Data Validation at the Seam Boundary
- Incoming public identifiers are validated against standard UUID regex/format checks before triggering database queries, rejecting non-UUID inputs early to prevent SQL syntax errors or query injection probes.

---

## Testing Decisions

### What Makes a Good Test
- Tests must verify observable external behavior and contract enforcement, rather than internal implementation mechanics.
- Tests must prove that:
  1. An inserted order acquires a valid, unguessable UUID v4 public identifier.
  2. Public lookups using the UUID succeed and return expected order data.
  3. Relational joins across child tables rely on integer foreign keys and preserve cascade behavior.
  4. Outbound public DTOs omit internal `BIGINT id` values.
  5. Duplicate or malformed UUID queries fail predictably and safely.

### Modules Tested
- **Database Schema & DDL Migration**: Verifies constraint enforcement (`UNIQUE`, `NOT NULL`, `PRIMARY KEY`, `FOREIGN KEY REFERENCES`).
- **Order Data Access & Repository Layer**: Verifies order insertion, automatic UUID assignment, and retrieval by UUID.
- **Fulfillment & Token Access Layer**: Verifies token creation, validation against expiration/quotas, and retrieval by token UUID.
- **API Serializer / Public DTO Mapping**: Verifies that sequential numeric IDs are stripped from public-facing payloads.

### Prior Art
- Standard relational dual-key patterns (Internal Surrogate Key + External Public UUID) used in enterprise payment gateways (e.g. Stripe `pi_...` vs internal DB row IDs).

---

## Out of Scope
- Implementing UUID v7 (time-ordered UUIDs); standard UUID v4 or PostgreSQL `gen_random_uuid()` is sufficient for this project scale.
- Exposing public UUIDs for static catalog entities (`categories`, `authors`, `publishers`), as public enumeration of public book categories is harmless and standard sequential IDs suffice.
- Distributed snowflake ID generators; the project runs on a single PostgreSQL instance (Neon).

---

## Further Notes
- This specification directly fulfills [ADR 0001: Hybrid Identifier Strategy (BIGINT vs. UUID)](file:///c:/Users/bond/Documents/miniproject-db-e-book/docs/adr/0001-hybrid-id-strategy.md).
- The database schema documented in [schema-design.md](file:///c:/Users/bond/Documents/miniproject-db-e-book/docs/database/schema-design.md) already conforms to the column names and constraints detailed herein.
