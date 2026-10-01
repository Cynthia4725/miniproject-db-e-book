import Link from 'next/link';
import { getDatabaseExecutor } from '@/db/client';
import { addToCartAction } from '@/app/actions/cart.actions';

export const dynamic = 'force-dynamic';

interface BookItem {
  id: number;
  title: string;
  subtitle?: string | null;
  price: number;
  discount_price?: number | null;
  cover_image_url?: string | null;
  category_name?: string | null;
  author_name?: string | null;
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const params = await searchParams;
  const db = getDatabaseExecutor();

  // Fetch categories for filter tabs
  const categories = await db.query<{ id: number; name: string; slug: string }>(
    'SELECT id, name, slug FROM categories ORDER BY name ASC;'
  );

  // Fetch books with author and category joins (grouped to avoid duplicate rows from M:N junction)
  let queryText = `
    SELECT 
      b.id,
      b.title,
      b.subtitle,
      b.price,
      b.discount_price,
      b.cover_image_url,
      STRING_AGG(DISTINCT c.name, ', ') AS category_name,
      STRING_AGG(DISTINCT a.name, ', ') AS author_name
    FROM books b
    LEFT JOIN book_categories bc ON b.id = bc.book_id
    LEFT JOIN categories c ON bc.category_id = c.id
    LEFT JOIN book_authors ba ON b.id = ba.book_id
    LEFT JOIN authors a ON ba.author_id = a.id
    WHERE b.is_active = TRUE
  `;
  const queryParams: any[] = [];

  if (params.category) {
    queryParams.push(params.category);
    queryText += ` AND EXISTS (
      SELECT 1 FROM book_categories bc2 
      JOIN categories c2 ON bc2.category_id = c2.id 
      WHERE bc2.book_id = b.id AND c2.slug = $${queryParams.length}
    )`;
  }

  if (params.q) {
    queryParams.push(`%${params.q.trim()}%`);
    queryText += ` AND (
      b.title ILIKE $${queryParams.length} 
      OR EXISTS (
        SELECT 1 FROM book_authors ba2 
        JOIN authors a2 ON ba2.author_id = a2.id 
        WHERE ba2.book_id = b.id AND a2.name ILIKE $${queryParams.length}
      )
    )`;
  }

  queryText += `
    GROUP BY b.id, b.title, b.subtitle, b.price, b.discount_price, b.cover_image_url
    ORDER BY b.id DESC 
    LIMIT 40;
  `;
  const books = await db.query<BookItem>(queryText, queryParams);

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-8 shadow-md">
        <div className="max-w-3xl">
          <span className="inline-block text-xs font-semibold px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30 mb-3">
            Neon Serverless PostgreSQL • Direct SQL
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            คลังหนังสือดิจิทัลสำหรับนักพัฒนาซอฟต์แวร์
          </h1>
          <p className="mt-2 text-slate-300 text-sm sm:text-base leading-relaxed">
            ระบบร้านหนังสือ e-Book จำลองสถาปัตยกรรมฐานข้อมูลเชิงสัมพันธ์จริง 16 ตาราง พร้อมรายงานวิเคราะห์เชิงลึก 5 มิติ
          </p>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2" suppressHydrationWarning>
          <Link
            href="/"
            suppressHydrationWarning
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              !params.category
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            ทั้งหมด (All)
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/?category=${c.slug}`}
              suppressHydrationWarning
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                params.category === c.slug
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>

        {/* Search Input */}
        <form method="GET" action="/" className="flex items-center">
          <input
            type="text"
            name="q"
            defaultValue={params.q || ''}
            placeholder="ค้นหาชื่อหนังสือ หรือ ผู้แต่ง..."
            className="px-3.5 py-1.5 text-xs rounded-l-lg border border-r-0 border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full sm:w-60"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-r-lg"
          >
            ค้นหา
          </button>
        </form>
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {books.map((book) => {
          const hasDiscount = book.discount_price != null && Number(book.discount_price) < Number(book.price);
          const effectivePrice = hasDiscount ? Number(book.discount_price) : Number(book.price);

          return (
            <div
              key={book.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              {/* Book Cover Placeholder / Image */}
              <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4 border-b border-slate-100 relative">
                {book.cover_image_url ? (
                  <img
                    src={book.cover_image_url}
                    alt={book.title}
                    className="max-h-full max-w-full object-contain rounded shadow"
                  />
                ) : (
                  <div className="text-center p-3">
                    <span className="text-4xl">📖</span>
                    <p className="text-xs font-medium text-slate-500 mt-2 line-clamp-2">{book.title}</p>
                  </div>
                )}
                {book.category_name && (
                  <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-200">
                    {book.category_name}
                  </span>
                )}
              </div>

              {/* Book Info */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <Link
                    href={`/books/${book.id}`}
                    className="hover:text-emerald-600 transition-colors"
                    suppressHydrationWarning
                  >
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-2">{book.title}</h3>
                  </Link>
                  {book.author_name && (
                    <p className="text-xs text-slate-500 mt-1">โดย {book.author_name}</p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    {hasDiscount && (
                      <span className="text-[11px] text-slate-400 line-through mr-1.5">
                        ฿{Number(book.price).toLocaleString()}
                      </span>
                    )}
                    <span className="text-base font-bold text-emerald-600">
                      ฿{effectivePrice.toLocaleString()}
                    </span>
                  </div>

                  <form action={addToCartAction.bind(null, book.id)}>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      + ตะกร้า
                    </button>
                  </form>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {books.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <span className="text-4xl">🔍</span>
          <h3 className="mt-3 text-sm font-semibold text-slate-700">ไม่พบหนังสือที่ตรงกับเงื่อนไขการค้นหา</h3>
          <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหา หรือคลิกดูหมวดหมู่ทั้งหมด</p>
        </div>
      )}
    </div>
  );
}
