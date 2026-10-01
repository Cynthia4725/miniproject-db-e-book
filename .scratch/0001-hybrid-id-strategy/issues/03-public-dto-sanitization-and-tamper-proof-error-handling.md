# 03: Public DTO Sanitization & Tamper-Proof Error Handling Slice

**What to build:** An end-to-end contract sanitization and input validation barrier that strips internal sequential database IDs from public-facing order and download responses, validates incoming public UUID formats before executing database queries, and returns safe, standardized error messages when malformed or unknown UUIDs are requested.

**Blocked by:** 01: Order Public UUID Identification & Lookup Slice, 02: Download Token UUID Generation & Gated Verification Slice

**Status:** ready-for-agent

- [x] Outbound public DTO serializers transform internal database records to omit `orders.id` and `download_tokens.id`, exposing only `order_number` and `token` UUIDs.
- [x] Incoming URL parameters (`:order_number` and `token`) are validated against RFC 4122 UUID format regex before database queries are initiated.
- [x] Supplying a malformed non-UUID string returns an immediate HTTP 400 Bad Request / Validation Error without triggering database syntax errors.
- [x] Supplying a non-existent but validly formatted UUID returns an HTTP 404 Not Found without leaking database schema details or stack traces.
- [x] Administrative API responses retain access to internal `id` fields for administrative support and debugging.
- [x] Automated regression tests prove that internal sequential IDs never appear in public client JSON responses or URLs.

