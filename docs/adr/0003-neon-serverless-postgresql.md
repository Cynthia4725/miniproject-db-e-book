# ADR 0003: Neon Serverless PostgreSQL with Direct SQL Queries

## Status
Accepted

## Context
The application will be deployed as serverless functions on Vercel connecting to a PostgreSQL database. In serverless environments, traditional connection pooling exhausts database connections rapidly on burst traffic. Furthermore, the academic course explicitly grades students on relational modeling and the execution of deep SQL queries (Window Functions, CTEs, Aggregations), which heavy ORMs like Prisma or Hibernate obscure behind abstraction layers.

## Decision
We choose **Neon Serverless PostgreSQL** using the `@neondatabase/serverless` driver over HTTP/WebSocket, executing **Direct Parameterized SQL** instead of an abstraction-heavy ORM.

## Considered Options
- **Local SQLite / MySQL**: Rejected due to lack of native serverless connection resilience and limited advanced analytic window function capabilities in standard free hosting tiers.
- **Heavy ORMs (Prisma / TypeORM)**: Rejected because they hide the raw SQL syntax and introduce cold-start latency in serverless environments.

## Consequences
- **Positive**:
  - Connection pooling issues in Vercel serverless functions are eliminated.
  - SQL queries remain 100% transparent and directly evaluatable by the course instructor.
  - Full access to PostgreSQL analytical capabilities (`DENSE_RANK()`, `LAG()`, `DATE_TRUNC()`).
- **Negative**:
  - Schema migrations and TypeScript type safety must be managed explicitly with SQL scripts rather than automated ORM generators.
