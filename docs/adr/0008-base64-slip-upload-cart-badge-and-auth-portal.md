# ADR 0008: Base64 Slip Image Storage, Reactive Cart Badge, and Self-Contained Auth Portal

## Status
Accepted

## Context
Following initial deployment and instructor feedback, three key requirements were identified to enhance the e-book store experience:
1. **Realistic Payment Slip Upload**: Customers currently enter a placeholder URL; they need to upload actual image files (`.png`, `.jpg`, `.jpeg`, `.webp`).
2. **Real-Time Cart Quantity Feedback**: When customers add books to their cart, there is no immediate visual cue in the navigation header indicating cart volume.
3. **Dedicated Customer Authentication Portal**: While the grading faculty needs one-click demo role switching (`admin@ebookstore.com` vs `somchai@example.com`), students and evaluators also need the ability to register new customer accounts, set passwords, and log in natively.

On Vercel Serverless, the filesystem is ephemeral and read-only at runtime. External bucket storage (e.g., AWS S3, Cloudinary) introduces third-party credentials, subscription dependencies, and potential CORS/networking failures during faculty evaluation.

## Decision
We adopt the following architectural solutions:

1. **Base64 Data URI Slip Storage**:
   - File uploads in the PromptPay payment form are accepted via `<input type="file" accept="image/*">`.
   - The file is read, validated (maximum size 2MB), and converted into a Base64 Data URL (`data:image/...;base64,...`) on client/server action.
   - The resulting Data URL is stored directly in `payments.slip_image_url (TEXT)` in Neon PostgreSQL.
   - This ensures **100% zero external dependency**, guaranteed image persistence across Vercel serverless runs, and instant rendering in the admin verification queue.

2. **Distinct Cart Item Header Badge**:
   - The navigation header (`Navbar.tsx`) queries the distinct item count of the active user's cart via `CartRepository`.
   - A badge is rendered at the top-right of the cart icon (`🛒 (N)`).
   - Server Actions (`addToCartAction`, `removeFromCartAction`, `checkoutAction`) trigger Next.js path revalidations (`revalidatePath('/', 'layout')`) to ensure instant UI reactivity without full client-side state managers.

3. **Hybrid Authentication Architecture (Demo Switcher + Registration Portal)**:
   - Provide dedicated `/login` and `/register` pages with form validations.
   - Registration securely hashes passwords using Node.js built-in `crypto.scrypt` (or PBKDF2 with salt) and persists user records to the `users` table with `role = 'customer'`.
   - Login validates credentials against `users.password_hash` and issues the signed HMAC-SHA256 session cookie (`ebook_session`).
   - The Demo Persona Switcher header widget remains active for grading evaluators to switch between predefined accounts (`admin` and `somchai`) with a single click, while also offering navigation to the login/register portal.

## Considered Options
- **External Object Storage (AWS S3 / Supabase)**: Rejected to preserve zero external cloud configuration for graders.
- **Local Filesystem Storage (`public/uploads`)**: Rejected because Vercel serverless environments discard local file modifications across invocations.
- **Client-Side Global State for Cart (Redux/Zustand)**: Rejected to maintain server-first React Server Component architecture with direct SQL persistence.

## Consequences
- **Positive**:
  - Frictionless image uploads without third-party storage credentials or CORS configuration.
  - Transparent cart status displayed everywhere in the application.
  - Complete, professional customer lifecycle from sign-up to checkout, while preserving single-click grading convenience.
- **Negative**:
  - Base64 encoding increases database text column payload by ~33% compared to binary blob storage; bounded by the 2MB image limit.
