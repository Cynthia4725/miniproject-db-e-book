# 02: Customer Shopping Journey & Server Actions Slice

**What to build:** The complete end-to-end customer shopping flow built with React Server Components and Server Actions. Customers can browse and filter books by category at `/`, view details at `/books/[id]`, add/remove items and apply coupons at `/cart`, execute atomic checkout, submit payment slips at `/orders/[order_number]/pay`, and download granted e-books from `/library`.

**Blocked by:** 01: Lightweight Cookie Session, Role Guards & Demo Account Switcher Slice

**Status:** completed

- [x] `/` (Catalog Home) renders book catalog with search, category filtering, and live prices via server-side direct SQL.
- [x] `/books/[id]` renders detailed metadata, author credits, and interactive "Add to Cart" action.
- [x] `/cart` renders database-backed cart items, calculates subtotal/discounts, and provides "Checkout" action.
- [x] Checkout Server Action executes atomic checkout transaction, creating order in `PENDING` status and redirecting to payment page.
- [x] `/orders/[order_number]/pay` displays mock PromptPay QR code, order details, and handles slip upload submission to transition order to `PAYMENT_SUBMITTED`.
- [x] `/library` displays purchased e-books for the authenticated customer with active download links.
