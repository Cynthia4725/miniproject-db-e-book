import { describe, it, expect, beforeEach } from 'vitest';
import { AnalyticsRepository } from './analytics.repository';
import { DatabaseExecutor, setDatabaseExecutor } from '@/db/client';

class MockAnalyticsDatabaseExecutor implements DatabaseExecutor {
  public executedQueries: { text: string; params: any[] }[] = [];

  async query<T = any>(queryText: string, params: any[] = []): Promise<T[]> {
    const trimmed = queryText.trim();
    this.executedQueries.push({ text: trimmed, params });

    // Query 1: Category Revenue & Volume Analysis
    if (trimmed.includes('average_selling_price') && trimmed.includes('FROM categories c')) {
      return [
        {
          category_id: 1,
          category_name: 'Computer Science',
          total_titles_in_category: '5',
          total_units_sold: '12',
          total_revenue: '7800.00',
          average_selling_price: '650.00',
        },
        {
          category_id: 2,
          category_name: 'System Design',
          total_titles_in_category: '3',
          total_units_sold: '8',
          total_revenue: '7120.00',
          average_selling_price: '890.00',
        },
      ] as unknown as T[];
    }

    // Query 2: Top Selling Books per Category (CTE + DENSE_RANK)
    if (trimmed.includes('CategoryBookSales') && trimmed.includes('DENSE_RANK()')) {

      return [
        {
          category_name: 'Computer Science',
          sales_rank: 1,
          book_title: 'Designing Data-Intensive Applications',
          publisher_name: "O'Reilly Media",
          copies_sold: '7',
          total_sales: '4550.00',
        },
        {
          category_name: 'Computer Science',
          sales_rank: 2,
          book_title: 'Database Internals',
          publisher_name: "O'Reilly Media",
          copies_sold: '5',
          total_sales: '4450.00',
        },
      ] as unknown as T[];
    }

    // Query 3: Customer Lifetime Value (LTV)
    if (trimmed.includes('FROM users u') && trimmed.includes('completed_orders_count')) {
      return [
        {
          customer_id: 10,
          full_name: 'Jane Developer',
          email: 'jane@example.com',
          completed_orders_count: '4',
          total_books_purchased: '6',
          total_spend_ltv: '4200.00',
          average_order_value: '1050.00',
          first_purchase_date: '2026-01-15',
          latest_purchase_date: '2026-09-20',
        },
      ] as unknown as T[];
    }

    // Query 4: Download Velocity & Engagement (EXTRACT(EPOCH))
    if (trimmed.includes('EXTRACT(EPOCH FROM') && trimmed.includes('FROM books b')) {
      return [
        {
          book_id: 101,
          book_title: 'Designing Data-Intensive Applications',
          total_owners: '10',
          total_download_events: '28',
          avg_downloads_per_owner: '2.80',
          avg_hours_to_first_download: '1.25',
        },
      ] as unknown as T[];
    }

    // Query 5: Monthly Sales Trends & MoM Growth (LAG())
    if (trimmed.includes('WITH MonthlySales AS') && trimmed.includes('LAG(monthly_revenue')) {
      return [
        {
          month_label: '2026-08',
          total_orders: '15',
          monthly_revenue: '12500.00',
          previous_month_revenue: null,
          growth_percentage: null,
        },
        {
          month_label: '2026-09',
          total_orders: '25',
          monthly_revenue: '21000.00',
          previous_month_revenue: '12500.00',
          growth_percentage: '68.00',
        },
      ] as unknown as T[];
    }

    return [] as T[];
  }
}

describe('Native SQL Business Intelligence & Advanced Analytics Suite Slice (Ticket 03)', () => {
  let mockDb: MockAnalyticsDatabaseExecutor;
  let analyticsRepo: AnalyticsRepository;

  beforeEach(() => {
    mockDb = new MockAnalyticsDatabaseExecutor();
    setDatabaseExecutor(mockDb);
    analyticsRepo = new AnalyticsRepository();
  });

  it('Query 1: executes Category Revenue & Volume Analysis and returns formatted numerical metrics', async () => {
    const report = await analyticsRepo.getCategoryRevenueAnalysis();

    expect(report.length).toBe(2);
    expect(report[0].categoryName).toBe('Computer Science');
    expect(report[0].totalTitlesInCategory).toBe(5);
    expect(report[0].totalUnitsSold).toBe(12);
    expect(report[0].totalRevenue).toBe(7800.0);
    expect(report[0].averageSellingPrice).toBe(650.0);
  });

  it('Query 2: executes Top 5 Best-Selling Books per Category utilizing CTE and DENSE_RANK()', async () => {
    const report = await analyticsRepo.getTopSellingBooksPerCategory(5);

    expect(report.length).toBe(2);
    expect(report[0].salesRank).toBe(1);
    expect(report[0].bookTitle).toBe('Designing Data-Intensive Applications');
    expect(report[0].totalSales).toBe(4550.0);
    expect(mockDb.executedQueries[0].text).toContain('DENSE_RANK() OVER');
    expect(mockDb.executedQueries[0].params).toEqual([5]);
  });

  it('Query 3: executes Customer Lifetime Value (LTV) query and returns top customers', async () => {
    const report = await analyticsRepo.getCustomerLifetimeValue(10);

    expect(report.length).toBe(1);
    expect(report[0].customerId).toBe(10);
    expect(report[0].fullName).toBe('Jane Developer');
    expect(report[0].totalSpendLtv).toBe(4200.0);
    expect(report[0].completedOrdersCount).toBe(4);
    expect(mockDb.executedQueries[0].params).toEqual([10]);
  });

  it('Query 4: executes Download Velocity & Engagement query using EXTRACT(EPOCH)', async () => {
    const report = await analyticsRepo.getDownloadVelocityAndEngagement();

    expect(report.length).toBe(1);
    expect(report[0].bookId).toBe(101);
    expect(report[0].totalOwners).toBe(10);
    expect(report[0].totalDownloadEvents).toBe(28);
    expect(report[0].avgDownloadsPerOwner).toBe(2.8);
    expect(report[0].avgHoursToFirstDownload).toBe(1.25);
    expect(mockDb.executedQueries[0].text).toContain('EXTRACT(EPOCH FROM');
  });

  it('Query 5: executes Monthly Sales Trends & MoM Growth using CTE and LAG() Window Function', async () => {
    const report = await analyticsRepo.getMonthlySalesTrends();

    expect(report.length).toBe(2);
    expect(report[0].monthLabel).toBe('2026-08');
    expect(report[0].growthPercentage).toBeNull();
    expect(report[1].monthLabel).toBe('2026-09');
    expect(report[1].growthPercentage).toBe(68.0);
    expect(mockDb.executedQueries[0].text).toContain('LAG(monthly_revenue');
  });
});
