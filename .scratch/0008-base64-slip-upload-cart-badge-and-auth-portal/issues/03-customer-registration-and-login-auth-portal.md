# 03: Customer Registration, Cryptographic Password Hashing & Login Portal Slice

**What to build:** A self-contained customer authentication portal featuring dedicated `/register` and `/login` views. Allows visitors to create a customer account with full name, email, phone number, and password. Safely hashes passwords using Node.js `crypto.scrypt` with random salt, saving to the `users` table with `role = 'customer'`. Implements `/login` validating credentials against database hashes and setting the signed HTTP-only session cookie. Connects auth actions with the header Demo Persona Switcher so evaluators can test both custom logins and instant one-click switching.

**Blocked by:** None (can start immediately)

**Status:** completed

- [x] Password hashing utility (`hashPassword`, `verifyPassword`) built using Node.js standard `crypto.scrypt`.
- [x] `/register` page provides full name, email, phone, password, and confirmation inputs with validation.
- [x] Registration Server Action rejects duplicate emails with a descriptive error message and persists user to `users` table.
- [x] Registration automatically signs in the new customer with `role = 'customer'` and redirects to `/`.
- [x] `/login` page allows logging in with registered email and password, setting signed session cookie upon success.
- [x] Demo Persona Switcher exposes quick links to `/login` and `/register`, alongside the one-click `Admin` and `Somchai` demo buttons.
- [x] Unit tests verify password hashing, duplicate email handling, and authentication flow.
