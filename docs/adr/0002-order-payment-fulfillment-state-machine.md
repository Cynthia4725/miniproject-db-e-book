# ADR 0002: Order Payment Lifecycle and Decoupled Fulfillment

## Status
Accepted

## Context
E-book products are intangible digital assets. Once delivered, unauthorized downloads or duplicate fulfillment cannot be physically recalled. The evaluation rubric requires demonstrating a realistic sales lifecycle, transaction management, and an admin verification journey.

## Decision
1. **Decoupled Payments Table**: Separate `payments` from `orders` to hold transfer slip evidence, audit timestamps, and admin reviewer FK.
2. **Explicit State Transitions**:
   - `PENDING` -> `PAYMENT_SUBMITTED` -> `PAID` (or `REJECTED` / `CANCELLED`).
3. **Decoupled Digital Fulfillment**:
   - Book download rights are not granted until the order status reaches `PAID`.
   - On transition to `PAID`, an atomic transaction inserts records into `user_library` and issues a `download_tokens` record with a quota of 5 downloads and 30-day expiration.
   - Each physical download request is audited in `download_logs`.

## Consequences
- **Positive**:
  - Full auditability of who approved the payment and when.
  - Prevents race conditions and unauthorized digital downloads before store verification.
  - Clean state transitions represent classic database transaction management.
- **Negative**:
  - Requires admin intervention (or simulation) before the customer can access their purchased books.
