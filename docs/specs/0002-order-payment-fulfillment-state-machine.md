# Spec: Order Payment Lifecycle and Decoupled Fulfillment (ADR-0002)

Triage Label: `ready-for-agent`

---

## Problem Statement

Digital electronic books are non-physical, irrevocable goods: once a file is downloaded or an entitlement key is granted, unauthorized access cannot be recalled. If an e-commerce platform automatically grants library ownership or download links before bank transfer evidence is reviewed, bad actors can trigger fraudulent transactions and immediately siphon copyrighted content.

Furthermore, an academic database evaluation mandates demonstrating the complete relational transaction lifecycle (ACID properties, concurrency safety, explicit state transitions, audit logging, and price snapshotting). If payment records are collapsed directly into an order row without an independent payment entity, stores lack auditable proof of transfer slips, reviewer identities, verification timestamps, and rejection rationale.

---

## Solution

Implement an **Explicit Order State Machine** decoupled from a dedicated **Payment Verification and Digital Fulfillment Engine**:
1. An order transitions across discrete, deterministic states: `PENDING` -> `PAYMENT_SUBMITTED` -> `PAID` (or `REJECTED` / `CANCELLED`).
2. Order creation strictly freezes the product price in `order_items.unit_price`, insulating historic transactions from future catalog price fluctuations.
3. Payment evidence (slip image reference, amount paid, transfer timestamp) is recorded in an independent `payments` table referencing the order.
4. Digital book fulfillment is strictly decoupled: ownership rows in `user_library` and access keys in `download_tokens` (with a 30-day lifespan and 5-download quota) are provisioned **only within an atomic database transaction when the payment status reaches `APPROVED` and order reaches `PAID`**.
5. Every file download attempt consumes a quota decrement and logs network telemetry in `download_logs`.
6. If a payment is rejected, the reason is logged, the order is marked `REJECTED`, and zero digital assets are provisioned.

---

## User Stories

1. As a customer, I want to review my shopping cart items and confirm my order, so that the agreed book prices are locked in and an unpaid pending order is reserved for me.
2. As a customer, I want to view a mock PromptPay QR code and exact transfer instructions for my pending order, so that I know where and how much money to transfer.
3. As a customer, I want to upload a payment slip image along with the transfer timestamp, so that the store can verify my payment.
4. As a customer, I want to view the status of my order update to `PAYMENT_SUBMITTED`, so that I know my payment proof was safely received and is awaiting store review.
5. As a customer, I want to receive immediate access to my purchased books in My Library as soon as an administrator approves my payment, so that I can download my reading material without unnecessary delay.
6. As a customer, I want to receive a clear rejection reason if my payment slip was invalid (e.g. incorrect amount, blurry slip), so that I understand why fulfillment did not occur.
7. As a customer, I want to download my purchased book using an authenticated token, so that I can read the file offline on my preferred device.
8. As a customer, I want to see how many downloads I have remaining from my 5-download quota, so that I can manage my download allocations wisely.
9. As a store administrator, I want to see a queue of all orders awaiting verification (`PAYMENT_SUBMITTED`), so that I can review pending customer transfers in a timely manner.
10. As a store administrator, I want to view the customer's uploaded slip image alongside the expected order total, so that I can verify that the transferred amount matches the required net amount.
11. As a store administrator, I want to click an "Approve" button to confirm an order, so that the system automatically and atomically provisions library ownership and download tokens.
12. As a store administrator, I want to click a "Reject" button with a mandatory explanation note, so that fraudulent or erroneous payments are stopped without granting file access.
13. As a store administrator, I want my reviewer ID and timestamp permanently attached to the payment record, so that internal operations maintain full accountability.
14. As a store administrator, I want coupon usage counts to be incremented only when an order is legitimately finalized as paid, so that failed or rejected orders do not prematurely consume promotional quotas.
15. As a database instructor/evaluator, I want the transition from payment approval to digital fulfillment to execute inside a single atomic database transaction (`BEGIN ... COMMIT`), so that partial fulfillment or orphaned library grants cannot occur during server failures.
16. As a database instructor/evaluator, I want historic order items to retain their original purchase price even if the book's catalog price is edited later, so that accounting integrity and historical reporting remain accurate.
17. As a security auditor, I want expired download tokens (`CURRENT_TIMESTAMP > expires_at`) or exhausted tokens (`download_count >= 5`) to be blocked at the database query level, so that unauthorized downloads are prevented.
18. As a security auditor, I want every download execution to capture client IP, user agent, and timestamp in `download_logs`, so that digital rights abuses can be traced.

---

## Implementation Decisions

### 1. State Machine Definitions & Transition Rules
- **Permissible Order Status Values**:
  - `PENDING`: Initial state upon checkout.
  - `PAYMENT_SUBMITTED`: Transitioned only when a customer successfully uploads a payment slip.
  - `PAID`: Terminal success state; transitioned only when an administrator approves the payment.
  - `REJECTED`: Terminal failure state; transitioned when an administrator rejects the submitted slip.
  - `CANCELLED`: Terminal cancellation state; transitioned if customer cancels before payment or if pending order expires.
- **State Transition Guard**:
  - Direct jump from `PENDING` to `PAID` is disallowed.
  - No transition is permitted out of `PAID`, `REJECTED`, or `CANCELLED`.

### 2. Transaction Boundaries
- **Order Placement Boundary**:
  - Generates `orders` row in `PENDING` status.
  - Freezes `unit_price` in `order_items` copied from current book price.
  - Clears `cart_items` for the user.
- **Slip Submission Boundary**:
  - Inserts `payments` record with `status = 'PENDING_REVIEW'`.
  - Updates `orders.order_status = 'PAYMENT_SUBMITTED'`.
- **Payment Verification Boundary (Admin Action)**:
  - If approved:
    ```sql
    -- Atomic block:
    UPDATE payments SET status = 'APPROVED', verified_by_user_id = :admin_id, verified_at = CURRENT_TIMESTAMP WHERE id = :payment_id;
    UPDATE orders SET order_status = 'PAID', updated_at = CURRENT_TIMESTAMP WHERE id = :order_id;
    UPDATE coupons SET times_used = times_used + 1 WHERE id = :coupon_id;
    INSERT INTO user_library (user_id, book_id, order_id, granted_at) VALUES ...;
    INSERT INTO download_tokens (token, user_id, book_id, expires_at, max_downloads, download_count) VALUES ...;
    ```
  - If rejected:
    ```sql
    -- Atomic block:
    UPDATE payments SET status = 'REJECTED', verified_by_user_id = :admin_id, verified_at = CURRENT_TIMESTAMP, rejection_reason = :reason WHERE id = :payment_id;
    UPDATE orders SET order_status = 'REJECTED', updated_at = CURRENT_TIMESTAMP WHERE id = :order_id;
    ```

### 3. Quota and Audit Management
- `download_tokens` initialized with:
  - `expires_at = CURRENT_TIMESTAMP + INTERVAL '30 days'`
  - `max_downloads = 5`
  - `download_count = 0`
- Download streaming endpoint validates `download_count < max_downloads` and `expires_at > CURRENT_TIMESTAMP`, executes an atomic increment `download_count = download_count + 1`, logs an entry into `download_logs`, and streams the PDF.

---

## Testing Decisions

### What Makes a Good Test
- Tests must verify behavioral contracts and state machine invariants across transactional boundaries.
- Tests must prove:
  1. A `PENDING` order correctly captures frozen item prices.
  2. Modifying catalog `books.price` does not alter existing `order_items.unit_price`.
  3. Attempting to approve an order while in `PENDING` status throws an illegal state transition exception.
  4. Approving an order atomically commits changes across `payments`, `orders`, `user_library`, and `download_tokens`.
  5. Rejecting an order records the reviewer ID and rejection reason without provisioning `user_library` or `download_tokens`.
  6. Requesting a download when `download_count >= 5` or `expires_at < NOW()` returns an unauthorized error.
  7. Successful downloads record an entry in `download_logs`.

### Modules Tested
- **Order Management Service / Server Actions**: Verifies checkout, price freezing, and cart clearance.
- **Payment & Verification Service**: Verifies slip submission, admin approval/rejection state transitions, and audit fields.
- **Fulfillment & Entitlement Service**: Verifies library provisioning and token minting upon payment approval.
- **Download Gatekeeper & Audit Logging**: Verifies quota checks, expiration checks, count increments, and log insertion.

### Prior Art
- Standard e-commerce transaction state machines with decoupled settlement (e.g. manual wire transfer / escrow workflows in enterprise ERPs).

---

## Out of Scope
- Automatic Optical Character Recognition (OCR) or bank API webhook reconciliation for bank slips; verification is driven by store administrators via manual review as defined in course requirements.
- Partial order fulfillment (splitting a single order into multiple fulfillment batches); e-book orders are fulfilled in full upon payment approval.
- Customer refund disbursement workflows; rejected payments require customers to contact support or re-submit a valid slip.

---

## Further Notes
- This specification formalizes [ADR 0002: Order Payment Lifecycle and Decoupled Fulfillment](file:///c:/Users/bond/Documents/miniproject-db-e-book/docs/adr/0002-order-payment-fulfillment-state-machine.md).
- Detailed workflow sequences and SQL scripts are cataloged in [customer-purchase-flow.md](file:///c:/Users/bond/Documents/miniproject-db-e-book/workflows/customer-purchase-flow.md), [admin-payment-verification.md](file:///c:/Users/bond/Documents/miniproject-db-e-book/workflows/admin-payment-verification.md), and [download-fulfillment.md](file:///c:/Users/bond/Documents/miniproject-db-e-book/workflows/download-fulfillment.md).
