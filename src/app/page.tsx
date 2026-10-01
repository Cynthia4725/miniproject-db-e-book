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

  // Fetch categories with book count for bento filter
  const categories = await db.query<{ id: number; name: string; slug: string; book_count: number }>(`
    SELECT c.id, c.name, c.slug, COUNT(bc.book_id)::int AS book_count
    FROM categories c
    LEFT JOIN book_categories bc ON c.id = bc.category_id
    GROUP BY c.id, c.name, c.slug
    ORDER BY c.name ASC;
  `);

  // Fetch books with author and category joins
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

  // Identify a Staff Pick book (first book or book with discount)
  const staffPick = books.find((b) => b.discount_price != null) || books[0];

  return (
    <div className="space-y-10">
      {/* ======================================================== */}
      {/* ASYMMETRIC BENTO HERO SECTION                            */}
      {/* ======================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Bento Card (Headline + Search + System Pillars) - 7 cols */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-2xs relative overflow-hidden group">
          {/* Subtle Ambient Background Accent */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                PostgreSQL Relational Schema 3NF
              </span>
              <span className="font-mono text-[11px] text-slate-400">Neon Serverless</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              คลังหนังสือดิจิทัลสำหรับวิศวกรซอฟต์แวร์ และนักพัฒนา
            </h1>
            <p className="mt-3 text-slate-600 text-xs sm:text-sm leading-relaxed max-w-xl">
              ร้านหนังสือ e-Book จำลองสถาปัตยกรรมฐานข้อมูลเชิงสัมพันธ์จริง 16 ตาราง 
              พร้อมรายงานการวิเคราะห์เชิงลึก 5 มิติ (OLAP Rollup, Subquery, M:N Junctions)
            </p>
          </div>

          {/* Interactive Floating Search Bar inside Hero */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <form method="GET" action="/" className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-400 text-sm">🔍</span>
              <input
                type="text"
                name="q"
                defaultValue={params.q || ''}
                placeholder="ค้นหาชื่อ e-Book หรือผู้แต่ง (เช่น PostgreSQL, System Design)..."
                className="w-full pl-9 pr-24 py-2.5 text-xs rounded-xl border border-slate-200/90 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all text-slate-800 placeholder-slate-400"
              />
              <button
                type="submit"
                className="absolute right-1.5 px-4 py-1.5 bg-slate-900 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs"
              >
                ค้นหา
              </button>
            </form>

            {/* Architecture Metrics Badges */}
            <div className="flex flex-wrap items-center gap-3 mt-4 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>16 Physical Tables</span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>Hybrid ID (BIGINT / UUID)</span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>ACID Atomic Checkout</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Bento Column (Staff Pick & Topics) - 5 cols */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          {/* Staff Pick Card */}
          {staffPick && (
            <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 flex items-center gap-4 relative overflow-hidden shadow-2xs group">
              <div className="w-20 h-28 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0 border border-slate-700 relative shadow-md">
                {staffPick.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={staffPick.cover_image_url}
                    alt={staffPick.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    📖
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-1.5">
                  Staff Pick · เล่มแนะนำ
                </span>
                <Link
                  href={`/books/${staffPick.id}`}
                  suppressHydrationWarning
                  className="block hover:text-emerald-300 transition-colors"
                >
                  <h3 className="font-bold text-sm text-white line-clamp-1 truncate">
                    {staffPick.title}
                  </h3>
                </Link>
                <p className="text-slate-400 text-xs truncate mt-0.5">
                  {staffPick.author_name || 'บรรณาธิการคัดสรร'}
                </p>

                <div className="mt-2.5 flex items-center justify-between">
                  <span className="font-mono text-base font-extrabold text-emerald-400 tabular-nums">
                    ฿{Number(staffPick.discount_price || staffPick.price).toLocaleString()}
                  </span>
                  <Link
                    href={`/books/${staffPick.id}`}
                    suppressHydrationWarning
                    className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-900 text-[11px] font-semibold rounded-lg transition-colors shadow-2xs"
                  >
                    ดูเนื้อหา ↗
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Quick Category Topics Bento */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                หมวดหมู่ยอดนิยม (Trending Topics)
              </p>
              <div className="flex flex-wrap gap-1.5" suppressHydrationWarning>
                {categories.slice(0, 4).map((c) => (
                  <Link
                    key={c.id}
                    href={`/?category=${c.slug}`}
                    suppressHydrationWarning
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all ${
                      params.category === c.slug
                        ? 'bg-emerald-600 text-white font-medium'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70'
                    }`}
                  >
                    <span>{c.name}</span>
                    <span className="tabular-nums font-mono text-[10px] text-slate-400">
                      ({c.book_count})
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]" suppressHydrationWarning>
              <span className="text-slate-400">ทั้งหมด {books.length} เล่มพร้อมดาวน์โหลด</span>
              <a
                href="/docs/db-architecture.html"
                target="_blank"
                suppressHydrationWarning
                className="text-emerald-700 font-semibold hover:underline"
              >
                ดูแผนผังฐานข้อมูล ↗
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* CATEGORY PILL FILTER BAR                                 */}
      {/* ======================================================== */}
      <div className="border-b border-slate-200/80 pb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2" suppressHydrationWarning>
          <Link
            href="/"
            suppressHydrationWarning
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              !params.category
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200/90 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            ทั้งหมด (All)
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/?category=${c.slug}`}
              suppressHydrationWarning
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                params.category === c.slug
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200/90 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span>{c.name}</span>
              <span className={`ml-1.5 font-mono text-[10px] ${params.category === c.slug ? 'text-emerald-200' : 'text-slate-400'}`}>
                {c.book_count}
              </span>
            </Link>
          ))}
        </div>

        {params.q && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>ผลการค้นหา: <strong className="text-slate-900">"{params.q}"</strong></span>
            <Link href="/" className="text-rose-600 hover:underline">ล้างตัวกรอง ✕</Link>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* ELEVATED MINIMALIST BOOK CARDS GRID                      */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {books.map((book) => {
          const hasDiscount = book.discount_price != null && Number(book.discount_price) < Number(book.price);
          const effectivePrice = hasDiscount ? Number(book.discount_price) : Number(book.price);

          return (
            <div
              key={book.id}
              className="bento-surface flex flex-col justify-between overflow-hidden group relative"
            >
              {/* Cover Container with Spine Shadow & Micro Tag */}
              <div className="h-52 bg-gradient-to-b from-slate-100/60 to-slate-100 flex items-center justify-center p-4 relative border-b border-slate-100">
                {/* Book Spine Shadow Illusion */}
                <div className="relative h-full flex items-center justify-center group-hover:scale-[1.03] transition-transform duration-300">
                  {book.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={book.cover_image_url}
                      alt={book.title}
                      className="max-h-44 max-w-full object-contain rounded shadow-md border border-black/5"
                    />
                  ) : (
                    <div className="w-28 h-40 bg-white rounded shadow-md border border-slate-200 p-3 flex flex-col items-center justify-center text-center">
                      <span className="text-3xl">📖</span>
                      <p className="text-[10px] font-bold text-slate-600 mt-2 line-clamp-2">{book.title}</p>
                    </div>
                  )}
                </div>

                {/* Category Micro-tag */}
                {book.category_name && (
                  <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs text-slate-700 text-[10px] font-medium font-mono px-2 py-0.5 rounded-md border border-slate-200/80 shadow-2xs">
                    {book.category_name}
                  </span>
                )}

                {hasDiscount && (
                  <span className="absolute top-3 right-3 bg-rose-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-xs font-mono">
                    SALE
                  </span>
                )}
              </div>

              {/* Book Details */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <Link
                    href={`/books/${book.id}`}
                    className="hover:text-emerald-700 transition-colors block"
                    suppressHydrationWarning
                  >
                    <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                      {book.title}
                    </h3>
                  </Link>
                  {book.subtitle && (
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {book.subtitle}
                    </p>
                  )}
                  {book.author_name && (
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <span className="text-slate-400">โดย</span>
                      <span className="font-medium text-slate-700 truncate">{book.author_name}</span>
                    </p>
                  )}
                </div>

                {/* Pinned Pricing & Action Row */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="tabular-nums">
                    {hasDiscount && (
                      <span className="text-[11px] text-slate-400 line-through mr-1 font-mono">
                        ฿{Number(book.price).toLocaleString()}
                      </span>
                    )}
                    <span className="text-base font-extrabold text-slate-900 font-mono">
                      ฿{effectivePrice.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/books/${book.id}`}
                      suppressHydrationWarning
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors"
                    >
                      ดูเล่มนี้
                    </Link>
                    <form action={addToCartAction.bind(null, book.id)}>
                      <button
                        type="submit"
                        suppressHydrationWarning
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs active:scale-95 flex items-center gap-1"
                        title="เพิ่มลงตะกร้า"
                      >
                        <span>🛒</span>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty Search State */}
      {books.length === 0 && (
        <div className="bento-surface text-center py-20 px-6">
          <span className="text-4xl block mb-2">🔍</span>
          <h3 className="text-base font-bold text-slate-800">
            ไม่พบหนังสือที่ตรงกับคำค้นหา
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            ลองใช้คำค้นหาที่สั้นลง หรือคลิกดูหนังสือทั้งหมดในทุกหมวดหมู่
          </p>
          <div className="mt-4">
            <Link
              href="/"
              suppressHydrationWarning
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg inline-block transition-colors"
            >
              กลับสู่รายการหนังสือทั้งหมด
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
