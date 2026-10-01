# ADR 0006: Database-Backed Cart Persistence Over Client-Side LocalStorage

## Status
Accepted

## Context
Many quick e-commerce prototypes store active cart contents exclusively in browser `localStorage`. While client-only storage avoids database queries before checkout, it disconnects cart data from the relational database, making cross-device shopping impossible and preventing database-level queries on abandoned carts and customer pre-purchase interest.

## Decision
We implement a **Database-Backed Cart Model** using `carts` and `cart_items` tables tied directly to the user's primary key (`users.id`). A customer must authenticate before adding items to their cart or proceeding to checkout.

## Considered Options
- **Browser LocalStorage**: Rejected because cart contents remain invisible to the database engine and cannot be queried for course demonstrations or relational analysis.
- **Session-Based Ephemeral Cart in Cookies**: Rejected because it requires separate session store infrastructure and does not persist across user devices.

## Consequences
- **Positive**:
  - Full relational modeling of pre-order transactions with cascading foreign keys (`ON DELETE CASCADE`).
  - Enables writing analytical SQL queries on cart abandonment and conversion rates.
  - Cart state seamlessly persists across devices and browser refreshes.
- **Negative**:
  - Requires user authentication prior to adding items to a cart.
