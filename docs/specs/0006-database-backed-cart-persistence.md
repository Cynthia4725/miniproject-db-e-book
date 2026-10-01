# Spec: Database-Backed Cart Persistence Over Client-Side LocalStorage (ADR-0006)

Triage Label: `ready-for-agent`

---

## Problem Statement

Storing shopping cart items purely in client-side browser storage (such as `localStorage` or session cookies) hides critical transactional state from the relational database engine. This client-only approach creates multiple user-experience and architectural failures:
1. Shopping carts vanish when users switch devices (e.g. from mobile phone to laptop) or clear their browser cache, causing frustrating cart abandonment.
2. In an academic database course, client-side carts fail to demonstrate relational modeling of pre-checkout transactions, foreign key cascading constraints, and atomic checkout transitions.
3. Database administrators and store managers cannot query pre-purchase intent, cart abandonment metrics, or conversion funnels using SQL because cart data does not exist in the database.
4. Digital goods have unique business constraints: unlike physical goods, purchasing duplicate digital licenses in the same cart is invalid and must be prevented at the database schema level.

---

## Solution

Implement a **Database-Backed Cart Model** governed by normalized relational tables (`carts` and `cart_items`) tied directly to authenticated user accounts:
1. Every authenticated customer is associated with an active shopping cart (`carts` table) via a 1:1 relationship on `user_id`.
2. Individual items within the cart are stored in `cart_items`, referencing the target book with a composite unique constraint `UNIQUE (cart_id, book_id)`, naturally preventing accidental duplicate purchases of digital e-books.
3. Referential integrity is strictly maintained through `ON DELETE CASCADE`: deleting a user automatically purges their cart and items, and deleting a book from the catalog automatically purges it from all active customer carts without application intervention.
4. During checkout, an atomic database transaction (`BEGIN ... COMMIT`) reads the cart items, snapshots their current prices into `order_items`, creates the `orders` record, and clears the customer's `cart_items`. If any step fails, the cart remains intact.
5. Cart data is available for business intelligence queries, such as identifying popular unpurchased books or abandoned carts.

---

## User Stories

1. As a store customer, I want to add books to my shopping cart and find them waiting for me when I log in from a different computer, so that my shopping progress is never lost.
2. As a store customer, I want to see an indicator if I try to add a book that is already in my cart, so that I do not accidentally pay twice for the same digital title.
3. As a store customer, I want to view my cart with current book titles, cover images, author names, and up-to-date prices, so that I can review my selections before initiating checkout.
4. As a store customer, I want to remove individual books from my cart, so that I can change my mind before paying.
5. As a store customer, I want my cart to be completely cleared upon successful order placement, so that I do not accidentally order the same books again.
6. As a store customer, I want my cart items to remain safe in my cart if order checkout fails, so that I do not have to rebuild my cart from scratch.
7. As a store administrator, I want to query the database to see which books are currently sitting in customer carts, so that I can gauge upcoming demand and customer interest.
8. As a store administrator, I want to delete or deactivate a book and have it automatically removed from customer carts, so that customers cannot checkout unavailable inventory.
9. As a database instructor/evaluator, I want the cart model to be fully represented in the relational schema with primary and foreign keys, so that I can grade the relational schema design.
10. As a database instructor/evaluator, I want to inspect the composite unique constraint `UNIQUE (cart_id, book_id)`, so that I can confirm that business logic is enforced by database schema constraints.
11. As a database instructor/evaluator, I want to verify that checking out a cart executes an atomic transition from `cart_items` to `order_items`, so that data consistency is maintained.
12. As a database administrator, I want foreign keys on `carts` and `cart_items` to enforce `ON DELETE CASCADE`, so that orphan records are automatically prevented by the PostgreSQL engine.
13. As a software developer, I want a single function/action to add an item to a cart that creates the parent cart record automatically if it does not yet exist, so that code paths remain simple.
14. As a software developer, I want cart retrieval queries to join with `books` using standard SQL, so that current book details are fetched in a single query.
15. As a software developer, I want cart operations to require user authentication, so that cart records are always cleanly attached to an authenticated `user_id`.

---

## Implementation Decisions

### 1. Database Schema Specifications
- **`carts` table**:
  - `id`: `BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`
  - `user_id`: `BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE`
  - `updated_at`: `TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`
- **`cart_items` table**:
  - `id`: `BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`
  - `cart_id`: `BIGINT NOT NULL REFERENCES carts(id) ON DELETE CASCADE`
  - `book_id`: `BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE`
  - `added_at`: `TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`
  - `CONSTRAINT uq_cart_book UNIQUE (cart_id, book_id)`
  - Explicit secondary index on `book_id` to optimize reverse cascade operations.

### 2. Digital Product Constraint (No Quantity Column)
- Physical goods require a `quantity INT` column. In this digital e-book domain, licenses are purchased once per customer.
- Therefore, the schema explicitly omits a `quantity` column in favor of the composite unique constraint `UNIQUE (cart_id, book_id)`. Adding a book that already exists is handled as an idempotent `ON CONFLICT DO NOTHING` or returns a user-friendly notice.

### 3. Atomic Cart-to-Order Checkout Procedure
Checkout executes inside a single database transaction:
```sql
-- 1. Read cart items and lock prices
SELECT ci.book_id, b.price, b.discount_price 
FROM cart_items ci
JOIN books b ON ci.book_id = b.id
WHERE ci.cart_id = :cart_id;

-- 2. Compute subtotal and net amounts (apply coupon if present)
-- 3. Insert order
INSERT INTO orders (order_number, user_id, subtotal_amount, discount_amount, net_amount, coupon_id, order_status)
VALUES (:order_uuid, :user_id, :subtotal, :discount, :net, :coupon_id, 'PENDING')
RETURNING id;

-- 4. Insert order items snapshotting frozen prices
INSERT INTO order_items (order_id, book_id, unit_price)
SELECT :order_id, ci.book_id, COALESCE(b.discount_price, b.price)
FROM cart_items ci
JOIN books b ON ci.book_id = b.id
WHERE ci.cart_id = :cart_id;

-- 5. Wipe cart items
DELETE FROM cart_items WHERE cart_id = :cart_id;
```

---

## Testing Decisions

### What Makes a Good Test
- Tests must verify relational constraints, idempotency, cascading deletions, and transactional cart clearance across the cart management boundary.
- Tests must prove:
  1. Adding a book creates a `carts` row and inserts a `cart_items` record tied to the user.
  2. Attempting to insert duplicate book entries for the same cart violates the unique constraint or behaves idempotently without creating duplicate rows.
  3. Deleting a book from `books` cascades and purges matching entries from `cart_items`.
  4. Deleting a user from `users` cascades and purges the user's `carts` and `cart_items`.
  5. Checkout atomically creates an `Order` and `OrderItems` with frozen prices while wiping `cart_items`.
  6. If checkout fails midway, the database transaction rolls back, preserving all items in `cart_items`.

### Modules Tested
- **Cart Service / Server Actions**: Verifies adding, removing, and listing cart items.
- **Checkout Transaction Coordinator**: Verifies atomic transfer from `cart_items` to `order_items` and cart deletion.
- **Database Schema & DDL Migration**: Verifies `UNIQUE (cart_id, book_id)` and `ON DELETE CASCADE` constraint behavior.

### Prior Art
- Standard relational cart schemas in enterprise e-commerce platforms (e.g. Magento / Spree commerce database architectures).

---

## Out of Scope
- Guest shopping carts (carts without user accounts); users must log in before adding items to their cart as defined in project scope.
- Saved-for-later or wishlist tables; the cart manages active purchasing candidates only.
- Cart item quantity adjustment (> 1); e-books are limited to 1 copy per customer.

---

## Further Notes
- This specification formalizes [ADR 0006: Database-Backed Cart Persistence Over Client-Side LocalStorage](file:///c:/Users/bond/Documents/miniproject-db-e-book/docs/adr/0006-database-backed-cart-persistence.md).
- Companion architectural decisions: [ADR 0002: Order Payment Lifecycle and Decoupled Fulfillment](file:///c:/Users/bond/Documents/miniproject-db-e-book/docs/adr/0002-order-payment-fulfillment-state-machine.md) and [customer-purchase-flow.md](file:///c:/Users/bond/Documents/miniproject-db-e-book/workflows/customer-purchase-flow.md).
