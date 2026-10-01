import { AnalyticsRepository } from '@/modules/analytics/analytics.repository';
import {
  CategoryRevenueReportRow,
  CustomerLtvReportRow,
  DownloadVelocityReportRow,
  MonthlySalesTrendReportRow,
  TopSellingBookReportRow,
} from '@/modules/analytics/analytics.dto';

export const dynamic = 'force-dynamic';

export default async function AdminAnalyticsPage() {
  const analyticsRepo = new AnalyticsRepository();

  const [
    categoryRevenue,
    topSellingBooks,
    customerLtv,
    downloadVelocity,
    monthlyTrends,
  ]: [
    CategoryRevenueReportRow[],
    TopSellingBookReportRow[],
    CustomerLtvReportRow[],
    DownloadVelocityReportRow[],
    MonthlySalesTrendReportRow[],
  ] = await Promise.all([
    analyticsRepo.getCategoryRevenueAnalysis().catch(() => []),
    analyticsRepo.getTopSellingBooksPerCategory(3).catch(() => []),
    analyticsRepo.getCustomerLifetimeValue(10).catch(() => []),
    analyticsRepo.getDownloadVelocityAndEngagement().catch(() => []),
    analyticsRepo.getMonthlySalesTrends().catch(() => []),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200/80 text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          5-Dimension Analytics Telemetry
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
          ศูนย์วิเคราะห์ข้อมูลเชิงลึก 5 มิติ
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
          รายงานวิเคราะห์สถิติธุรกิจคำนวณผ่าน Parameterized Direct SQL, Window Functions (DENSE_RANK, LAG) และ CTEs บน Neon PostgreSQL
        </p>
      </div>

      {/* KPI Cards Bento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bento-surface p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">มิติที่ 1: หมวดหมู่ยอดขายสูงสุด</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-base font-bold text-slate-900 truncate">
              {categoryRevenue[0]?.categoryName || 'N/A'}
            </span>
            <span className="text-emerald-600 font-extrabold text-sm font-mono tabular-nums shrink-0">
              ฿{categoryRevenue[0] ? Number(categoryRevenue[0].totalRevenue).toLocaleString() : 0}
            </span>
          </div>
        </div>

        <div className="bento-surface p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">มิติที่ 2: Best-Seller อันดับ 1</span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <div>
            <span className="text-sm font-bold text-slate-900 line-clamp-1">
              {topSellingBooks[0]?.bookTitle || 'N/A'}
            </span>
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              ขายได้ {topSellingBooks[0]?.copiesSold || 0} เล่ม
            </span>
          </div>
        </div>

        <div className="bento-surface p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">มิติที่ 3: ลูกค้า LTV สูงสุด</span>
            <span className="w-2 h-2 rounded-full bg-blue-500" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-bold text-slate-900 truncate">
              {customerLtv[0]?.fullName || 'N/A'}
            </span>
            <span className="text-emerald-600 font-extrabold text-sm font-mono tabular-nums shrink-0">
              ฿{customerLtv[0] ? Number(customerLtv[0].totalSpendLtv).toLocaleString() : 0}
            </span>
          </div>
        </div>

        <div className="bento-surface p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">มิติที่ 4: ความเร็วดาวน์โหลดเฉลี่ย</span>
            <span className="w-2 h-2 rounded-full bg-purple-500" />
          </div>
          <div>
            <span className="text-base font-bold text-slate-900 font-mono tabular-nums">
              {downloadVelocity[0]?.avgHoursToFirstDownload != null ? `${downloadVelocity[0].avgHoursToFirstDownload} ชม.` : 'N/A'}
            </span>
            <span className="text-xs text-slate-400 block">นับจากอนุมัติคำสั่งซื้อ</span>
          </div>
        </div>
      </div>

      {/* Dimension 1 & 2 Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dimension 1: Category Revenue */}
        <div className="bento-surface overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              มิติที่ 1: รายได้จำแนกตามหมวดหมู่ (Category Revenue Breakdown)
            </h3>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 text-slate-400 font-semibold text-[11px] uppercase tracking-wider bg-slate-50/30">
              <tr>
                <th className="py-2.5 px-4">หมวดหมู่</th>
                <th className="py-2.5 px-4 text-center">จำนวนเล่มที่ขาย</th>
                <th className="py-2.5 px-4 text-right">ยอดขายรวม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categoryRevenue.map((row) => (
                <tr key={row.categoryId} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-2.5 px-4 font-semibold text-slate-900">{row.categoryName}</td>
                  <td className="py-2.5 px-4 text-center text-slate-600 font-mono tabular-nums">{row.totalUnitsSold} เล่ม</td>
                  <td className="py-2.5 px-4 text-right font-bold text-emerald-600 font-mono tabular-nums">
                    ฿{Number(row.totalRevenue).toLocaleString()}
                  </td>
                </tr>
              ))}
              {categoryRevenue.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-slate-400">ยังไม่มีข้อมูลยอดขาย</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Dimension 2: Top Selling Books (DENSE_RANK) */}
        <div className="bento-surface overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              มิติที่ 2: หนังสือขายดีรายหมวดหมู่ (Top Selling via DENSE_RANK)
            </h3>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 text-slate-400 font-semibold text-[11px] uppercase tracking-wider bg-slate-50/30">
              <tr>
                <th className="py-2.5 px-4">อันดับ</th>
                <th className="py-2.5 px-4">ชื่อหนังสือ</th>
                <th className="py-2.5 px-4">หมวดหมู่</th>
                <th className="py-2.5 px-4 text-right">ยอดขาย</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topSellingBooks.map((row) => (
                <tr key={`${row.categoryName}-${row.bookTitle}`} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-2.5 px-4">
                    <span className="inline-block w-5 h-5 bg-amber-50 border border-amber-200/80 text-amber-800 text-[10px] font-bold rounded-md text-center leading-5 font-mono">
                      #{row.salesRank}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900 line-clamp-1">{row.bookTitle}</td>
                  <td className="py-2.5 px-4 text-slate-500">{row.categoryName}</td>
                  <td className="py-2.5 px-4 text-right font-semibold text-slate-700 font-mono tabular-nums">
                    {row.copiesSold} เล่ม
                  </td>
                </tr>
              ))}
              {topSellingBooks.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400">ยังไม่มีข้อมูลยอดขาย</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dimension 3, 4, 5 Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dimension 3: Customer LTV */}
        <div className="bento-surface overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              มิติที่ 3: มูลค่าตลอดช่วงชีวิตลูกค้า (LTV)
            </h3>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 text-slate-400 font-semibold text-[11px] uppercase tracking-wider bg-slate-50/30">
              <tr>
                <th className="py-2.5 px-3">ลูกค้า</th>
                <th className="py-2.5 px-3 text-center">ออเดอร์</th>
                <th className="py-2.5 px-3 text-right">ยอดรวม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customerLtv.slice(0, 5).map((row) => (
                <tr key={row.customerId} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-900 truncate max-w-[120px]">{row.fullName}</td>
                  <td className="py-2.5 px-3 text-center text-slate-600 font-mono tabular-nums">{row.completedOrdersCount}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-600 font-mono tabular-nums">
                    ฿{Number(row.totalSpendLtv).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Dimension 4: Download Velocity */}
        <div className="bento-surface overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              มิติที่ 4: ความเร็วการดาวน์โหลด (Velocity)
            </h3>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 text-slate-400 font-semibold text-[11px] uppercase tracking-wider bg-slate-50/30">
              <tr>
                <th className="py-2.5 px-3">หนังสือ</th>
                <th className="py-2.5 px-3 text-center">ดาวน์โหลด</th>
                <th className="py-2.5 px-3 text-right">ชม.เฉลี่ย</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {downloadVelocity.slice(0, 5).map((row) => (
                <tr key={row.bookId} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-900 truncate max-w-[120px]">{row.bookTitle}</td>
                  <td className="py-2.5 px-3 text-center text-slate-600 font-mono tabular-nums">{row.totalDownloadEvents} ครั้ง</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-700 tabular-nums">
                    {row.avgHoursToFirstDownload != null ? `${row.avgHoursToFirstDownload}h` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Dimension 5: Monthly Trends (LAG) */}
        <div className="bento-surface overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              มิติที่ 5: แนวโน้มรายเดือน (Growth LAG)
            </h3>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 text-slate-400 font-semibold text-[11px] uppercase tracking-wider bg-slate-50/30">
              <tr>
                <th className="py-2.5 px-3">เดือน</th>
                <th className="py-2.5 px-3 text-right">ยอดขาย</th>
                <th className="py-2.5 px-3 text-right">การเติบโต</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthlyTrends.slice(0, 5).map((row) => (
                <tr key={row.monthLabel} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-slate-800 text-[11px]">{row.monthLabel}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono tabular-nums">
                    ฿{Number(row.monthlyRevenue).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                    {row.growthPercentage != null ? (
                      <span className={`font-semibold ${Number(row.growthPercentage) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {Number(row.growthPercentage) > 0 ? '+' : ''}{Number(row.growthPercentage).toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
