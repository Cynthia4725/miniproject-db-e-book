import { AnalyticsRepository } from '@/modules/analytics/analytics.repository';
import {
  CategoryRevenueReportRow,
  CustomerLtvReportRow,
  DownloadVelocityReportRow,
  MonthlySalesTrendReportRow,
  TopSellingBookReportRow,
} from '@/modules/analytics/analytics.dto';

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
        <h2 className="text-xl font-black text-slate-900">
          ศูนย์วิเคราะห์ข้อมูลเชิงลึก 5 มิติ (5-Dimension SQL Analytics Dashboard)
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          รายงานวิเคราะห์สถิติธุรกิจคำนวณผ่าน Parameterized Direct SQL, Window Functions (DENSE_RANK, LAG) และ CTEs บน Neon PostgreSQL
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-400 text-xs font-semibold uppercase">มิติที่ 1: หมวดหมู่ยอดขายสูงสุด</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg font-bold text-slate-900">
              {categoryRevenue[0]?.categoryName || 'N/A'}
            </span>
            <span className="text-emerald-600 font-extrabold text-sm">
              ฿{categoryRevenue[0] ? Number(categoryRevenue[0].totalRevenue).toLocaleString() : 0}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-400 text-xs font-semibold uppercase">มิติที่ 2: หนังสือ Best-Seller อันดับ 1</span>
          <div className="mt-2">
            <span className="text-sm font-bold text-slate-900 line-clamp-1">
              {topSellingBooks[0]?.bookTitle || 'N/A'}
            </span>
            <span className="text-xs text-slate-500">
              ขายได้ {topSellingBooks[0]?.copiesSold || 0} เล่ม
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-400 text-xs font-semibold uppercase">มิติที่ 3: ลูกค้า LTV สูงสุด</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-sm font-bold text-slate-900">
              {customerLtv[0]?.fullName || 'N/A'}
            </span>
            <span className="text-emerald-600 font-extrabold text-sm">
              ฿{customerLtv[0] ? Number(customerLtv[0].totalSpendLtv).toLocaleString() : 0}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-400 text-xs font-semibold uppercase">มิติที่ 4: ความเร็วเฉลี่ยในการดาวน์โหลด</span>
          <div className="mt-2">
            <span className="text-lg font-bold text-slate-900">
              {downloadVelocity[0]?.avgHoursToFirstDownload != null ? `${downloadVelocity[0].avgHoursToFirstDownload} ชม.` : 'N/A'}
            </span>
            <span className="text-xs text-slate-400 block">นับจากชำระเงินสำเร็จ</span>
          </div>
        </div>
      </div>

      {/* Dimension 1 & 2 Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dimension 1: Category Revenue */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              มิติที่ 1: รายได้จำแนกตามหมวดหมู่ (Category Revenue Breakdown)
            </h3>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 text-slate-500 font-semibold">
              <tr>
                <th className="py-2.5 px-4">หมวดหมู่</th>
                <th className="py-2.5 px-4 text-center">จำนวนเล่มที่ขาย</th>
                <th className="py-2.5 px-4 text-right">ยอดขายรวม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categoryRevenue.map((row) => (
                <tr key={row.categoryId} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 font-semibold text-slate-800">{row.categoryName}</td>
                  <td className="py-2.5 px-4 text-center">{row.totalUnitsSold} เล่ม</td>
                  <td className="py-2.5 px-4 text-right font-bold text-emerald-600">
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
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              มิติที่ 2: หนังสือขายดีรายหมวดหมู่ (Top Selling via DENSE_RANK)
            </h3>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 text-slate-500 font-semibold">
              <tr>
                <th className="py-2.5 px-4">อันดับ</th>
                <th className="py-2.5 px-4">ชื่อหนังสือ</th>
                <th className="py-2.5 px-4">หมวดหมู่</th>
                <th className="py-2.5 px-4 text-right">ยอดขาย</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topSellingBooks.map((row) => (
                <tr key={`${row.categoryName}-${row.bookTitle}`} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4">
                    <span className="inline-block w-5 h-5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full text-center leading-5">
                      #{row.salesRank}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-bold text-slate-800 line-clamp-1">{row.bookTitle}</td>
                  <td className="py-2.5 px-4 text-slate-500">{row.categoryName}</td>
                  <td className="py-2.5 px-4 text-right font-semibold text-slate-700">
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
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              มิติที่ 3: มูลค่าตลอดช่วงชีวิตลูกค้า (LTV)
            </h3>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 text-slate-500 font-semibold">
              <tr>
                <th className="py-2 px-3">ลูกค้า</th>
                <th className="py-2 px-3 text-center">ออเดอร์</th>
                <th className="py-2 px-3 text-right">ยอดรวม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customerLtv.slice(0, 5).map((row) => (
                <tr key={row.customerId} className="hover:bg-slate-50/50">
                  <td className="py-2 px-3 font-semibold text-slate-800">{row.fullName}</td>
                  <td className="py-2 px-3 text-center">{row.completedOrdersCount}</td>
                  <td className="py-2 px-3 text-right font-bold text-emerald-600">
                    ฿{Number(row.totalSpendLtv).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Dimension 4: Download Velocity */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              มิติที่ 4: ความเร็วการดาวน์โหลด (Velocity)
            </h3>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 text-slate-500 font-semibold">
              <tr>
                <th className="py-2 px-3">หนังสือ</th>
                <th className="py-2 px-3 text-center">ดาวน์โหลด</th>
                <th className="py-2 px-3 text-right">ชม.เฉลี่ย</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {downloadVelocity.slice(0, 5).map((row) => (
                <tr key={row.bookId} className="hover:bg-slate-50/50">
                  <td className="py-2 px-3 font-semibold text-slate-800 line-clamp-1">{row.bookTitle}</td>
                  <td className="py-2 px-3 text-center">{row.totalDownloadEvents} ครั้ง</td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-700">
                    {row.avgHoursToFirstDownload != null ? `${row.avgHoursToFirstDownload}h` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Dimension 5: Monthly Trends (LAG) */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              มิติที่ 5: แนวโน้มรายเดือน (Monthly Growth LAG)
            </h3>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 text-slate-500 font-semibold">
              <tr>
                <th className="py-2 px-3">เดือน</th>
                <th className="py-2 px-3 text-right">ยอดขาย</th>
                <th className="py-2 px-3 text-right">การเติบโต</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthlyTrends.slice(0, 5).map((row) => (
                <tr key={row.monthLabel} className="hover:bg-slate-50/50">
                  <td className="py-2 px-3 font-mono text-slate-800">{row.monthLabel}</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">
                    ฿{Number(row.monthlyRevenue).toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right">
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
