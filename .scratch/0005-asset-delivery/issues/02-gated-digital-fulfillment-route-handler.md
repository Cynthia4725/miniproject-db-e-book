# 02: Gated Digital Fulfillment Route Handler Slice

**What to build:** A server-side Next.js route handler (`/api/books/download`) that securely gates e-book downloads behind cryptographic token validation. It queries PostgreSQL to verify token existence, revocation status, expiration timeframe, and remaining download quota, returning standardized HTTP status codes and streaming the PDF asset upon authorization.

**Blocked by:** 01: Zero-Dependency Local Static Asset Provisioning Slice

**Status:** completed

- [x] Missing or empty `token` query parameter returns `400 Bad Request`.
- [x] Non-existent token in `download_tokens` returns `404 Not Found`.
- [x] Revoked token (`is_revoked = TRUE`) returns `403 Forbidden`.
- [x] Expired token (`expires_at < CURRENT_TIMESTAMP`) returns `410 Gone`.
- [x] Exhausted quota (`download_count >= max_downloads`) returns `403 Forbidden`.
- [x] Authorized request returns `200 OK` with headers:
  - `Content-Type: application/pdf`
  - `Content-Disposition: attachment; filename="[title].pdf"`
  - `Cache-Control: no-store, private`
- [x] Response payload streams the authentic PDF binary to the client.
