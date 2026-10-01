# 01: Cart Lifecycle & Digital Idempotency Slice

**What to build:** A database-backed shopping cart service for authenticated users. Customers can get or automatically create their cart, add e-books, remove e-books, and retrieve cart contents joined with book catalog details (title, cover, authors, price). The system enforces digital product uniqueness via `UNIQUE (cart_id, book_id)`, preventing accidental duplicate purchases of digital goods.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] `getOrCreateCart(userId)` finds existing cart or automatically creates a new row in `carts`.
- [ ] `addItem(cartId, bookId)` inserts into `cart_items` referencing target book and cart.
- [ ] Attempting to add an already existing book in the same cart behaves idempotently or rejects duplicate additions without creating multiple rows.
- [ ] Adding an invalid or non-existent `book_id` fails with `NotFoundError`.
- [ ] `removeItem(cartId, bookId)` deletes the specific book from `cart_items`.
- [ ] `getCartWithItems(userId)` returns the active cart, total item count, items array with snapshot prices and book details, and calculated subtotal.
