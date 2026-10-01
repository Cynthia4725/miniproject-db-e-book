# 01: Zero-Dependency Local Static Asset Provisioning Slice

**What to build:** Provision an authentic, complete sample e-book PDF asset bundled directly within the repository (`public/sample-ebook.pdf`) and build a filename and asset resolver utility. This guarantees that file delivery works 100% reliably in local development and on cloud platforms (e.g. Vercel) without external cloud object storage (AWS S3, Google Cloud Storage, Cloudinary) or API credentials.

**Blocked by:** None (can start immediately)

**Status:** completed

- [x] A readable sample PDF file exists at `public/sample-ebook.pdf` with valid PDF headers and content.
- [x] Asset helper safely resolves the local file path and prevents directory traversal attacks.
- [x] Filename sanitizer cleans book titles for HTTP `Content-Disposition` headers (removes invalid characters, handles spaces, ensures `.pdf` extension).
- [x] File size and basic metadata can be read synchronously or asynchronously for HTTP headers.

