# Spec: Zero-External-Dependency Digital Asset Delivery Strategy (ADR-0005)

Triage Label: `ready-for-agent`

---

## Problem Statement

Integrating external cloud object storage services (such as AWS S3, Google Cloud Storage, or Cloudinary) into academic project prototypes creates high-risk single points of failure. Expired API secret tokens, depleted free-tier bandwidth quotas, restrictive CORS policies, and network latency issues can abruptly crash file upload and download flows during live evaluations by grading faculty.

At the same time, the course rubric explicitly requires demonstrating that a customer genuinely receives, downloads, and reads an authentic e-book file (PDF) following verified payment, while enforcing cryptographic token authorization, expiration timeframes, download quota limits, and relational download audit logging.

---

## Solution

Implement a **Zero-External-Dependency Digital Asset Delivery Strategy** that marries zero-credential runtime reliability with enterprise-grade database security and audit logging:
1. Catalog cover images and promotional assets utilize reliable direct web URLs and Base64-encoded strings, requiring no dedicated media bucket storage.
2. Digital e-book fulfillment serves an authentic, complete sample PDF asset bundled directly within the web application repository (`/public/sample-ebook.pdf`).
3. Access to the digital file is gated behind a dedicated server-side endpoint (`/api/books/download?token=[uuid]`):
   - The gateway validates the presence of the requested token in `download_tokens`.
   - The gateway verifies that the token is not revoked (`is_revoked = FALSE`), has not expired (`CURRENT_TIMESTAMP <= expires_at`), and has remaining quota (`download_count < max_downloads`).
4. Upon successful validation, the gateway atomically increments the token's `download_count` and inserts a client telemetry record into `download_logs` (capturing client IP, user agent, and timestamp).
5. The gateway streams the PDF binary content with standard HTTP headers (`Content-Type: application/pdf`, `Content-Disposition: attachment; filename="[title].pdf"`), delivering a genuine readable file to the customer's device.
6. The entire download and auditing loop functions 100% reliably in local development and on Vercel without configuring any third-party storage credentials.

---

## User Stories

1. As a store customer, I want to click a download button in My Library and immediately receive a real, readable PDF file, so that I can verify that my purchase yielded authentic reading material.
2. As a store customer, I want my downloaded file to be named after the book title, so that I can easily identify the document in my device's download folder.
3. As a store customer, I want to see a clear error message if my download link has expired, so that I know why the file was not served.
4. As a store customer, I want to see a clear error message if I have exhausted my 5-download quota, so that I understand that my allocation limit was reached.
5. As a store administrator, I want digital file delivery to operate without depending on external cloud storage billing or API keys, so that the store prototype never experiences outages due to third-party quota exhaustion.
6. As a store administrator, I want payment slips and cover images to render reliably in the admin verification interface, so that I can review customer transfer evidence without broken image icons.
7. As a database instructor/evaluator, I want to download an e-book and observe corresponding rows inserted into `download_logs` in PostgreSQL, so that I can verify that download telemetry is accurately recorded in the database.
8. As a database instructor/evaluator, I want the download counter on `download_tokens` to increment on each download, so that I can test database quota enforcement in real time.
9. As a database instructor/evaluator, I want to clone and run the project repository without provisioning AWS S3 buckets or setting up external cloud storage accounts, so that project evaluation is seamless and friction-free.
10. As a security auditor, I want the direct file path of the underlying PDF asset to be hidden from the client, so that users cannot bypass token verification to access the file directly.
11. As a security auditor, I want each download request to log the client's IP address and user agent in `download_logs`, so that audit trails exist for forensic review.
12. As a security auditor, I want tampered, expired, or revoked tokens to be rejected with standard HTTP status codes (404, 410, 403), so that unauthorized access attempts are blocked.
13. As a software developer, I want the download endpoint to stream the file using standard Node/Web streams, so that memory usage remains low during file delivery.
14. As a software developer, I want token quota validation and log creation to execute within an atomic database transaction, so that download counts and audit rows never fall out of sync.
15. As a DevOps engineer, I want the asset delivery pipeline to be completely static and self-contained within Vercel's standard deployment bundle, so that deployment requires zero external storage configuration.

---

## Implementation Decisions

### 1. File Storage and Asset Organization
- Place an authentic, high-quality sample PDF file at `/public/sample-ebook.pdf`.
- Cover images are stored as high-reliability HTTPS URLs (e.g. Unsplash or publisher CDN) or inline Base64 data URIs.
- Transfer slips uploaded during checkout are captured as Base64 strings or static mock image references stored in the `payments.slip_image_url` column.

### 2. Download Gateway Protocol (`/api/books/download`)
- Endpoint signature: `GET /api/books/download?token=[uuid]`
- Validation sequence:
  1. Retrieve `download_tokens` record matching `token`:
     - If not found: return HTTP 404 (Not Found).
     - If `is_revoked = TRUE`: return HTTP 403 (Forbidden - Token Revoked).
     - If `CURRENT_TIMESTAMP > expires_at`: return HTTP 410 (Gone - Download Link Expired).
     - If `download_count >= max_downloads`: return HTTP 403 (Forbidden - Download Quota Exceeded).
  2. Retrieve corresponding book metadata (`title`, `file_format`) from `books`.
  3. Execute atomic transaction:
     ```sql
     UPDATE download_tokens 
     SET download_count = download_count + 1 
     WHERE id = :token_id;
     
     INSERT INTO download_logs (
       download_token_id, user_id, book_id, ip_address, user_agent, downloaded_at
     ) VALUES (
       :token_id, :user_id, :book_id, :client_ip, :user_agent, CURRENT_TIMESTAMP
     );
     ```
  4. Stream file contents with response headers:
     - `Content-Type: application/pdf`
     - `Content-Disposition: attachment; filename="[sanitized_title].pdf"`
     - `Cache-Control: no-store, private`

---

## Testing Decisions

### What Makes a Good Test
- Tests must verify the security gating, HTTP header composition, database quota mutation, and audit log generation across the download gateway boundary.
- Tests must prove:
  1. Providing a valid, unexpired token with remaining quota returns HTTP 200 with an `application/pdf` binary stream and attachment filename.
  2. Successful download increments `download_tokens.download_count` by 1.
  3. Successful download creates a corresponding entry in `download_logs` with matching `user_id`, `book_id`, and client telemetry.
  4. Querying with an invalid token returns HTTP 404 without file contents.
  5. Querying with an expired token (`expires_at < NOW()`) returns HTTP 410 without file contents.
  6. Querying with a token whose quota is exhausted (`download_count >= max_downloads`) returns HTTP 403 without file contents.
  7. The test suite executes completely offline without external network or S3 API keys.

### Modules Tested
- **Download Gateway Route Handler**: Verifies parameter parsing, status code mappings, and HTTP header generation.
- **Token Authorization Service**: Verifies expiration, revocation, and quota validation queries against PostgreSQL.
- **Audit Logging Service**: Verifies insertion into `download_logs` and atomic counter incrementation.

### Prior Art
- Secure signed download links and expirable digital software license distribution gateways (e.g. Gumroad / itch.io download token architectures).

---

## Out of Scope
- Storing unique multi-gigabyte files per book title on external object storage; prototype fulfills all titles using the bundled, authentic sample PDF.
- Dynamic PDF watermarking (stamping customer email on each page); standard PDF streaming is sufficient for course scope.
- Resumable range requests (HTTP Range / 206 Partial Content); standard full binary download is sufficient.

---

## Further Notes
- This specification formalizes [ADR 0005: Zero-External-Dependency Digital Asset Delivery Strategy](file:///c:/Users/bond/Documents/miniproject-db-e-book/docs/adr/0005-zero-external-dependency-asset-delivery.md).
- Detailed workflow sequences and SQL scripts are cataloged in [download-fulfillment.md](file:///c:/Users/bond/Documents/miniproject-db-e-book/workflows/download-fulfillment.md).
