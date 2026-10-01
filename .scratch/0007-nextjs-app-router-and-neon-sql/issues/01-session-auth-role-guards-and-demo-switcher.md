# 01: Lightweight Cookie Session, Role Guards & Demo Account Switcher Slice

**What to build:** A self-contained, tamper-proof session authentication system using HTTP-only signed cookies. Provides `getCurrentUser()`, `requireRole()`, and a single-click Demo Account Switcher enabling evaluators to seamlessly toggle between Customer (`somchai@example.com`) and Store Administrator (`admin@ebookstore.com`) without external OAuth setup. Protects administrative actions and routes with server-side role validation.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Lightweight HMAC-signed cookie session (`getCurrentUser`, `setSessionCookie`, `clearSessionCookie`) stores user ID, email, role, and name.
- [ ] Demo Switcher action toggles session instantly between customer and admin personas.
- [ ] `requireRole(['admin'])` blocks non-admin callers from executing protected actions with `ForbiddenError` (403).
- [ ] Unauthenticated requests to protected endpoints return `UnauthorizedError` (401).
- [ ] Floating navigation header renders current user identity, role badge, and demo switch buttons.
