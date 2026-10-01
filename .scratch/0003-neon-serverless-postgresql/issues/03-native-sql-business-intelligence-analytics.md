# 03: Native SQL Business Intelligence & Advanced Analytics Suite Slice

**What to build:** An analytical query suite executing the 5 core business intelligence queries from the project specifications directly against PostgreSQL. The queries demonstrate mastery over advanced relational techniques—such as Common Table Expressions (CTEs), Window Functions (`DENSE_RANK()`, `LAG()`), multi-table aggregations, and date arithmetic—without using an ORM, providing real-time data for store administrator analytics dashboards.

**Blocked by:** 01: Parameterized Direct SQL Client & PostgreSQL Error Mapping Slice

**Status:** completed

- [x] Query 1: Category Revenue & Volume Analysis executes with multi-table `JOIN`, `GROUP BY`, `SUM`, `AVG`, and `ORDER BY`, returning accurate revenue and units sold per category.
- [x] Query 2: Top 5 Best-Selling Books per Category executes using a CTE and Window Function `DENSE_RANK() OVER (PARTITION BY ... ORDER BY ...)`, returning ranked bestsellers per category.
- [x] Query 3: Customer Lifetime Value (LTV) executes with multi-table aggregation and filtering, returning top spenders, completed order counts, and date spans.
- [x] Query 4: Download Velocity & Engagement executes timestamp calculations using `EXTRACT(EPOCH)` between order grant and download logs, computing average hours to first download.
- [x] Query 5: Monthly Sales Trends executes using a CTE and Window Function `LAG() OVER (ORDER BY sales_month)`, computing Month-over-Month (MoM) revenue growth percentages.
- [x] All 5 analytical queries execute cleanly as direct parameterized SQL queries and return strongly-typed report structures.

