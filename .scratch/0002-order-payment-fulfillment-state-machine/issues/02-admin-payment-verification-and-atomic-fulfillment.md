# 02: Admin Payment Verification & Atomic Fulfillment Slice

**What to build:** Provide store administrators with a verification mechanism to review submitted payments and execute an atomic decision. Approving an order transitions both payment and order to approved/paid, records the admin's ID and timestamp, grants digital ownership in `user_library`, and provisions a `download_tokens` record with a 30-day lifespan and 5-download quota. Rejecting an order records the mandatory rejection reason, marks the order `REJECTED`, and provisions zero digital assets.

**Blocked by:** 01: Payment Slip Submission & State Transition Slice

**Status:** completed

- [x] Approving a payment atomically updates `payments.status = 'APPROVED'`, `verified_by_user_id`, and `verified_at = CURRENT_TIMESTAMP`.
- [x] Approving a payment atomically transitions `orders.order_status` from `PAYMENT_SUBMITTED` to `PAID`.
- [x] Approving a payment atomically inserts purchased books into `user_library` for the order's customer with a unique constraint on `(user_id, book_id)`.
- [x] Approving a payment atomically mints a `download_tokens` record with a valid UUID v4 `token`, 30-day expiration, and `max_downloads = 5`.
- [x] Rejecting a payment requires a rejection reason, updates `payments.status = 'REJECTED'` and `payments.rejection_reason`, and transitions `orders.order_status = 'REJECTED'`.
- [x] Rejecting a payment guarantees that zero rows are inserted into `user_library` and zero tokens are created in `download_tokens`.
- [x] Attempting to directly approve a `PENDING` order (skipping slip submission) is rejected by state machine validation.
- [x] Terminal states (`PAID`, `REJECTED`, `CANCELLED`) cannot be transitioned to any other state.

