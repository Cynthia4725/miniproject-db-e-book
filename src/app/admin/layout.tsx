import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== 'admin') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-xl mx-auto space-y-4">
        <span className="text-4xl block">🚫</span>
        <h2 className="text-lg font-bold text-red-800">ปฏิเสธการเข้าถึง (403 Forbidden)</h2>
        <p className="text-xs text-red-600 leading-relaxed">
          หน้านี้สงวนสิทธิ์เฉพาะผู้ดูแลระบบร้าน (Administrator) เท่านั้น หากท่านเป็นอาจารย์หรือกรรมการประเมิน กรุณาคลิกปุ่ม <strong>"สลับเป็น แอดมิน (Admin)"</strong> ที่แถบ Demo Switcher ด้านบนสุดของหน้าจอ
        </p>
        <div>
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800"
          >
            ← กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Tab Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            Admin Management Portal
          </span>
          <h1 className="text-xl font-extrabold text-slate-900 mt-1">
            ศูนย์จัดการร้านและรายงานฐานข้อมูล
          </h1>
        </div>

        <div className="flex items-center gap-2" suppressHydrationWarning>
          <Link
            href="/admin/orders"
            suppressHydrationWarning
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-amber-500 hover:text-amber-700 text-xs font-semibold text-slate-700 transition-colors"
          >
            📥 คิวตรวจสลิป (Orders)
          </Link>
          <Link
            href="/admin/books"
            suppressHydrationWarning
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-amber-500 hover:text-amber-700 text-xs font-semibold text-slate-700 transition-colors"
          >
            📚 แคตตาล็อก (Books)
          </Link>
          <Link
            href="/admin/analytics"
            suppressHydrationWarning
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-amber-500 hover:text-amber-700 text-xs font-semibold text-slate-700 transition-colors"
          >
            📊 รายงาน 5 มิติ (Analytics)
          </Link>
        </div>
      </div>

      <div>{children}</div>
    </div>
  );
}
