# Workflow: Business Analytics & SQL Reporting

## Goal
Execute high-value analytical SQL queries against real system data to extract business intelligence on sales performance, category dominance, customer behavior, and download engagement.

---

## 1. Triggers
- **Trigger**: Store Admin visits `/admin/analytics` or executes the database reporting script.

---

## 2. Core Analytical Dimensions & SQL Queries

### Query 1: Category Revenue & Volume Analysis
- **Business Question**: Which book categories generate the most revenue and volume?
- **SQL Technique**: Multiple `JOIN`, `GROUP BY`, `SUM()`, `COUNT()`, `ORDER BY`.
```sql
SELECT 
    c.id AS category_id,
    c.name AS category_name,
    COUNT(DISTINCT b.id) AS total_titles_in_category,
    COUNT(oi.id) AS total_units_sold,
    COALESCE(SUM(oi.unit_price), 0.00) AS total_revenue,
    ROUND(COALESCE(AVG(oi.unit_price), 0.00), 2) AS average_selling_price
FROM categories c
JOIN book_categories bc ON c.id = bc.category_id
JOIN books b ON bc.book_id = b.id
LEFT JOIN order_items oi ON b.id = oi.book_id
LEFT JOIN orders o ON oi.order_id = o.id AND o.order_status = 'PAID'
GROUP BY c.id, c.name
ORDER BY total_revenue DESC, total_units_sold DESC;
```

---

### Query 2: Top 5 Best-Selling Books per Category (Window Function)
- **Business Question**: What are the top 5 revenue-generating books inside each category?
- **SQL Technique**: Common Table Expression (CTE), Window Function `DENSE_RANK() OVER (PARTITION BY ... ORDER BY ...)`.
```sql
WITH CategoryBookSales AS (
    SELECT 
        c.name AS category_name,
        b.title AS book_title,
        p.name AS publisher_name,
        COUNT(oi.id) AS copies_sold,
        COALESCE(SUM(oi.unit_price), 0.00) AS total_sales,
        DENSE_RANK() OVER (
            PARTITION BY c.id 
            ORDER BY COALESCE(SUM(oi.unit_price), 0.00) DESC
        ) AS sales_rank
    FROM categories c
    JOIN book_categories bc ON c.id = bc.category_id
    JOIN books b ON bc.book_id = b.id
    LEFT JOIN publishers p ON b.publisher_id = p.id
    LEFT JOIN order_items oi ON b.id = oi.book_id
    LEFT JOIN orders o ON oi.order_id = o.id AND o.order_status = 'PAID'
    GROUP BY c.id, c.name, b.id, b.title, p.name
)
SELECT 
    category_name,
    sales_rank,
    book_title,
    publisher_name,
    copies_sold,
    total_sales
FROM CategoryBookSales
WHERE sales_rank <= 5
ORDER BY category_name, sales_rank;
```

---

### Query 3: Customer Lifetime Value (LTV) & Purchase Frequency
- **Business Question**: Who are the most valuable customers, and how frequently do they purchase?
- **SQL Technique**: Aggregate filtering with `HAVING`, date functions, `COALESCE`.
```sql
SELECT 
    u.id AS customer_id,
    u.full_name,
    u.email,
    COUNT(DISTINCT o.id) AS completed_orders_count,
    COUNT(oi.id) AS total_books_purchased,
    COALESCE(SUM(o.net_amount), 0.00) AS total_spend_ltv,
    ROUND(COALESCE(AVG(o.net_amount), 0.00), 2) AS average_order_value,
    MIN(o.created_at)::DATE AS first_purchase_date,
    MAX(o.created_at)::DATE AS latest_purchase_date
FROM users u
JOIN orders o ON u.id = o.user_id AND o.order_status = 'PAID'
JOIN order_items oi ON o.id = oi.order_id
WHERE u.role = 'customer'
GROUP BY u.id, u.full_name, u.email
ORDER BY total_spend_ltv DESC, completed_orders_count DESC
LIMIT 10;
```

---

### Query 4: Download Engagement & Velocity
- **Business Question**: How quickly do customers download their purchased books, and how many times?
- **SQL Technique**: Timestamp difference calculation, `COUNT`, `AVG`, Subqueries.
```sql
SELECT 
    b.id AS book_id,
    b.title AS book_title,
    COUNT(DISTINCT ul.user_id) AS total_owners,
    COUNT(dl.id) AS total_download_events,
    ROUND(
        COUNT(dl.id)::NUMERIC / NULLIF(COUNT(DISTINCT ul.user_id), 0), 2
    ) AS avg_downloads_per_owner,
    ROUND(
        AVG(EXTRACT(EPOCH FROM (dl.downloaded_at - ul.granted_at)) / 3600)::NUMERIC, 2
    ) AS avg_hours_to_first_download
FROM books b
JOIN user_library ul ON b.id = ul.book_id
LEFT JOIN download_logs dl ON ul.user_id = dl.user_id AND ul.book_id = dl.book_id
GROUP BY b.id, b.title
ORDER BY total_owners DESC, total_download_events DESC;
```

---

### Query 5: Monthly Sales Trends & Month-over-Month Growth (MoM)
- **Business Question**: How is revenue trending over the past months, and what is the percentage growth?
- **SQL Technique**: Date truncation `DATE_TRUNC`, CTE, Window Function `LAG() OVER (...)`.
```sql
WITH MonthlySales AS (
    SELECT 
        DATE_TRUNC('month', created_at) AS sales_month,
        COUNT(id) AS total_orders,
        SUM(net_amount) AS monthly_revenue
    FROM orders
    WHERE order_status = 'PAID'
    GROUP BY DATE_TRUNC('month', created_at)
)
SELECT 
    TO_CHAR(sales_month, 'YYYY-MM') AS month_label,
    total_orders,
    monthly_revenue,
    LAG(monthly_revenue, 1) OVER (ORDER BY sales_month) AS previous_month_revenue,
    ROUND(
        (monthly_revenue - LAG(monthly_revenue, 1) OVER (ORDER BY sales_month)) * 100.0 / 
        NULLIF(LAG(monthly_revenue, 1) OVER (ORDER BY sales_month), 0), 2
    ) AS growth_percentage
FROM MonthlySales
ORDER BY sales_month ASC;
```

---

## 3. Definition of Done
- All 5 queries execute cleanly without syntax errors on PostgreSQL.
- Queries reflect genuine relational depth (CTEs, Window Functions `DENSE_RANK()`, `LAG()`, Aggregations).
- Results provide actionable business insights for the course presentation.
