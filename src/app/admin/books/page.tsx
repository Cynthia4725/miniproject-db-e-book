import { getDatabaseExecutor } from '@/db/client';
import { createBookAction, toggleBookStatusAction } from '@/app/actions/admin.actions';
import { AdminAddBookForm } from '@/components/AdminAddBookForm';

export const dynamic = 'force-dynamic';

interface AdminBookItem {
  id: number;
  title: string;
  isbn: string;
  price: number;
  discount_price?: number | null;
  is_active: boolean;
  cover_image_url: string;
}

export default async function AdminBooksPage() {
  const db = getDatabaseExecutor();
  const books = await db.query<AdminBookItem>(`
    SELECT id, title, isbn, price, discount_price, is_active, cover_image_url
    FROM books
    ORDER BY id DESC;
  `);

  return (
    <div className="space-y-8">
      {/* Add Book Section using AdminAddBookForm (Upload / URL / No-Cover) */}
      <AdminAddBookForm action={createBookAction} />

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
                <th className="py-3 px-4">รูปปก</th>
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
                  <td className="py-3 px-4">
                    <div className="w-9 h-12 rounded bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={b.cover_image_url || '/images/no-cover.svg'}
                        alt={b.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs">{b.title}</td>
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
