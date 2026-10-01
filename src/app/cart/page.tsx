import Link from 'next/link';
import { CartRepository } from '@/modules/cart/cart.repository';
import { getCurrentUser, DEMO_USERS } from '@/lib/session';
import { removeFromCartAction, checkoutAction } from '@/app/actions/cart.actions';

export const dynamic = 'force-dynamic';

export default async function CartPage() {
  const user = (await getCurrentUser()) || DEMO_USERS.customer;

  const cartRepo = new CartRepository();
  const cart = await cartRepo.getCartWithItems(user.userId);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          ตะกร้าสินค้า (Shopping Cart)
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          รายการ e-Book ดิจิทัลสำหรับบัญชี: <strong className="text-slate-800">{user.name}</strong> ({user.email})
        </p>
      </div>

      {cart.items.length === 0 ? (
        <div className="bento-surface p-12 sm:p-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl mx-auto text-slate-400">
            🛒
          </div>
          <h2 className="text-base font-bold text-slate-800">ไม่มีหนังสือในตะกร้า</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            เลือกดูหนังสือเทคนิค สถาปัตยกรรม และฐานข้อมูลที่น่าสนใจได้ในหน้าแคตตาล็อก
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
            >
              เลือกซื้อหนังสือในแคตตาล็อก
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Cart Items List (8 cols) */}
          <div className="lg:col-span-8 bento-surface overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs font-medium text-slate-600">
              <span>รายการหนังสือ ({cart.items.length} รายการ)</span>
              <span>ราคา</span>
            </div>

            <ul className="divide-y divide-slate-100">
              {cart.items.map((item) => (
                <li key={item.id} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/40 transition-colors">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-13 bg-slate-100 rounded-lg flex items-center justify-center text-xl flex-shrink-0 border border-slate-200">
                      📖
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/books/${item.bookId}`}
                        className="font-bold text-sm text-slate-900 hover:text-emerald-700 transition-colors line-clamp-1 truncate block"
                      >
                        {item.title}
                      </Link>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Single Digital License
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="text-sm font-extrabold text-slate-900 font-mono tabular-nums">
                      ฿{item.effectivePrice.toLocaleString()}
                    </span>

                    <form action={removeFromCartAction.bind(null, item.bookId)}>
                      <button
                        type="submit"
                        className="text-xs text-slate-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 transition-colors"
                        title="ลบออกจากตะกร้า"
                      >
                        ✕
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Checkout Summary Card (4 cols) */}
          <div className="lg:col-span-4 bento-surface p-5 sm:p-6 space-y-5">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
              สรุปคำสั่งซื้อ (Order Summary)
            </h3>

            <form action={checkoutAction} className="space-y-4">
              {/* Coupon input */}
              <div>
                <label htmlFor="coupon" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  คูปองส่วนลด (Coupon Code)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="coupon"
                    name="coupon"
                    placeholder="เช่น DISCOUNT50 หรือ PERCENT10"
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="mt-2 text-[10px] text-slate-400 space-y-0.5">
                  <p>คูปองทดสอบ: <strong className="text-slate-600 font-mono">DISCOUNT50</strong> (ลด 50 บาท)</p>
                  <p>หรือ: <strong className="text-slate-600 font-mono">PERCENT10</strong> (ลด 10%)</p>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>จำนวน e-Book:</span>
                  <span className="font-mono font-semibold tabular-nums">{cart.totalItems} เล่ม</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>ยอดรวม (Subtotal):</span>
                  <span className="font-mono font-semibold tabular-nums">฿{cart.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-2.5 border-t border-slate-100">
                  <span>ยอดสุทธิที่ต้องชำระ:</span>
                  <span className="font-mono text-emerald-700 text-base tabular-nums">
                    ฿{cart.subtotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-98"
              >
                <span>💳 ยืนยันการสั่งซื้อ (Checkout)</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
