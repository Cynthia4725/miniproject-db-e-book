# ADR 0005: Zero-External-Dependency Digital Asset Delivery Strategy

## Status
Accepted

## Context
A live academic presentation requires the system prototype to be 100% dependable without external point-of-failure risks (such as AWS S3 / Cloudinary credentials expiring, free tier limits being exceeded, or CORS/network latency issues). At the same time, the rubric requires demonstrating that a customer genuinely receives an authentic downloadable file after payment verification.

## Decision
We adopt a **Zero-External-Dependency Asset Delivery Strategy**:
1. E-book cover images and payment slips utilize high-reliability direct CDN URLs and Base64 encoded payloads.
2. The download fulfillment endpoint serves a genuine sample PDF file located directly inside `/public/sample-ebook.pdf`.
3. All security controls (token verification, download quota counts, expiration dates, and `download_logs` auditing) operate against the database as intended.

## Considered Options
- **Third-Party Cloud Storage (AWS S3 / Cloudinary)**: Rejected due to API key dependency risks, quota restrictions, and potential service disruption during project grading.

## Consequences
- **Positive**:
  - Zero external credentials required for local or Vercel deployment.
  - 100% demo reliability: downloads consistently stream a genuine PDF file.
  - Security validation and audit logging logic remain identical to a production enterprise system.
- **Negative**:
  - In this prototype phase, all e-book titles fulfill by streaming the project's bundled sample PDF asset.
