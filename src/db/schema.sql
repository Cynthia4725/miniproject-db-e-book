-- E-Book Store Relational Schema (PostgreSQL / Neon Database)
-- Normalization: 3NF / BCNF
-- Primary Keys: BIGINT GENERATED ALWAYS AS IDENTITY
-- Public Identifiers: UUID v4

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users Table (Customers and Store Admins)
CREATE TABLE IF NOT EXISTS users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Publishers Table
CREATE TABLE IF NOT EXISTS publishers (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    contact_email VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Authors Table
CREATE TABLE IF NOT EXISTS authors (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Books Table
CREATE TABLE IF NOT EXISTS books (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    isbn VARCHAR(20) UNIQUE,
    publisher_id BIGINT REFERENCES publishers(id) ON DELETE SET NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    discount_price NUMERIC(10, 2) CHECK (discount_price IS NULL OR discount_price >= 0),
    cover_image_url TEXT NOT NULL,
    sample_file_url TEXT,
    file_url TEXT NOT NULL DEFAULT '/public/sample-ebook.pdf',
    file_format VARCHAR(10) NOT NULL DEFAULT 'PDF' CHECK (file_format IN ('PDF', 'EPUB')),
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    page_count INT CHECK (page_count > 0),
    publication_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Book Categories Junction Table (Many-to-Many, 3NF)
CREATE TABLE IF NOT EXISTS book_categories (
    book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (book_id, category_id)
);
CREATE INDEX IF NOT EXISTS idx_book_categories_category_id ON book_categories(category_id);

-- 7. Book Authors Junction Table (Many-to-Many, 3NF)
CREATE TABLE IF NOT EXISTS book_authors (
    book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    author_id BIGINT NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
    author_role VARCHAR(50) NOT NULL DEFAULT 'main_author',
    PRIMARY KEY (book_id, author_id)
);
CREATE INDEX IF NOT EXISTS idx_book_authors_author_id ON book_authors(author_id);

-- 8. Carts Table
CREATE TABLE IF NOT EXISTS carts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. Cart Items Table
CREATE TABLE IF NOT EXISTS cart_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cart_id BIGINT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_cart_book UNIQUE (cart_id, book_id)
);
CREATE INDEX IF NOT EXISTS idx_cart_items_book_id ON cart_items(book_id);

-- 10. Coupons Table
CREATE TABLE IF NOT EXISTS coupons (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('FIXED', 'PERCENTAGE')),
    discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
    min_spend NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_to TIMESTAMPTZ NOT NULL,
    usage_limit INT NOT NULL DEFAULT 100,
    times_used INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 11. Orders Table (Hybrid Identifier: BIGINT id + UUID order_number)
CREATE TABLE IF NOT EXISTS orders (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_number VARCHAR(64) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    subtotal_amount NUMERIC(10, 2) NOT NULL CHECK (subtotal_amount >= 0),
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    net_amount NUMERIC(10, 2) NOT NULL CHECK (net_amount >= 0),
    coupon_id BIGINT REFERENCES coupons(id) ON DELETE SET NULL,
    order_status VARCHAR(30) NOT NULL DEFAULT 'PENDING' 
        CHECK (order_status IN ('PENDING', 'PAYMENT_SUBMITTED', 'PAID', 'REJECTED', 'CANCELLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);

-- 12. Order Items Table (Frozen Price Snapshot)
CREATE TABLE IF NOT EXISTS order_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_order_book UNIQUE (order_id, book_id)
);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_book_id ON order_items(book_id);

-- 13. Payments Table (Transfer Slip Verification)
CREATE TABLE IF NOT EXISTS payments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'PROMPTPAY',
    amount_paid NUMERIC(10, 2) NOT NULL CHECK (amount_paid >= 0),
    slip_image_url TEXT NOT NULL,
    transferred_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_REVIEW'
        CHECK (status IN ('PENDING_REVIEW', 'APPROVED', 'REJECTED')),
    verified_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- 14. User Library Table (Permanent Entitlement)
CREATE TABLE IF NOT EXISTS user_library (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_book_library UNIQUE (user_id, book_id)
);
CREATE INDEX IF NOT EXISTS idx_user_library_user_id ON user_library(user_id);

-- 15. Download Tokens Table (Hybrid Identifier: BIGINT id + UUID token)
CREATE TABLE IF NOT EXISTS download_tokens (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    token VARCHAR(64) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    max_downloads INT NOT NULL DEFAULT 5 CHECK (max_downloads > 0),
    download_count INT NOT NULL DEFAULT 0 CHECK (download_count >= 0),
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_download_tokens_token ON download_tokens(token);
CREATE INDEX IF NOT EXISTS idx_download_tokens_user_book ON download_tokens(user_id, book_id);

-- 16. Download Logs Table (Audit Telemetry)
CREATE TABLE IF NOT EXISTS download_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    download_token_id BIGINT REFERENCES download_tokens(id) ON DELETE SET NULL,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    downloaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_download_logs_user_id ON download_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_download_logs_book_id ON download_logs(book_id);
CREATE INDEX IF NOT EXISTS idx_download_logs_downloaded_at ON download_logs(downloaded_at);
