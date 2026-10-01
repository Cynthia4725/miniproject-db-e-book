# Domain Glossary: E-Book Store Database & Prototype

This glossary defines canonical domain terms used throughout the database schema, business rules, API/workflows, and analytical SQL reports.

---

## 1. Actor & Security Entities

### `User`
- **Definition**: An identified account holder in the system.
- **Attributes**: `id`, `email`, `password_hash`, `full_name`, `phone`, `role`, `created_at`, `updated_at`.
- **Roles**:
  - `customer`: Can browse books, maintain a cart, place orders, upload payment slips, and access their library.
  - `admin`: Can manage catalog books/categories, review payment slips, approve/reject orders, and view business analytics.

---

## 2. Catalog & Digital Asset Entities

### `Author`
- **Definition**: The creator or contributor of a book.
- **Attributes**: `id`, `name`, `bio`, `created_at`.

### `Publisher`
- **Definition**: The publishing entity distributing the book.
- **Attributes**: `id`, `name`, `contact_email`, `created_at`.

### `Category`
- **Definition**: A subject, genre, or taxonomy term used to classify books (e.g., Computer Science, Business, Fiction).
- **Attributes**: `id`, `name`, `slug`, `description`, `created_at`.

### `Book`
- **Definition**: The commercial digital book product.
- **Attributes**: `id`, `title`, `subtitle`, `isbn`, `publisher_id`, `price`, `discount_price`, `cover_image_url`, `sample_file_url`, `file_url`, `file_format` (PDF/EPUB), `file_size_bytes`, `page_count`, `publication_date`, `is_active`, `created_at`, `updated_at`.

### `BookCategory`
- **Definition**: A junction entity resolving the Many-to-Many relationship between `Book` and `Category`.
- **Attributes**: `book_id`, `category_id`. Composite Primary Key `(book_id, category_id)`.

### `BookAuthor`
- **Definition**: A junction entity resolving the Many-to-Many relationship between `Book` and `Author` (accommodates multi-author books).
- **Attributes**: `book_id`, `author_id`, `author_role` (e.g. `main_author`, `co_author`, `translator`). Composite Primary Key `(book_id, author_id)`.

---

## 3. Commercial & Ordering Entities

### `Cart` & `CartItem`
- **Cart Definition**: An active pre-checkout container tied to a registered `User`.
- **CartItem Definition**: A line item inside a cart referencing a `Book` and `added_at`. In e-books, quantity is typically constrained to 1 per book per user.

### `Coupon`
- **Definition**: A promotional discount code applicable during checkout.
- **Attributes**: `id`, `code`, `discount_type` (`FIXED` or `PERCENTAGE`), `discount_value`, `min_spend`, `valid_from`, `valid_to`, `usage_limit`, `times_used`, `is_active`.

### `Order`
- **Definition**: A legally binding purchase agreement created when a customer checks out their cart.
- **Attributes**: `id`, `order_number`, `user_id`, `subtotal_amount`, `discount_amount`, `net_amount`, `coupon_id` (nullable), `order_status`, `created_at`, `updated_at`.
- **Order Status Values**:
  - `PENDING`: Order created; awaiting customer payment and slip submission.
  - `PAYMENT_SUBMITTED`: Payment slip uploaded by customer; awaiting admin review.
  - `PAID`: Payment approved by admin; book licenses granted to user library.
  - `REJECTED`: Payment slip invalidated by admin; reason logged.
  - `CANCELLED`: Order timed out or cancelled by customer prior to payment submission.

### `OrderItem`
- **Definition**: An immutable snapshot of each purchased book within an `Order`.
- **Attributes**: `id`, `order_id`, `book_id`, `unit_price` (frozen at time of order), `created_at`.

### `Payment`
- **Definition**: A financial settlement record containing payment proof and verification lifecycle.
- **Attributes**: `id`, `order_id`, `payment_method` (e.g. `PROMPTPAY`), `amount_paid`, `slip_image_url`, `transferred_at`, `status` (`PENDING_REVIEW`, `APPROVED`, `REJECTED`), `verified_by_user_id` (FK to admin user), `verified_at`, `rejection_reason`, `created_at`.

---

## 4. Fulfillment & Access Tracking Entities

### `UserLibrary`
- **Definition**: Permanent digital entitlement granting a user ownership/read access to a purchased book.
- **Attributes**: `id`, `user_id`, `book_id`, `order_id`, `granted_at`. Unique constraint on `(user_id, book_id)`.

### `DownloadToken`
- **Definition**: A secure, time-limited, quota-limited token generated when a user requests to download a file from their library.
- **Attributes**: `id`, `token` (UUID v4), `user_id`, `book_id`, `expires_at`, `max_downloads`, `download_count`, `is_revoked`, `created_at`.

### `DownloadLog`
- **Definition**: Audit logging table capturing each time an e-book file is downloaded.
- **Attributes**: `id`, `download_token_id`, `user_id`, `book_id`, `ip_address`, `user_agent`, `downloaded_at`.
