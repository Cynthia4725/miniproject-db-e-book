# 01: Payment Slip Submission & State Transition Slice

**What to build:** Allow a customer with a `PENDING` order to submit bank transfer evidence (slip image reference, transferred amount, and payment timestamp). The system records the payment in a dedicated `payments` table with `status = 'PENDING_REVIEW'` and transitions the parent order from `PENDING` to `PAYMENT_SUBMITTED`, while preventing duplicate slip uploads or submissions for cancelled orders.

**Blocked by:** None (can start immediately)

**Status:** completed

- [x] Submitting payment evidence creates a row in the `payments` table referencing `order_id` with `status = 'PENDING_REVIEW'`.
- [x] Submitting payment evidence atomically transitions the parent order's `order_status` from `PENDING` to `PAYMENT_SUBMITTED`.
- [x] Attempting to submit a payment slip for an order that is already in `PAID`, `REJECTED`, or `CANCELLED` status throws an invalid state transition error.
- [x] The `payments` table captures `payment_method`, `amount_paid`, `slip_image_url`, `transferred_at`, and `created_at`.
- [x] Querying the order reflects its updated status `PAYMENT_SUBMITTED` and exposes its pending payment reference.
- [x] Database transactions ensure that if payment insertion fails, the order status is not mutated to `PAYMENT_SUBMITTED`.

