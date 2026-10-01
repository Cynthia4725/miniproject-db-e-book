# 03: Gated Library Ownership & Download Audit Telemetry Slice

**What to build:** An end-to-end digital fulfillment and audit gate where customers can view their `user_library` of paid titles and initiate downloads. The fulfillment gate verifies active entitlement, checks token quotas/expiration, atomically decrements quota and records client telemetry in `download_logs`, and streams the PDF file.

**Blocked by:** 02: Admin Payment Verification & Atomic Fulfillment Slice

**Status:** completed

- [x] Querying a customer's `user_library` returns only books associated with verified, `PAID` orders.
- [x] Books from unpaid (`PENDING`), unverified (`PAYMENT_SUBMITTED`), or rejected (`REJECTED`) orders do not appear in the library.
- [x] Customers can initiate download requests through their authorized download tokens.
- [x] Successfully fulfilling a download decrements remaining quota and commits client telemetry (user ID, book ID, IP, user-agent, timestamp) into `download_logs`.
- [x] Attempting to download after quota exhaustion (`download_count >= 5`) or expiration is blocked by the gateway.
- [x] An audit query against `download_logs` accurately aggregates download activity per book and per user for analytical reporting.

