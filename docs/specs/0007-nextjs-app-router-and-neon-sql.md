# Spec: Next.js App Router Architecture with Direct Neon SQL Execution (ADR-0007)

Triage Label: `ready-for-agent`

---

## Problem Statement

When deploying a relational database application to a serverless platform such as Vercel, traditional single-page application (SPA) patterns or separate client/server repositories introduce serious architectural friction. Client-side fetching risks leaking database credentials or internal schema structures to the browser, while external REST API layers add redundant serialization boilerplate.

Furthermore, academic grading sessions are high-stakes, time-limited demonstrations. If the web prototype relies on external third-party OAuth providers (Google, GitHub, Auth0), evaluation can fail due to mismatched redirect URIs, OAuth rate limits, or network firewall restrictions on campus Wi-Fi. Finally, the evaluation rubric requires demonstrating clear separation of user roles (Customer Journey vs. Store Administrator Journey) and directly observable, auditable SQL queries rather than opaque ORM abstractions.

---

## Solution

Build the application as a unified, full-stack **Next.js (App Router)** web application styled with **Tailwind CSS** and executing direct parameterized SQL against **Neon Serverless PostgreSQL**:
1. **Server-Side Rendering with React Server Components (RSC)**: All read operations (catalog browsing, book detail, library bookshelf, admin orders table) execute on the serverless backend, streaming pre-rendered HTML to the client and keeping database connection strings and credentials 100% isolated from the browser.
2. **Server Actions for Mutations**: All state changes (adding to cart, checkout, slip submission, admin payment verification, book catalog editing) execute via Next.js Server Actions, directly invoking `@neondatabase/serverless` tagged template queries inside atomic database transactions.
3. **Self-Contained Session Authentication**: Implement a lightweight, secure HTTP-only cookie session mechanism backed by password verification. Provide a **Demo Account Switcher** component in the navigation/login bar, enabling grading faculty and evaluators to switch seamlessly between a sample Customer persona (`somchai@example.com`) and a sample Administrator persona (`admin@ebookstore.com`) in a single click without external OAuth dependencies.
4. **Server Action Role Guards**: Restrict all administrative routes (`/admin/*`) and administrative server actions, verifying the caller's session role before executing administrative database mutations.
5. **Modern, Responsive Visuals**: Implement all 8 core screens using Tailwind CSS, ensuring a polished, responsive presentation on laptop, tablet, and mobile displays.

---

## User Stories

1. As a store customer, I want to browse the book catalog with instant page loads, so that I can discover titles without staring at loading spinners.
2. As a store customer, I want to submit my payment slip through a simple form, so that the store receives my transfer evidence securely.
3. As a store customer, I want to view my purchased books in My Library immediately after my payment is verified, so that I can download and read my books.
4. As a store customer, I want the web interface to display comfortably on my smartphone and laptop, so that I have a consistent shopping experience across devices.
5. As a store administrator, I want to access an administrative dashboard at `/admin`, so that I can review pending payment slips and manage book catalog entries.
6. As a store administrator, I want to approve or reject customer payment slips from a unified review screen, so that orders are processed promptly.
7. As a store administrator, I want to view real-time analytical reports (Category revenue, best-selling books via `DENSE_RANK()`, customer LTV, and monthly trends via `LAG()`), so that I can understand store sales performance.
8. As a database instructor/evaluator, I want to click a "Demo Switcher" button to switch instantly between customer and administrator views, so that I can evaluate both user journeys without manual registration or third-party OAuth setup.
9. As a database instructor/evaluator, I want to inspect the source code and observe readable, parameterized SQL queries in server components and server actions, so that I can assess the student's mastery of SQL.
10. As a database instructor/evaluator, I want the web application to deploy and run reliably on Vercel without connection timeout errors, so that the live project link works during final grading.
11. As a security auditor, I want database connection credentials to remain exclusively on the server runtime, so that no sensitive database URLs are exposed in client-side JavaScript bundles.
12. As a security auditor, I want administrative server actions to enforce role-based authorization checks, so that unprivileged customers cannot approve orders or tamper with catalog prices.
13. As a security auditor, I want session tokens to be stored in HTTP-only, SameSite cookies, so that sessions are protected from Cross-Site Scripting (XSS) extraction.
14. As a software developer, I want Server Actions to revalidate the relevant page paths (`revalidatePath`) after database mutations, so that UI displays reflect updated database state immediately without manual page refreshes.
15. As a software developer, I want Server Actions to return structured response objects (`{ success: true, data }` or `{ success: false, error }`), so that client forms can render clear success banners or error alerts.

---

## Implementation Decisions

### 1. App Router Page Structure (8 Core Views)
- **Customer Journey**:
  1. `/` (Catalog Home): Search, category filter tabs, book cards with cover, price, author.
  2. `/books/[id]` (Book Detail): Full metadata, description, sample read preview, "Add to Cart" button.
  3. `/cart` (Cart & Checkout): Table of cart items, coupon input, subtotal/net calculation, "Checkout" button.
  4. `/orders/[order_number]/pay` (Payment & Slip Upload): Order summary, mock PromptPay QR display, file input for slip, "Submit Slip" button.
  5. `/library` (Customer Bookshelf): Grid of purchased books with "Download PDF" action buttons.
- **Administrator Journey**:
  6. `/admin/orders` (Slip Verification Queue): Table of orders filtered by `PAYMENT_SUBMITTED`, modal displaying slip image, "Approve" and "Reject with reason" actions.
  7. `/admin/books` (Catalog Management): CRUD list of books, add book form, edit price, toggle active status.
  8. `/admin/analytics` (Business Intelligence Dashboard): KPI cards, category revenue breakdown, top books per category, and monthly growth tables powered by the 5 analytical SQL queries.

### 2. Session Authentication & Role Switcher
- Session storage: An HTTP-only, SameSite, Secure cookie named `ebook_session`.
- Session payload encodes `{ userId: number, role: 'customer' | 'admin', name: string }` signed with a secret token.
- Utility functions:
  - `getCurrentUser()`: Reads cookie, verifies signature, returns user payload or null.
  - `requireRole(allowedRoles)`: Throws redirect or unauthorized error if current user does not hold an authorized role.
- Demo Switcher Component: A floating header widget offering:
  - **"Login as Customer (Somchai)"**: Seeds/selects customer user, sets customer session cookie.
  - **"Login as Admin (Manager)"**: Seeds/selects admin user, sets admin session cookie.
  - **"Logout"**: Clears session cookie.

### 3. Server Action Execution Pattern
- Server actions defined with `"use server"`:
  ```ts
  export async function verifyPaymentAction(prevState: any, formData: FormData) {
    const user = await getCurrentUser();
    if (user?.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Admin privileges required.' };
    }
    
    // Execute atomic Neon SQL transaction:
    // UPDATE payments ...
    // UPDATE orders ...
    // INSERT INTO user_library ...
    // INSERT INTO download_tokens ...
    
    revalidatePath('/admin/orders');
    return { success: true };
  }
  ```

---

## Testing Decisions

### What Makes a Good Test
- Tests must verify server-side authorization enforcement, session integrity, and mutation result handling across the Next.js server boundary.
- Tests must prove:
  1. Unauthenticated requests to `/admin` routes redirect to login or return an unauthorized status.
  2. Customers attempting to invoke admin Server Actions (e.g. `verifyPaymentAction`) are blocked and receive an error response.
  3. Admins invoking `verifyPaymentAction` successfully execute the database mutation and record `verified_by_user_id`.
  4. The Demo Switcher sets a valid session cookie that correctly alters `getCurrentUser()` output.
  5. Read operations in Server Components execute direct SQL and return sanitized view models without exposing raw database connection strings.

### Modules Tested
- **Session Manager & Auth Middleware**: Verifies cookie signing, parsing, and `requireRole` guards.
- **Admin Server Actions**: Verifies authorization barriers and execution of transactional SQL updates.
- **Customer Server Actions**: Verifies cart mutations, checkout transitions, and slip upload persistence.
- **UI Route Protections**: Verifies that protected admin page segments cannot be loaded without an active admin session.

### Prior Art
- Standard Next.js App Router patterns leveraging Server Actions, React Server Components, and encrypted cookie sessions recommended by Vercel.

---

## Out of Scope
- Third-party social logins (Google/Facebook OAuth); the project relies on local credential/demo cookie sessions for guaranteed offline/classroom evaluation reliability.
- WebSockets for real-time order status push; standard Next.js `revalidatePath` and page navigation provide sufficient responsiveness.
- Multi-tenancy (multiple independent stores); the system is architected as a single dedicated e-book bookstore.

---

## Further Notes
- This specification formalizes [ADR 0007: Next.js App Router Architecture with Direct Neon SQL Execution](file:///c:/Users/bond/Documents/miniproject-db-e-book/docs/adr/0007-nextjs-app-router-and-neon-sql.md).
- Integrates with all preceding specs: [ADR-0001 (Hybrid ID)](file:///c:/Users/bond/Documents/miniproject-db-e-book/docs/specs/0001-hybrid-id-strategy.md), [ADR-0002 (Order State Machine)](file:///c:/Users/bond/Documents/miniproject-db-e-book/docs/specs/0002-order-payment-fulfillment-state-machine.md), [ADR-0003 (Neon SQL)](file:///c:/Users/bond/Documents/miniproject-db-e-book/docs/specs/0003-neon-serverless-postgresql.md), [ADR-0004 (Junction Tables)](file:///c:/Users/bond/Documents/miniproject-db-e-book/docs/specs/0004-relational-junction-tables-over-jsonb.md), [ADR-0005 (Asset Delivery)](file:///c:/Users/bond/Documents/miniproject-db-e-book/docs/specs/0005-zero-external-dependency-asset-delivery.md), and [ADR-0006 (Cart Persistence)](file:///c:/Users/bond/Documents/miniproject-db-e-book/docs/specs/0006-database-backed-cart-persistence.md).
