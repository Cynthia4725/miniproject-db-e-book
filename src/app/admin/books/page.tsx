import { getDatabaseExecutor } from '@/db/client';
import { createBookAction, toggleBookStatusAction } from '@/app/actions/admin.actions';

export const dynamic = 'force-dynamic';

interface AdminBookItem {
  id: number;
  title: string;
  isbn: string;
  price: number;
  discount_price?: number | null;
  is_active: boolean;
}

export default async function AdminBooksPage() {
  const db = getDatabaseExecutor();
  const books = await db.query<AdminBookItem>(`
    SELECT id, title, isbn, price, discount_price, is_active
    FROM books
    ORDER BY id DESC;
  `);

  return (
    <div className="space-y-8">
      {/* Add Book Section */}
      <div className="bento-surface p-6 sm:p-7 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            เพิ่มหนังสือเล่มใหม่เข้าแคตตาล็อก (Add New Book)
          </h2>
        </div>

        <form action={createBookAction} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">ชื่อหนังสือ (Title)</label>
            <input
              type="text"
              name="title"
              required
              placeholder="e.g. Distributed Systems in Go"
              suppressHydrationWarning
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">ISBN</label>
            <input
              type="text"
              name="isbn"
              required
              placeholder="e.g. 978-0123456789"
              suppressHydrationWarning
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">ราคาปกติ (Price ฿)</label>
            <input
              type="number"
              name="price"
              step="0.01"
              required
              placeholder="e.g. 690"
              suppressHydrationWarning
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">ราคาโปรโมชั่น (Discount ฿)</label>
            <div className="flex gap-2">
              <input
                type="number"
                name="discount_price"
                step="0.01"
                placeholder="เว้นว่างได้"
                suppressHydrationWarning
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono"
              />
              <button
                type="submit"
                suppressHydrationWarning
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl transition-all shrink-0 shadow-xs"
              >
                บันทึก
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Books Table */}
      <div className="bento-surface overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            รายการหนังสือทั้งหมดในระบบ ({books.length} รายการ)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">ชื่อหนังสือ</th>
                <th className="py-3 px-4">ISBN</th>
                <th className="py-3 px-4">ราคา (ปกติ / โปรโมชั่น)</th>
                <th className="py-3 px-4">สถานะการขาย</th>
                <th className="py-3 px-4 text-right">ดำเนินการ (Action)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {books.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-400">#{b.id}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{b.title}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{b.isbn}</td>
                  <td className="py-3 px-4 font-mono tabular-nums">
                    <span className="font-semibold text-slate-900">฿{Number(b.price).toLocaleString()}</span>
                    {b.discount_price != null && (
                      <span className="text-emerald-600 font-bold ml-1.5">
                        (฿{Number(b.discount_price).toLocaleString()})
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        b.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {b.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <form action={toggleBookStatusAction.bind(null, b.id, !b.is_active)} className="inline-block">
                      <button
                        type="submit"
                        suppressHydrationWarning
                        className="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                      >
                        {b.is_active ? 'ปิดการขาย' : 'เปิดการขาย'}
                      </button>
                    </form>
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
