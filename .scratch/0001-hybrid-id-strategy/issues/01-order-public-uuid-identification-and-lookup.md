# 01: Order Public UUID Identification & Lookup Slice

**What to build:** When a customer places an order, the system must assign an internal sequential 64-bit integer ID for database indexing while automatically generating an unguessable RFC 4122 UUID v4 as the customer-visible order number. Customers can retrieve their order details using this public UUID without revealing the internal numeric sequence, and associated order line items must link via the internal integer foreign key.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] Creating an order record automatically populates `order_number` with a valid, non-null UUID v4 string.
- [x] The `orders` table maintains an internal `BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY` distinct from `order_number`.
- [x] Attempting to insert a duplicate `order_number` is prevented by a database-level unique constraint and unique B-tree index.
- [x] Order line items in `order_items` link to the parent order using the internal `BIGINT order_id` foreign key with `ON DELETE CASCADE`.
- [x] Querying by public `order_number` (UUID string) successfully resolves and returns the order and its child items.
- [x] Modifying catalog book prices after order creation does not alter the historical `order_items.unit_price`.
- [x] Internal sequential `id` is not exposed in public-facing contract representations returned to end users.

