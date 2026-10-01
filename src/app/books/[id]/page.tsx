import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CatalogRepository } from '@/modules/catalog/catalog.repository';
import { BookDetailDto } from '@/modules/catalog/catalog.dto';
import { addToCartAction } from '@/app/actions/cart.actions';

export const dynamic = 'force-dynamic';

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const catalogRepo = new CatalogRepository();

  let book: BookDetailDto | null = null;
  try {
    book = await catalogRepo.getBookDetails(id);
  } catch {
    notFound();
  }

  if (!book) {
    notFound();
  }

  const hasDiscount = book.discountPrice != null && book.discountPrice < book.price;
  const effectivePrice = hasDiscount ? book.discountPrice! : book.price;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
        <Link href="/" className="hover:text-emerald-700 transition-colors">
          แคตตาล็อก
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-700 font-sans truncate max-w-sm">{book.title}</span>
      </div>

      {/* Main Book Detail Bento Container */}
      <div className="bento-surface overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-8 p-6 sm:p-8">
        {/* Left Column: Book Cover & Sample (4 cols) */}
        <div className="md:col-span-4 flex flex-col items-center">
          <div className="w-full max-w-[280px] aspect-[3/4] bg-gradient-to-b from-slate-100 to-slate-200/80 rounded-2xl flex items-center justify-center p-5 border border-slate-200 shadow-md relative group">
            {book.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={book.coverImageUrl}
                alt={book.title}
                className="max-h-full max-w-full object-contain rounded-md shadow-lg border border-black/10 group-hover:scale-102 transition-transform duration-300"
              />
            ) : (
              <div className="text-center p-4">
                <span className="text-6xl block mb-2">📖</span>
                <p className="text-xs text-slate-500 font-mono">{book.isbn || 'e-Book'}</p>
              </div>
            )}
          </div>

          <div className="mt-5 w-full max-w-[280px] space-y-2">
            <a
              href="/sample-ebook.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-2xs hover:border-slate-300"
            >
              <span>📄</span>
              <span>อ่านตัวอย่างทดลอง (Sample PDF) ↗</span>
            </a>
            <p className="text-[10px] text-center text-slate-400 font-mono">
              *ลิขสิทธิ์ดิจิทัลถาวร Single-User Digital License
            </p>
          </div>
        </div>

        {/* Right Column: Metadata, Tech Specs & Add to Cart (8 cols) */}
        <div className="md:col-span-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Category Tags */}
            <div className="flex flex-wrap gap-1.5">
              {book.categories.map((c) => (
                <span
                  key={c.categoryId}
                  className="bg-emerald-50 text-emerald-800 text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-full border border-emerald-200/80"
                >
                  {c.categoryName}
                </span>
              ))}
            </div>

            {/* Title & Subtitle */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {book.title}
              </h1>
              {book.subtitle && (
                <p className="text-sm text-slate-600 font-normal mt-1.5 leading-relaxed">
                  {book.subtitle}
                </p>
              )}
            </div>

            {/* Author Byline */}
            <div className="text-xs text-slate-600 flex flex-wrap items-center gap-1.5 pt-1">
              <span className="font-semibold text-slate-800">ผู้แต่ง:</span>
              {book.authors.map((a, idx) => (
                <span key={a.authorId} className="inline-flex items-center gap-1">
                  <strong className="text-slate-900">{a.authorName}</strong>
                  <span className="text-[10px] text-slate-400 font-mono">({a.authorRole})</span>
                  {idx < book.authors.length - 1 ? '•' : ''}
                </span>
              ))}
            </div>

            {/* Specifications Bento Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3">
              <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-mono uppercase text-slate-400 block mb-0.5">รูปแบบไฟล์</span>
                <strong className="text-slate-800 text-xs font-semibold">{book.fileFormat} (Digital)</strong>
              </div>
              <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-mono uppercase text-slate-400 block mb-0.5">จำนวนหน้า</span>
                <strong className="text-slate-800 text-xs font-semibold tabular-nums">{book.pageCount} หน้า</strong>
              </div>
              <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-mono uppercase text-slate-400 block mb-0.5">รหัสมาตรฐาน</span>
                <strong className="text-slate-800 text-xs font-mono font-semibold truncate block">{book.isbn || 'N/A'}</strong>
              </div>
              <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-mono uppercase text-slate-400 block mb-0.5">สำนักพิมพ์</span>
                <strong className="text-slate-800 text-xs font-semibold truncate block">{book.publisherName || 'อิสระ'}</strong>
              </div>
            </div>
          </div>

          {/* Pricing & Add to Cart Action Card */}
          <div className="p-5 bg-gradient-to-r from-slate-50 to-emerald-50/30 rounded-2xl border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-500 font-medium block">ราคาลิขสิทธิ์ดิจิทัลถาวร (Net Price)</span>
              <div className="flex items-baseline gap-2.5 mt-0.5">
                <span className="text-3xl font-black text-slate-900 font-mono tabular-nums">
                  ฿{effectivePrice.toLocaleString()}
                </span>
                {hasDiscount && (
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-xs text-slate-400 line-through tabular-nums">
                      ฿{book.price.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                      SALE
                    </span>
                  </div>
                )}
              </div>
            </div>

            <form action={addToCartAction.bind(null, book.id)}>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <span>🛒 เพิ่มลงในตะกร้า (Add to Cart)</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
