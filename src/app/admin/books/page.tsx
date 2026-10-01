import { getDatabaseExecutor } from '@/db/client';
import { createBookAction, toggleBookStatusAction, updateBookPriceAction } from '@/app/actions/admin.actions';

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
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
          + เพิ่มหนังสือเล่มใหม่เข้าแคตตาล็อก (Add New Book)
        </h2>

        <form action={createBookAction} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อหนังสือ (Title)</label>
            <input
              type="text"
              name="title"
              required
              placeholder="e.g. Distributed Systems in Go"
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">ISBN</label>
            <input
              type="text"
              name="isbn"
              required
              placeholder="e.g. 978-0123456789"
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">ราคาปกติ (Price ฿)</label>
            <input
              type="number"
              name="price"
              step="0.01"
              required
              placeholder="e.g. 690"
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">ราคาโปรโมชั่น (Discount ฿)</label>
            <div className="flex gap-2">
              <input
                type="number"
                name="discount_price"
                step="0.01"
                placeholder="เว้นว่างได้"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors shrink-0"
              >
                บันทึก
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Books Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-sm font-bold text-slate-900">
            รายการหนังสือทั้งหมดในระบบ ({books.length} รายการ)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
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
                <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-400">#{b.id}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{b.title}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{b.isbn}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold">฿{Number(b.price).toLocaleString()}</span>
                    {b.discount_price != null && (
                      <span className="text-emerald-600 font-bold ml-1.5">
                        (โปรโมชั่น: ฿{Number(b.discount_price).toLocaleString()})
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        b.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {b.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <form action={toggleBookStatusAction.bind(null, b.id, !b.is_active)} className="inline-block">
                      <button
                        type="submit"
                        className="px-2.5 py-1 text-[11px] font-medium rounded border border-slate-200 hover:bg-slate-100 transition-colors"
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
