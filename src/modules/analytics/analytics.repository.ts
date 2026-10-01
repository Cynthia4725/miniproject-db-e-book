import { getDatabaseExecutor } from '@/db/client';
import {
  CategoryRevenueReportRow,
  CustomerLtvReportRow,
  DownloadVelocityReportRow,
  MonthlySalesTrendReportRow,
  TopSellingBookReportRow,
} from './analytics.dto';

export class AnalyticsRepository {
  private db = getDatabaseExecutor();

  /**
   * Query 1: Category Revenue & Volume Analysis
   * Multi-table JOIN, GROUP BY, SUM(), COUNT(), ORDER BY.
   */
  async getCategoryRevenueAnalysis(): Promise<CategoryRevenueReportRow[]> {
    const query = `
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
    `;

    const rows = await this.db.query(query);

    return rows.map((r) => ({
      categoryId: r.category_id,
      categoryName: r.category_name,
      totalTitlesInCategory: Number(r.total_titles_in_category),
      totalUnitsSold: Number(r.total_units_sold),
      totalRevenue: Number(r.total_revenue),
      averageSellingPrice: Number(r.average_selling_price),
    }));
  }

  /**
   * Query 2: Top N Best-Selling Books per Category
   * CTE + Window Function DENSE_RANK() OVER (PARTITION BY ... ORDER BY ...).
   */
  async getTopSellingBooksPerCategory(
    limitPerCategory: number = 5
  ): Promise<TopSellingBookReportRow[]> {
    const query = `
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
      WHERE sales_rank <= $1
      ORDER BY category_name, sales_rank;
    `;

    const rows = await this.db.query(query, [limitPerCategory]);

    return rows.map((r) => ({
      categoryName: r.category_name,
      salesRank: Number(r.sales_rank),
      bookTitle: r.book_title,
      publisherName: r.publisher_name,
      copiesSold: Number(r.copies_sold),
      totalSales: Number(r.total_sales),
    }));
  }

  /**
   * Query 3: Customer Lifetime Value (LTV) & Purchase Frequency
   * Multi-table aggregation, HAVING, date functions, COALESCE.
   */
  async getCustomerLifetimeValue(
    limitCustomers: number = 10
  ): Promise<CustomerLtvReportRow[]> {
    const query = `
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
      LIMIT $1;
    `;

    const rows = await this.db.query(query, [limitCustomers]);

    return rows.map((r) => ({
      customerId: r.customer_id,
      fullName: r.full_name,
      email: r.email,
      completedOrdersCount: Number(r.completed_orders_count),
      totalBooksPurchased: Number(r.total_books_purchased),
      totalSpendLtv: Number(r.total_spend_ltv),
      averageOrderValue: Number(r.average_order_value),
      firstPurchaseDate: r.first_purchase_date,
      latestPurchaseDate: r.latest_purchase_date,
    }));
  }

  /**
   * Query 4: Download Engagement & Velocity
   * Timestamp difference calculation with EXTRACT(EPOCH), COUNT, AVG.
   */
  async getDownloadVelocityAndEngagement(): Promise<DownloadVelocityReportRow[]> {
    const query = `
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
    `;

    const rows = await this.db.query(query);

    return rows.map((r) => ({
      bookId: r.book_id,
      bookTitle: r.book_title,
      totalOwners: Number(r.total_owners),
      totalDownloadEvents: Number(r.total_download_events),
      avgDownloadsPerOwner: Number(r.avg_downloads_per_owner),
      avgHoursToFirstDownload:
        r.avg_hours_to_first_download !== null
          ? Number(r.avg_hours_to_first_download)
          : null,
    }));
  }

  /**
   * Query 5: Monthly Sales Trends & Month-over-Month Growth (MoM)
   * DATE_TRUNC, CTE, Window Function LAG() OVER (...).
   */
  async getMonthlySalesTrends(): Promise<MonthlySalesTrendReportRow[]> {
    const query = `
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
    `;

    const rows = await this.db.query(query);

    return rows.map((r) => ({
      monthLabel: r.month_label,
      totalOrders: Number(r.total_orders),
      monthlyRevenue: Number(r.monthly_revenue),
      previousMonthRevenue:
        r.previous_month_revenue !== null
          ? Number(r.previous_month_revenue)
          : null,
      growthPercentage:
        r.growth_percentage !== null ? Number(r.growth_percentage) : null,
    }));
  }
}
