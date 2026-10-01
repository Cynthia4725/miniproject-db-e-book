export interface CategoryRevenueReportRow {
  categoryId: number | string;
  categoryName: string;
  totalTitlesInCategory: number;
  totalUnitsSold: number;
  totalRevenue: number;
  averageSellingPrice: number;
}

export interface TopSellingBookReportRow {
  categoryName: string;
  salesRank: number;
  bookTitle: string;
  publisherName: string | null;
  copiesSold: number;
  totalSales: number;
}

export interface CustomerLtvReportRow {
  customerId: number | string;
  fullName: string;
  email: string;
  completedOrdersCount: number;
  totalBooksPurchased: number;
  totalSpendLtv: number;
  averageOrderValue: number;
  firstPurchaseDate: string | Date | null;
  latestPurchaseDate: string | Date | null;
}

export interface DownloadVelocityReportRow {
  bookId: number | string;
  bookTitle: string;
  totalOwners: number;
  totalDownloadEvents: number;
  avgDownloadsPerOwner: number;
  avgHoursToFirstDownload: number | null;
}

export interface MonthlySalesTrendReportRow {
  monthLabel: string;
  totalOrders: number;
  monthlyRevenue: number;
  previousMonthRevenue: number | null;
  growthPercentage: number | null;
}
