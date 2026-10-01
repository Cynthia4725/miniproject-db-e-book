# 03: Admin Verification Queue & 5D SQL Analytics Dashboard Slice

**What to build:** The store administrator operations center and business intelligence suite. Provides `/admin/orders` for reviewing and approving/rejecting payment slips with atomic fulfillment, `/admin/books` for catalog pricing and inventory management, and `/admin/analytics` rendering the 5-dimension SQL analytics reports (Category revenue, `DENSE_RANK()` bestsellers, Customer LTV, Download velocity, and `LAG()` monthly trends).

**Blocked by:** 01: Lightweight Cookie Session, Role Guards & Demo Account Switcher Slice

**Status:** ready-for-agent

- [ ] `/admin` route tree is protected by server-side role guard rejecting non-admin users.
- [ ] `/admin/orders` renders payment verification queue for orders in `PAYMENT_SUBMITTED` status.
- [ ] Admin Review Server Action allows approving payments (atomically transitioning to `PAID`, granting library access, minting download token) or rejecting with reason.
- [ ] `/admin/books` enables administrators to list, add, and adjust catalog prices and availability.
- [ ] `/admin/analytics` renders interactive dashboard visualizing all 5 advanced SQL analytics queries with KPI cards and tabular breakdowns.
