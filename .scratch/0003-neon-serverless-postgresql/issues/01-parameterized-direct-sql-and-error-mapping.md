# 01: Parameterized Direct SQL Client & PostgreSQL Error Mapping Slice

**What to build:** A lightweight, secure database execution client that runs direct SQL statements over Neon serverless HTTP with strict parameterization. It protects the application from SQL injection attacks by ensuring dynamic values are bound as parameters rather than concatenated into SQL strings, and maps raw PostgreSQL constraint violation error codes (`23505`, `23503`, `23514`) into domain-appropriate errors with clear messages.

**Blocked by:** None (can start immediately)

**Status:** completed

- [x] Database client executes direct SQL queries over Neon serverless HTTP connection without persistent TCP connection pool overhead.
- [x] Queries support parameterized variable binding (`$1`, `$2`, etc.) and tagged template syntax, strictly preventing SQL injection.
- [x] Inputs containing special SQL characters (e.g. quotes, semicolons, dashes, apostrophes) pass cleanly without breaking query syntax or executing injected statements.
- [x] PostgreSQL error code `23505` (`unique_violation`) is automatically caught and rethrown as a classified `ConflictError`.
- [x] PostgreSQL error code `23503` (`foreign_key_violation`) is automatically caught and rethrown as a classified `NotFoundError` or `ReferenceError`.
- [x] PostgreSQL error code `23514` (`check_violation`) is automatically caught and rethrown as a classified `ValidationError`.
- [x] Generic or unhandled database errors are sanitized so internal database credentials, connection strings, or system paths do not leak to callers.

