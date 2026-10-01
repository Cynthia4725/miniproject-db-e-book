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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            คลังหนังสือของฉัน (My Library)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            หนังสือดิจิทัลที่ชำระเงินและได้รับกรรมสิทธิ์แล้วของ: <strong className="text-slate-800">{user.name}</strong>
          </p>
        </div>

        <Link
          href="/"
          className="px-4 py-2 bg-slate-900 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors inline-block self-start sm:self-auto"
        >
          + เลือกซื้อหนังสือเพิ่ม
        </Link>
      </div>

      {libraryItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
          <span className="text-5xl block">📚</span>
          <h2 className="text-lg font-bold text-slate-800">ยังไม่มีหนังสือในคลังของคุณ</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            หนังสือที่คุณซื้อและได้รับการตรวจสอบสลิปโอนเงินจากผู้ดูแลระบบเรียบร้อยแล้ว จะปรากฏที่นี่พร้อมสิทธิ์ดาวน์โหลดไฟล์ PDF จริง
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors"
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
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="h-44 bg-gradient-to-br from-emerald-50 to-slate-100 flex items-center justify-center p-4 border-b border-slate-100 relative">
                    {item.coverImageUrl ? (
                      <img
                        src={item.coverImageUrl}
                        alt={item.title}
                        className="max-h-full max-w-full object-contain rounded shadow"
                      />
                    ) : (
                      <div className="text-center">
                        <span className="text-4xl">📖</span>
                        <p className="text-xs font-medium text-slate-600 mt-2 line-clamp-1">{item.title}</p>
                      </div>
                    )}
                    <span className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                      OWNED
                    </span>
                  </div>

                  <div className="p-4 space-y-1">
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-2">{item.title}</h3>
                    <p className="text-[11px] text-slate-400 font-mono pt-1">
                      ได้รับเมื่อ: {new Date(item.grantedAt).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  {tokenInfo ? (
                    <a
                      href={`/api/books/download?token=${tokenInfo.token}`}
                      download
                      className="w-full block text-center py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                    >
                      ⬇️ ดาวน์โหลด PDF ({tokenInfo.remaining} ครั้งเหลือ)
                    </a>
                  ) : (
                    <button
                      disabled
                      className="w-full py-2.5 px-3 bg-slate-100 text-slate-400 text-xs font-medium rounded-lg cursor-not-allowed"
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
