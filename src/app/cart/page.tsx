import Link from 'next/link';
import { CartRepository } from '@/modules/cart/cart.repository';
import { getCurrentUser, DEMO_USERS, setSessionCookie } from '@/lib/session';
import { removeFromCartAction, checkoutAction } from '@/app/actions/cart.actions';

export const dynamic = 'force-dynamic';

export default async function CartPage() {
  let user = await getCurrentUser();
  if (!user) {
    user = DEMO_USERS.customer;
    await setSessionCookie(user);
  }

  const cartRepo = new CartRepository();
  const cart = await cartRepo.getCartWithItems(user.userId);

  async function handleCheckout(formData: FormData) {
    'use server';
    const coupon = formData.get('coupon')?.toString();
    await checkoutAction(coupon);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          ตะกร้าสินค้า (Shopping Cart)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          รายการ e-Book ดิจิทัลผูกกับบัญชี: <strong className="text-slate-700">{user.name}</strong> ({user.email})
        </p>
      </div>

      {cart.items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
          <span className="text-5xl block">🛒</span>
          <h2 className="text-lg font-bold text-slate-800">ไม่มีหนังสือในตะกร้า</h2>
          <p className="text-xs text-slate-500">เลือกดูหนังสือเทคนิคและฐานข้อมูลที่น่าสนใจได้ในหน้าแคตตาล็อก</p>
          <div>
            <Link
              href="/"
              className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors"
            >
              ไปเลือกซื้อหนังสือ
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Items Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <ul className="divide-y divide-slate-100">
              {cart.items.map((item) => (
                <li key={item.id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📖</span>
                    <div>
                      <Link href={`/books/${item.bookId}`} className="font-bold text-sm text-slate-900 hover:text-emerald-600 transition-colors">
                        {item.title}
                      </Link>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">Digital Edition (Single License)</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-slate-900">
                      ฿{item.effectivePrice.toLocaleString()}
                    </span>

                    <form action={async () => {
                      'use server';
                      await removeFromCartAction(item.bookId);
                    }}>
                      <button
                        type="submit"
                        className="text-xs text-red-500 hover:text-red-700 p-1 font-medium transition-colors"
                        title="ลบออกจากตะกร้า"
                      >
                        ลบ
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Checkout Summary Card */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
              สรุปคำสั่งซื้อ (Order Summary)
            </h3>

            <form action={handleCheckout} className="space-y-4">
              {/* Coupon input */}
              <div>
                <label htmlFor="coupon" className="block text-xs font-semibold text-slate-600 mb-1">
                  โค้ดคูปองส่วนลด (Coupon Code)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="coupon"
                    name="coupon"
                    placeholder="เช่น DISCOUNT50 หรือ PERCENT10"
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 uppercase focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  ลองใช้: <strong>DISCOUNT50</strong> (ลด 50 บาท) หรือ <strong>PERCENT10</strong> (ลด 10%)
                </span>
              </div>

              {/* Price Calculations */}
              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>จำนวนเล่ม:</span>
                  <span className="font-semibold">{cart.totalItems} เล่ม</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>ยอดรวม (Subtotal):</span>
                  <span className="font-semibold">฿{cart.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold text-sm pt-2 border-t border-slate-100">
                  <span>ยอดชำระสุทธิ:</span>
                  <span className="text-emerald-600">฿{cart.subtotal.toLocaleString()}</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-1.5"
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
