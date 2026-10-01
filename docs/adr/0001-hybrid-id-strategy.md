# ADR 0001: Hybrid Identifier Strategy (BIGINT vs. UUID)

## Status
Accepted

## Context
In this database mini-project, we need high-performance relational joins and clear indexing, but we also expose public identifiers (order tracking URLs, secure download links) directly to end users.
Using sequential auto-incrementing IDs for public endpoints creates security risks (enumeration attacks, guessing another user's order number or download link). However, using pure UUIDs for all internal foreign keys increases index bloat and makes manual SQL queries more cumbersome during academic grading.

## Decision
We adopt a **Hybrid Identifier Strategy**:
1. All internal tables use `BIGINT GENERATED ALWAYS AS IDENTITY` as their primary key.
2. High-security, publicly exposed identifiers:
   - `orders.order_number`: UUID v4 string
   - `download_tokens.token`: UUID v4 string

## Consequences
- **Positive**:
  - Relational joins (`JOIN ... ON a.id = b.a_id`) remain compact 8-byte integers with optimal B-tree index performance.
  - Easy to write and read SQL queries for the course presentation.
  - Public URLs and download endpoints are unguessable, preventing token forgery or unauthorized order snooping.
- **Negative**:
  - Requires maintaining both an internal `id` and a public UUID column on orders and tokens.
