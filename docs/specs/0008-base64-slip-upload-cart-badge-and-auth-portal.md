# Specification: Base64 Slip Image Storage, Reactive Cart Badge, and Self-Contained Auth Portal

**Status:** Draft / Ready for Implementation  
**ADR Reference:** [ADR-0008](../../docs/adr/0008-base64-slip-upload-cart-badge-and-auth-portal.md)  
**Corpus:** `balliolon2/miniproject-db-e-book`  

---

## 1. Overview & Business Objectives

To elevate the demonstration quality and realism of the E-Book Store, three essential capabilities are specified:
1. **Interactive Payment Slip File Upload**: Allow customers to upload realistic payment slips (PNG, JPEG, WebP) directly through file picker with preview, encoded as Base64 Data URLs stored in PostgreSQL.
2. **Real-Time Reactive Cart Badge**: Display an unread badge on the header cart link representing the count of distinct books in the active customer's cart, updating immediately upon additions and removals.
3. **Dedicated Customer Auth Portal**: Provide complete self-service registration and login capabilities (`/login`, `/register`) using cryptographic password hashing, while preserving the quick Demo Persona Switcher for faculty grading.

---

## 2. Core Functional Requirements

### Requirement 1: Base64 Slip Image Upload (`/orders/[order_number]/pay`)
- **File Input & Validation**:
  - The payment form accepts image files (`.png`, `.jpg`, `.jpeg`, `.webp`) up to 2MB in size.
  - Interactive preview is shown immediately after selecting an image.
  - The file is converted to a standard Data URI string (`data:image/...;base64,...`) and submitted via `submitSlipAction`.
- **Database Storage**:
  - Stored in `payments.slip_image_url` as text.
  - Displayed in the Admin Orders verification queue (`/admin/orders`) as an image preview modal or clickable full-resolution thumbnail.

### Requirement 2: Reactive Cart Item Badge (`Navbar.tsx`)
- **Badge Indicator**:
  - `Navbar.tsx` queries the active user's cart from PostgreSQL (`SELECT COUNT(*) FROM cart_items WHERE cart_id = ...`).
  - When the cart has items, render a vibrant badge at the cart link (e.g., `🛒 ตะกร้า <span class="badge">3</span>`).
  - When the cart is empty, do not display a counter number.
- **Revalidation**:
  - Server actions `addToCartAction`, `removeFromCartAction`, and `checkoutAction` trigger `revalidatePath('/', 'layout')` to keep the badge immediately synchronized.

### Requirement 3: Customer Auth Portal (`/login` & `/register`)
- **Registration (`/register`)**:
  - Form fields: Full Name, Email, Password, Confirm Password, Phone.
  - Enforce email uniqueness check with clear error message if already taken.
  - Securely hash passwords with salt using Node.js `crypto.scrypt` (format: `scrypt:<salt>:<hash>`).
  - Create user with `role = 'customer'` in the `users` table.
  - Automatically log the newly registered customer in and redirect to `/`.
- **Login (`/login`)**:
  - Form fields: Email, Password.
  - Verify password against stored hash.
  - Set HTTP-only HMAC-signed session cookie (`ebook_session`).
  - Redirect to previous page or `/`.
- **Integration with Demo Switcher**:
  - Provide direct links to `/login` and `/register` in the Demo Switcher bar.
  - Evaluators can still click "สลับเป็น แอดมิน" or "สลับเป็น ลูกค้า (Somchai)" anytime with zero credentials required.

---

## 3. Acceptance Criteria

1. **Slip File Upload**:
   - [ ] Selecting an image file updates the payment form preview immediately.
   - [ ] Submitting the payment form saves the Base64 image into `payments.slip_image_url`.
   - [ ] In `/admin/orders`, the administrator sees the uploaded slip image directly.
2. **Cart Badge**:
   - [ ] Adding a book to the cart immediately increments the cart badge number on the navbar.
   - [ ] Removing an item decrements the count; checkout resets the badge to empty.
3. **Login & Register**:
   - [ ] Visitors can register with valid details and are logged in as customer.
   - [ ] Registered customers can log out and log back in with their password.
   - [ ] Grading evaluators can still toggle admin/somchai seamlessly via the Demo Switcher.
