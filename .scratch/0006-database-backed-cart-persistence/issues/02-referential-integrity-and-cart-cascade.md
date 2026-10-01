# 02: Referential Integrity & Cart Deletion Cascade Slice

**What to build:** Relational integrity guarantees and administrative inspection queries for shopping carts. Ensures foreign keys on `carts` and `cart_items` enforce `ON DELETE CASCADE` so deleting a user purges their cart and items, and deleting a book purges it from all active customer carts without leaving orphaned rows. Provides administrative analytics queries to inspect unpurchased books currently sitting in customer carts.

**Blocked by:** 01: Cart Lifecycle & Digital Idempotency Slice

**Status:** ready-for-agent

- [ ] Deleting a user cascades and deletes their `carts` record and all linked `cart_items`.
- [ ] Deleting a book from `books` cascades and purges matching records from `cart_items` across all customer carts.
- [ ] Cart item foreign keys to `carts` and `books` preserve database normalization and prevent orphaned cart rows.
- [ ] Administrative query retrieves active cart items and books in carts to measure unpurchased demand.
