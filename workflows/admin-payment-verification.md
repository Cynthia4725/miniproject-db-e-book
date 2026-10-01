# Workflow: Admin Payment Verification & Fulfillment

## Goal
Process incoming customer payment slips, inspect transfer evidence, approve or reject transactions, and grant digital book access upon approval.

---

## 1. Triggers
- **Trigger**: Store Admin visits `/admin/orders` or filters by status `PAYMENT_SUBMITTED`.

---

## 2. Checkpoint & Decision Brief
- **Checkpoint**: Admin human-in-the-loop inspection.
- **Push Right**: The system prepares all matching data in a clean modal/card before presenting it to the admin:
  - Order Number & Date
  - Customer Name, Email, and Phone
  - Expected Net Amount vs. Reported Paid Amount in Slip
  - Side-by-side view of the Transfer Slip Image
  - List of purchased books
- **Decision**: Admin chooses **[Approve & Fulfill]** or **[Reject]**.

---

## 3. Execution Logic (ACID Transaction)

### Branch A: Admin Clicks [Approve & Fulfill]
Execute within a single database transaction:
1. Update `payments`:
   - `status = 'APPROVED'`
   - `verified_by_user_id = <admin_user_id>`
   - `verified_at = CURRENT_TIMESTAMP`
2. Update `orders`:
   - `order_status = 'PAID'`
   - `updated_at = CURRENT_TIMESTAMP`
3. If order used a coupon, increment `coupons.times_used`:
   - `UPDATE coupons SET times_used = times_used + 1 WHERE id = <coupon_id>`
4. For each book in `order_items`:
   - Insert into `user_library`:
     - `user_id = order.user_id`
     - `book_id = item.book_id`
     - `order_id = order.id`
     - `granted_at = CURRENT_TIMESTAMP`
     *(ON CONFLICT DO NOTHING in case of re-grant)*
   - Insert into `download_tokens`:
     - `token = gen_random_uuid()`
     - `user_id = order.user_id`
     - `book_id = item.book_id`
     - `expires_at = CURRENT_TIMESTAMP + INTERVAL '30 days'`
     - `max_downloads = 5`
     - `download_count = 0`
5. Commit transaction.
6. The books immediately appear in the customer's `/library` bookshelf ready for download.

### Branch B: Admin Clicks [Reject]
Execute within a single database transaction:
1. Admin inputs required `rejection_reason` (e.g., "ยอดเงินไม่ตรงกับคำสั่งซื้อ", "สลิปซ้ำ", "ภาพสลิปไม่ชัดเจน").
2. Update `payments`:
   - `status = 'REJECTED'`
   - `verified_by_user_id = <admin_user_id>`
   - `verified_at = CURRENT_TIMESTAMP`
   - `rejection_reason = <reason>`
3. Update `orders`:
   - `order_status = 'REJECTED'`
   - `updated_at = CURRENT_TIMESTAMP`
4. Commit transaction.
5. Customer can see rejection status and reason under their order detail.

---

## 4. Definition of Done
- No order remains unhandled in the `PAYMENT_SUBMITTED` queue.
- If approved: `payments`, `orders`, `user_library`, and `download_tokens` are atomically committed.
- If rejected: status is updated with audit reason and admin identity.
