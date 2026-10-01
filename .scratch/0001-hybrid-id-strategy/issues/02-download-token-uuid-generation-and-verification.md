# 02: Download Token UUID Generation & Gated Verification Slice

**What to build:** When a customer's payment is approved, the system must provision an unguessable UUID v4 download token tied to the user's purchased book. The token must be queryable via its public UUID string to verify that it is unrevoked, unexpired, and within its 5-download quota, while child download audit logs must attach strictly to the internal integer foreign key.

**Blocked by:** 01: Order Public UUID Identification & Lookup Slice

**Status:** ready-for-agent

- [x] Minting a download credential for a purchased book generates an internal `BIGINT id` alongside a unique, non-null UUID v4 `token` column.
- [x] Attempting to insert a duplicate `token` value is rejected by a database-level unique constraint and unique B-tree index.
- [x] The `download_tokens` record initializes with a default 30-day expiration (`CURRENT_TIMESTAMP + INTERVAL '30 days'`), `max_downloads = 5`, `download_count = 0`, and `is_revoked = FALSE`.
- [x] Child download events in `download_logs` link to the parent token using `download_token_id BIGINT REFERENCES download_tokens(id) ON DELETE SET NULL`.
- [x] Looking up a download token by its public UUID string retrieves token status, expiration timestamp, and remaining download quota.
- [x] Tokens with `CURRENT_TIMESTAMP > expires_at`, `is_revoked = TRUE`, or `download_count >= max_downloads` fail validation with distinct, descriptive errors.
- [x] Internal `download_tokens.id` is not exposed in public-facing download status responses.

