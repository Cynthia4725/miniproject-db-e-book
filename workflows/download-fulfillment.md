# Workflow: E-Book Download Fulfillment & Audit Logging

## Goal
Securely validate download requests, verify token quotas, stream the digital asset, and capture audit telemetry in `download_logs`.

---

## 1. Triggers
- **Trigger**: Customer clicks **"Download E-Book"** on a title in `/library` or visits `/api/books/download?token=[uuid]`.

---

## 2. Verification & Fulfillment Steps

### Step 1: Security & Entitlement Check
1. Fetch `download_tokens` matching `token = :requested_token`:
   - If not found: Return HTTP 404 (Invalid Token).
   - If `is_revoked = TRUE`: Return HTTP 403 (Token Revoked).
   - If `CURRENT_TIMESTAMP > expires_at`: Return HTTP 410 (Download Link Expired).
   - If `download_count >= max_downloads`: Return HTTP 403 (Download Quota Exceeded).
2. Verify ownership in `user_library`:
   - Ensure `user_library` record exists for `(user_id, book_id)`.

### Step 2: Download Execution & Audit Logging (Transaction Block)
1. Within a database transaction:
   - Increment token counter:
     ```sql
     UPDATE download_tokens 
     SET download_count = download_count + 1 
     WHERE id = :token_id;
     ```
   - Insert audit record into `download_logs`:
     ```sql
     INSERT INTO download_logs (
       download_token_id, user_id, book_id, ip_address, user_agent, downloaded_at
     ) VALUES (
       :token_id, :user_id, :book_id, :ip_address, :user_agent, CURRENT_TIMESTAMP
     );
     ```
2. Serve the digital file:
   - Stream `/public/sample-ebook.pdf` with headers:
     - `Content-Type: application/pdf`
     - `Content-Disposition: attachment; filename="[book_title].pdf"`
3. Commit transaction.

---

## 3. Definition of Done
- User receives the complete, readable PDF file.
- `download_count` is incremented.
- A new row is inserted into `download_logs` with complete client telemetry for SQL reporting.
