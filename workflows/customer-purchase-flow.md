# Workflow: Customer Purchase & Slip Submission

## Goal
Guide a customer from browsing the e-book catalog through cart checkout, coupon validation, order creation, and payment slip submission.

---

## 1. Triggers
- **Trigger**: Customer action — clicking **"Place Order"** from Cart, followed by **"Submit Payment Slip"** on the payment page.

---

## 2. Steps & Data Operations

### Step 1: Cart & Coupon Calculation
1. The user reviews items in their active cart (`carts` & `cart_items`).
2. Optional coupon application:
   - System checks `coupons`:
     - `is_active = TRUE`
     - `CURRENT_TIMESTAMP BETWEEN valid_from AND valid_to`
     - `times_used < usage_limit`
     - `subtotal >= min_spend`
   - Calculates discount amount (fixed amount or percentage).
   - Computes `net_amount = subtotal - discount_amount`.

### Step 2: Order Creation (Transaction Block)
Inside an ACID transaction:
1. Insert new record into `orders`:
   - `order_number`: UUID v4 string
   - `user_id`: Logged-in customer ID
   - `subtotal_amount`, `discount_amount`, `net_amount`
   - `coupon_id`: nullable FK
   - `order_status`: `'PENDING'`
2. For each cart item, insert into `order_items`:
   - `order_id`: Newly created order ID
   - `book_id`: Book ID
   - `unit_price`: Snapshot of current `books.price` (or `books.discount_price` if active)
3. Clear items from the customer's `cart_items`.
4. Commit transaction.
5. Redirect customer to `/orders/[order_number]/pay`.

### Step 3: Payment Slip Submission
1. Customer views order summary and mock PromptPay QR code.
2. Customer selects/uploads slip image (Base64 / URL).
3. Customer submits form.
4. System executes state transition inside a transaction:
   - Insert into `payments`:
     - `order_id`: Order ID
     - `payment_method`: `'PROMPTPAY'`
     - `amount_paid`: Transferred amount entered by user
     - `slip_image_url`: Uploaded slip asset reference
     - `transferred_at`: Timestamp reported on slip
     - `status`: `'PENDING_REVIEW'`
   - Update `orders`:
     - `order_status = 'PAYMENT_SUBMITTED'`
     - `updated_at = CURRENT_TIMESTAMP`
5. Show confirmation screen to customer: *"Your payment slip has been submitted and is awaiting store verification."*

---

## 3. Definition of Done
- Order exists in `orders` with status `PAYMENT_SUBMITTED`.
- Line items are immutably captured in `order_items` with frozen unit prices.
- Payment slip record is queued in `payments` table with status `PENDING_REVIEW`.
- Cart is emptied.
