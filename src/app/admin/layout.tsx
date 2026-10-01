import Link from 'next/link';
import { getCurrentUser } from '@/lib/session';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== 'admin') {
    return (
      <div className="bento-surface border-red-200 bg-red-50/50 p-8 sm:p-12 text-center max-w-xl mx-auto space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center text-2xl mx-auto">
          🚫
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-red-900">ปฏิเสธการเข้าถึง (403 Forbidden)</h2>
          <p className="text-xs text-red-700 leading-relaxed">
            หน้านี้สงวนสิทธิ์เฉพาะผู้ดูแลระบบร้าน (Administrator) เท่านั้น หากท่านต้องการประเมินระบบ กรุณาคลิกปุ่ม <strong>"สลับเป็น แอดมิน (Admin)"</strong> ที่แถบ Demo Switcher ด้านบนสุดของหน้าจอ
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/"
            suppressHydrationWarning
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
          >
            ← กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Admin Tab Header */}
      <div className="bento-surface p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Admin Operations & Telemetry
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            ศูนย์จัดการร้านและรายงานฐานข้อมูล
          </h1>
        </div>

        <div className="flex items-center flex-wrap gap-2" suppressHydrationWarning>
          <Link
            href="/admin/orders"
            suppressHydrationWarning
            className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:border-amber-400 hover:text-amber-800 text-xs font-semibold text-slate-700 transition-all shadow-2xs hover:shadow-xs flex items-center gap-1.5"
          >
            <span>📥</span>
            <span>คิวตรวจสลิป (Orders)</span>
          </Link>
          <Link
            href="/admin/books"
            suppressHydrationWarning
            className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:border-amber-400 hover:text-amber-800 text-xs font-semibold text-slate-700 transition-all shadow-2xs hover:shadow-xs flex items-center gap-1.5"
          >
            <span>📚</span>
            <span>แคตตาล็อก (Books)</span>
          </Link>
          <Link
            href="/admin/analytics"
            suppressHydrationWarning
            className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:border-amber-400 hover:text-amber-800 text-xs font-semibold text-slate-700 transition-all shadow-2xs hover:shadow-xs flex items-center gap-1.5"
          >
            <span>📊</span>
            <span>รายงาน 5 มิติ (Analytics)</span>
          </Link>
        </div>
      </div>

      <div>{children}</div>
    </div>
  );
}
