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
      <Link href="/" className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-emerald-600 transition-colors">
        ← กลับสู่หน้าแคตตาล็อก (Back to Catalog)
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8 p-6 sm:p-8">
        {/* Book Cover */}
        <div className="md:col-span-1 flex flex-col items-center">
          <div className="w-full max-w-[260px] aspect-[3/4] bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center p-4 border border-slate-200 shadow-inner">
            {book.coverImageUrl ? (
              <img
                src={book.coverImageUrl}
                alt={book.title}
                className="max-h-full max-w-full object-contain rounded shadow"
              />
            ) : (
              <div className="text-center">
                <span className="text-6xl">📖</span>
                <p className="text-xs text-slate-400 mt-2 font-mono">{book.isbn}</p>
              </div>
            )}
          </div>

          <div className="mt-4 w-full">
            <a
              href="/sample-ebook.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-2 px-3 border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
            >
              📄 อ่านตัวอย่างทดลองอ่าน (Sample PDF)
            </a>
          </div>
        </div>

        {/* Book Metadata & Purchase */}
        <div className="md:col-span-2 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {book.categories.map((c) => (
                <span
                  key={c.categoryId}
                  className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200"
                >
                  {c.categoryName}
                </span>
              ))}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              {book.title}
            </h1>
            {book.subtitle && (
              <p className="text-base text-slate-500 font-medium">{book.subtitle}</p>
            )}

            <div className="pt-2 text-sm text-slate-600">
              <span className="font-semibold text-slate-800">ผู้เขียน: </span>
              {book.authors.map((a, idx) => (
                <span key={a.authorId}>
                  {a.authorName} <span className="text-xs text-slate-400 font-mono">({a.authorRole})</span>
                  {idx < book.authors.length - 1 ? ', ' : ''}
                </span>
              ))}
            </div>

            {/* Spec grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 block">รูปแบบไฟล์</span>
                <strong className="text-slate-700">{book.fileFormat} (Digital)</strong>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 block">จำนวนหน้า</span>
                <strong className="text-slate-700">{book.pageCount} หน้า</strong>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 block">ISBN</span>
                <strong className="text-slate-700 font-mono">{book.isbn}</strong>
              </div>
            </div>
          </div>

          {/* Pricing & Add to Cart */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-500 block">ราคาลิขสิทธิ์ดิจิทัลถาวร:</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-600">
                  ฿{effectivePrice.toLocaleString()}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-slate-400 line-through">
                    ฿{book.price.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            <form action={addToCartAction.bind(null, book.id)}>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow transition-colors flex items-center justify-center gap-2"
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
