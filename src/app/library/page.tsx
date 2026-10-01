import Link from 'next/link';
import { LibraryRepository } from '@/modules/fulfillment/library.repository';
import { getCurrentUser, DEMO_USERS } from '@/lib/session';
import { getDatabaseExecutor } from '@/db/client';

export const dynamic = 'force-dynamic';

export default async function LibraryPage() {
  const user = (await getCurrentUser()) || DEMO_USERS.customer;

  const libraryRepo = new LibraryRepository();
  const libraryItems = await libraryRepo.getUserLibrary(user.userId);
  const db = getDatabaseExecutor();

  // Fetch active download tokens for this user
  const tokens = await db.query<{ book_id: number; token: string; remaining_downloads: number }>(`
    SELECT book_id, token, (max_downloads - download_count) AS remaining_downloads
    FROM download_tokens
    WHERE user_id = $1 AND is_revoked = FALSE AND expires_at > CURRENT_TIMESTAMP AND download_count < max_downloads;
  `, [user.userId]);

  const tokenMap = new Map<string, { token: string; remaining: number }>();
  for (const t of tokens) {
    tokenMap.set(String(t.book_id), { token: t.token, remaining: t.remaining_downloads });
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="bento-surface p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Digital Bookshelf & Rights
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            คลังหนังสือของฉัน
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            หนังสือดิจิทัลที่ชำระเงินและตรวจสอบกรรมสิทธิ์แล้วของ: <strong className="text-slate-800 font-semibold">{user.name}</strong>
          </p>
        </div>

        <Link
          href="/"
          suppressHydrationWarning
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition-all self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          เลือกซื้อหนังสือเพิ่ม
        </Link>
      </div>

      {libraryItems.length === 0 ? (
        <div className="bento-surface p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl mx-auto text-slate-500 border border-slate-200/80">
            📚
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-800">ยังไม่มีหนังสือในคลังของคุณ</h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              หนังสือที่คุณชำระเงินและได้รับการอนุมัติสลิปโอนเงินแล้ว จะปรากฏที่นี่โดยอัตโนมัติ พร้อมสิทธิ์ดาวน์โหลดไฟล์ PDF คุณภาพสูง
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              suppressHydrationWarning
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              ไปเลือกซื้อหนังสือเล่มแรก
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {libraryItems.map((item) => {
            const tokenInfo = tokenMap.get(String(item.bookId));

            return (
              <div
                key={item.libraryId}
                className="bento-surface flex flex-col justify-between overflow-hidden group hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="h-52 bg-slate-50/80 flex items-center justify-center p-4 border-b border-slate-100 relative overflow-hidden">
                    {item.coverImageUrl ? (
                      <img
                        src={item.coverImageUrl}
                        alt={item.title}
                        className="max-h-full max-w-full object-contain rounded shadow-sm group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <span className="text-4xl block mb-2 opacity-80">📖</span>
                        <p className="text-xs font-medium text-slate-600 line-clamp-1">{item.title}</p>
                      </div>
                    )}
                    <span className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm tracking-wider">
                      OWNED
                    </span>
                  </div>

                  <div className="p-5 space-y-2">
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      อนุมัติสิทธิ์: {new Date(item.grantedAt).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  {tokenInfo ? (
                    <a
                      href={`/api/books/download?token=${tokenInfo.token}`}
                      download
                      suppressHydrationWarning
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors text-center"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>ดาวน์โหลด PDF ({tokenInfo.remaining} ครั้งเหลือ)</span>
                    </a>
                  ) : (
                    <button
                      disabled
                      suppressHydrationWarning
                      className="w-full py-2.5 px-3 bg-slate-100 text-slate-400 text-xs font-medium rounded-lg cursor-not-allowed border border-slate-200/50"
                    >
                      ไม่มีโทเค็นดาวน์โหลด
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
