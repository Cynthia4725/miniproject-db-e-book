# Project Notes: E-Book Store Database & Prototype Mini-Project

## 1. Project Background & Course Objective
- **Course**: Database Systems (วิชา Database)
- **Goal**: Develop an E-Book Store system where customers can search, select/buy, simulate payment, and receive download links. Include an admin management portal and analytical reports based on realistic sample data.
- **Key Evaluation Criteria**:
  1. **Relational Database Design**: Correctly mapped to real sales processes, normalized, documented with ERD/Relational Schema, and defensible in presentation.
  2. **Prototype**: Working demonstration of both Customer Journey and Admin Journey.
  3. **SQL & Analytical Reports**: Meaningful business intelligence queries based on group-entered sample data (demonstrating JOIN, GROUP BY, aggregations, subqueries/window functions).
  4. **Responsible AI Usage**: Transparent disclosure of AI assistance and design evolution.

## 2. Core Loops to Specify
- **Loop 1: Customer Journey**: Search/Filter -> Cart/Checkout -> Simulated Payment -> Fulfillment/Download Link Access -> Download Event.
- **Loop 2: Admin & Catalog Management**: Book & Category CRUD -> Inventory/Digital Asset Management -> Order & Payment Verification.
- **Loop 3: Analytics & Reporting Loop**: Transaction logging -> SQL Analytical Queries -> Business Insights Dashboard/Report.

## 3. Confirmed Architecture & Tech Stack (Round 1 Decisions)
- **Database**: PostgreSQL (Hosted on Neon PostgreSQL).
- **Deployment Platform**: Vercel (Next.js / Web Application).
- **Cart & Order Flow**: Multi-item Shopping Cart + Order & Order Items relational model.
- **Payment Verification**: Slip upload by customer -> `PAYMENT_SUBMITTED` -> Admin verification dashboard -> `PAID` / `REJECTED`.
- **Fulfillment**: Digital Library & Secure Download Tokens with download tracking logs.
- **Reporting Dimensions**:
  1. Category Revenue Analysis
  2. Top 5 Best-Selling Books per Category (using `DENSE_RANK()`)
  3. Customer Lifetime Value (LTV) & Purchase Frequency
  4. Download Activity & Engagement Logs
  5. Monthly Sales Trends & Growth Rate
- **AI Accountability**: Detailed tracking in `AI_DISCLOSURE.md` categorized by Architecture, Schema Review, Sample Data Mocking, and Query Optimization.

## 4. Confirmed Entities, Relationships & Business Rules (Round 2 Decisions)
- **Users & Auth**:
  - Unified `users` table with `role` ENUM (`customer`, `admin`).
  - Mandatory registration/login before checkout to bind library ownership and order history.
- **Catalog & Master Data**:
  - `books` table with metadata (title, subtitle, isbn, price, sample_url, file_url, cover_url, publication_year).
  - `authors` table (1:N or M:N with `book_authors`).
  - `publishers` table (1:N with `books`).
  - `categories` table and `book_categories` junction table (Many-to-Many).
- **Cart & Ordering**:
  - `carts` & `cart_items` for session/user shopping cart.
  - `orders` (`order_status`: `PENDING`, `PAYMENT_SUBMITTED`, `PAID`, `REJECTED`, `CANCELLED`).
  - `order_items`: Includes `unit_price` snapshot at the time of purchase.
  - `coupons`: Promotion codes with discount type (fixed/percentage), minimum spend, validity range, and usage limits.
- **Payments & Audit**:
  - `payments` table: Linked 1:1 or 1:N to `orders`, storing `slip_image_url`, `amount`, `payment_method`, `paid_at`, `status`, `verified_by_user_id` (FK to admin user), `verified_at`, `rejection_reason`.
- **Fulfillment & Access Tracking**:
  - `user_library`: Permanent digital bookshelf granting access to purchased books.
  - `download_tokens`: Temporary secure tokens with expiration time and maximum download limits.
  - `download_logs`: Audit trail recording `user_id`, `book_id`, `downloaded_at`, `ip_address`, `user_agent`.

## 5. Confirmed Architectural Foundations (Round 3 & 4 Decisions)
- **Primary Key Strategy**: Hybrid. Internal `BIGINT GENERATED ALWAYS AS IDENTITY` for fast relational joins and indexes; UUID v4 for external identifiers (`order_number`, `download_tokens.token`) for confidentiality and tamper-proof links.
- **File Asset Architecture**: Static assets & mock files. High-res book covers and mock slip assets using reliable web URLs / base64; real sample PDF served directly via `/public/sample-ebook.pdf` to guarantee 100% reliable zero-dependency download demo.
- **Web App Stack & Runtime**: Next.js (App Router, React Server Components & Server Actions) with Tailwind CSS deployed on Vercel.
- **Database Access Pattern**: Direct parameterized SQL using `@neondatabase/serverless` HTTP driver (`sql\`...\``) running inside server components and server actions without heavy ORM.
- **Authentication Strategy**: Encrypted HTTP-only session cookies with built-in Demo Account Switcher (`Customer: somchai@example.com` vs `Admin: admin@ebookstore.com`) for friction-free evaluation.
- **Sample Dataset Theme & Scale**:
  - Theme: Tech & Business E-Books.
  - Scale: 5 Categories, ~20 Books, 8-10 Authors, 3 Publishers, 10-15 Customers, 2 Admins, 25-35 historical orders across a 3-4 month window, and 40-50 download audit logs.
- **Prototype Screen Scope**:
  - Customer Journey (5 screens): Catalog/Home, Book Detail, Cart & Checkout, Payment & Slip Upload, My Library & Download.
  - Admin Journey (3 screens): Slip Verification & Order Approval, Catalog Book Management, Business Analytics Dashboard.

## 6. Current Phase
- **Phase**: Architecture, ADRs (0001-0007), Domain Glossary, and Specifications Complete. Ready for next step (e.g. Next ADR spec or DDL SQL Script).




