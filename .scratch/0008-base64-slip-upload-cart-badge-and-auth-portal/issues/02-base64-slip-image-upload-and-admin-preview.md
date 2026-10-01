# 02: Interactive Base64 Slip File Upload & Admin Verification Preview Slice

**What to build:** An authentic payment slip file upload mechanism on `/orders/[order_number]/pay`. Replaces the manual URL text input with a drag-and-drop / file picker input supporting PNG, JPEG, and WebP files. Displays an instant thumbnail preview of the selected image before submission. Converts the selected file into a Base64 Data URL (capped at 2MB) and submits it via `submitSlipAction` to `payments.slip_image_url` in PostgreSQL. In the Admin Orders verification queue (`/admin/orders`), renders the actual uploaded slip image thumbnail with a modal / direct view capability.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] `/orders/[order_number]/pay` payment form accepts file selection (`<input type="file" accept="image/*">`).
- [ ] Client component or form script provides an instant live image preview of the chosen file.
- [ ] Enforces maximum file size validation (<= 2MB) with clear alert on oversized images.
- [ ] Converts image to Base64 Data URL string before or during Server Action submission.
- [ ] `payments.slip_image_url` successfully persists the Base64 Data URL string in Neon PostgreSQL.
- [ ] `/admin/orders` table renders the uploaded image thumbnail cleanly with a click-to-view overlay or link.
