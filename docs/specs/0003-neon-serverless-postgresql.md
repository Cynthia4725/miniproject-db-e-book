# Spec: Neon Serverless PostgreSQL with Direct SQL Queries (ADR-0003)

Triage Label: `ready-for-agent`

---

## Problem Statement

Deploying full-stack web applications to modern serverless cloud platforms like Vercel introduces severe database connectivity bottlenecks when using standard TCP connection pools. Each serverless function invocation can open and exhaust connection slots on traditional database servers during traffic spikes. 

Furthermore, standard web frameworks often nudge developers toward heavy Object-Relational Mappers (ORMs) such as Prisma or TypeORM. In the context of an academic Database Systems curriculum, heavy ORMs obscure the raw relational mechanics, prevent students from demonstrating mastery over complex SQL syntax (e.g. Window Functions, Common Table Expressions, multi-table aggregations), and introduce significant cold-start performance penalties in serverless runtimes.

---

## Solution

Integrate **Neon Serverless PostgreSQL** via the official `@neondatabase/serverless` lightweight driver using direct, parameterized SQL:
1. Database communication runs over stateless HTTP fetch protocols, eliminating persistent TCP connection state and preventing connection pool starvation across serverless lambdas on Vercel.
2. The data layer executes **Direct Parameterized SQL** utilizing tagged template literals, ensuring raw SQL queries remain 100% transparent and auditable for academic evaluation while eliminating SQL injection risks.
3. Multi-statement transactional workflows (such as payment approval and library provisioning) are executed inside atomic transaction blocks (`sql.transaction(...)`).
4. Advanced analytical reporting queries leveraging PostgreSQL-specific capabilities (`DENSE_RANK()`, `LAG()`, `DATE_TRUNC()`, CTEs) run natively against the serverless database without ORM impedance mismatch.
5. A unified database client provides centralized environment configuration, error classification, and connection resilience.

---

## User Stories

1. As a database instructor/evaluator, I want to inspect the actual raw SQL statements written in the codebase, so that I can evaluate the student's understanding of relational algebra, joins, and indexing.
2. As a database instructor/evaluator, I want the system to execute complex analytical SQL queries (CTEs, Window Functions `DENSE_RANK()`, `LAG()`), so that I can verify that advanced database concepts function against live data.
3. As a database instructor/evaluator, I want multi-step business mutations to execute within strict database transactions, so that I can confirm ACID guarantees are upheld.
4. As a student developer, I want to run database queries using parameterized tagged template literals, so that query inputs are automatically escaped and immune to SQL injection attacks.
5. As a student developer, I want to connect to PostgreSQL over serverless HTTP without configuring complex local connection pool managers, so that the development and deployment setups remain lightweight.
6. As a student developer, I want clear, typed database error messages when constraints fail (e.g. unique violation, foreign key violation), so that I can return helpful feedback to user interfaces.
7. As a system administrator / DevOps engineer, I want the web application to deploy seamlessly to Vercel without exceeding PostgreSQL connection limits, so that the store stays online during traffic bursts.
8. As a system administrator / DevOps engineer, I want database credentials to be stored securely in serverless environment variables, so that sensitive connection strings never leak to client browsers.
9. As a store customer, I want my product search queries and filters to execute with minimal cold-start latency, so that browsing the catalog feels snappy and responsive.
10. As a store customer, I want my order placement transaction to either succeed entirely or roll back safely if an error occurs, so that my cart and financial records never enter an inconsistent state.
11. As a store administrator, I want the analytics dashboard to compute revenue and rank metrics directly inside PostgreSQL rather than in application memory, so that reports scale smoothly as the catalog grows.
12. As a security auditor, I want all user inputs across search, cart, checkout, and admin verification to be strictly parameterized, so that malicious input strings cannot alter query logic.
13. As a software developer, I want a single centralized database module to initialize the Neon connection, so that database initialization logic is not duplicated across dozens of endpoints.
14. As a software developer, I want database transactions to handle unexpected exceptions by automatically rolling back uncommitted changes, so that database locks and partial records are cleared.
15. As a software developer, I want query result sets to deserialize PostgreSQL types (numbers, timestamps, booleans) into standard JavaScript types predictably, so that UI components render correct formats.

---

## Implementation Decisions

### 1. Driver Selection and Architecture
- Implement the persistence layer using `@neondatabase/serverless`.
- Use the HTTP-based query execution model (`neon(process.env.DATABASE_URL)`).
- Keep connection configuration entirely server-side (only accessible within Next.js Server Components, Server Actions, or Route Handlers).

### 2. Parameterized Query Discipline
- Ban manual string concatenation and dynamic template string interpolation for SQL queries:
  ```ts
  // Forbidden:
  // `SELECT * FROM books WHERE id = ${id}` (raw string concatenation)
  
  // Mandatory:
  // sql`SELECT * FROM books WHERE id = ${id}` (parameterized tagged template)
  ```
- All variable inputs must pass as bound parameters (`$1`, `$2`, etc.) handled by the Neon driver.

### 3. Transaction Management Strategy
- Multi-table operations that must satisfy ACID atomicity must utilize Neon's transaction interface:
  - Checkout & Order Item Creation
  - Payment Approval & User Library / Download Token Minting
  - Download Quota Decrement & Download Log Audit Creation
- Transaction failures must trigger automatic rollbacks and return standardized error objects.

### 4. Error Handling and Constraint Mapping
- Map PostgreSQL error codes to application-level domain errors:
  - `23505` (`unique_violation`): Return conflict error (e.g. email already registered, duplicate cart item).
  - `23503` (`foreign_key_violation`): Return reference error (e.g. invalid book ID, non-existent user).
  - `23514` (`check_violation`): Return validation error (e.g. negative price, invalid role).
- Log unexpected database errors to server logs while returning sanitized error messages to end users.

---

## Testing Decisions

### What Makes a Good Test
- Tests must verify query execution semantics, parameterization safety, and transactional atomicity against the Neon execution boundary.
- Tests must prove:
  1. Parameterized queries with special characters (e.g. quotes, semicolons, dashes) pass safely without SQL syntax breakage or injection.
  2. Multi-step transactional queries commit all rows on complete success.
  3. Inducing a failure midway through a multi-step transaction causes all preceding statements in the block to roll back.
  4. Database constraint violations emit classified error types with appropriate PostgreSQL error codes.
  5. Analytical queries utilizing CTEs and Window Functions (`DENSE_RANK()`, `LAG()`) execute cleanly and return expected columns and row counts.

### Modules Tested
- **Database Client Initializer**: Verifies connection initialization from environment variables.
- **SQL Execution Interface**: Verifies parameterized tagged template queries and parameter binding.
- **Transaction Runner**: Verifies atomic commit and rollback behavior under simulated failure conditions.
- **Analytical Query Suite**: Verifies execution of the 5 business intelligence queries documented in `analytics-reporting.md`.

### Prior Art
- Standard serverless database client patterns recommended by Vercel and Neon for enterprise serverless web applications.

---

## Out of Scope
- Introducing an ORM (Prisma, Drizzle, TypeORM); raw SQL is an explicit requirement for the academic evaluation.
- Local SQLite fallbacks; the project strictly runs on PostgreSQL across development and deployment.
- Custom connection pool tuning (PgBouncer); Neon's serverless HTTP proxy handles serverless scaling natively.

---

## Further Notes
- This specification formalizes [ADR 0003: Neon Serverless PostgreSQL with Direct SQL Queries](file:///c:/Users/bond/Documents/miniproject-db-e-book/docs/adr/0003-neon-serverless-postgresql.md).
- Companion architectural decisions: [ADR 0007: Next.js App Router Architecture with Direct Neon SQL Execution](file:///c:/Users/bond/Documents/miniproject-db-e-book/docs/adr/0007-nextjs-app-router-and-neon-sql.md).
