# 03: Atomic Cart-to-Order Checkout & Price Snapshot Slice

**What to build:** An atomic checkout transaction coordinator that transitions items from customer carts into permanent orders. Inside a single database transaction, the coordinator validates cart items, freezes current book prices into `order_items`, generates a pending `orders` record with public UUID `order_number`, applies optional coupon discounts, and clears the user's `cart_items`. If any step fails, the entire transaction rolls back, preserving cart items intact.

**Blocked by:** 01: Cart Lifecycle & Digital Idempotency Slice

**Status:** completed

- [x] Checkout fails with `ValidationError` when attempting to checkout an empty cart.
- [x] Checkout reads cart items and snapshots current catalog prices into `order_items.unit_price`.
- [x] Checkout creates `orders` record with status `PENDING`, valid public UUID `order_number`, and accurate subtotal and net amounts.
- [x] Optional valid coupon discount is computed and recorded in `orders.coupon_id` and `discount_amount`.
- [x] Successful checkout completely clears all `cart_items` for the target cart.
- [x] Transaction abort or failure rolls back all database modifications, leaving `cart_items` completely intact.
