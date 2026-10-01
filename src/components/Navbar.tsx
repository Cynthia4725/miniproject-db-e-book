import Link from 'next/link';
import { getCurrentUser, DEMO_USERS } from '@/lib/session';
import { CartRepository } from '@/modules/cart/cart.repository';
import { DemoSwitcher } from './DemoSwitcher';

export async function Navbar() {
  const currentUser = await getCurrentUser();
  const activeUser = currentUser || DEMO_USERS.customer;
  let cartItemCount = 0;

  try {
    const cartRepo = new CartRepository();
    const cart = await cartRepo.getCartWithItems(activeUser.userId);
    cartItemCount = cart.items.length;
  } catch {
    // Fallback gracefully if database or cart is unavailable
  }

  return (
    <header className="sticky top-0 z-50 shadow-sm" suppressHydrationWarning>
      <DemoSwitcher currentUser={currentUser} />
      <nav className="bg-white border-b border-slate-200" suppressHydrationWarning>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <Link
                href="/"
                className="flex items-center gap-2 text-xl font-bold text-slate-900 hover:text-emerald-600 transition-colors"
                suppressHydrationWarning
              >
                <span className="text-2xl">📚</span>
                <span>Neon E-Book Store</span>
              </Link>
              <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-slate-600" suppressHydrationWarning>
                <Link href="/" className="hover:text-emerald-600 transition-colors" suppressHydrationWarning>
                  แคตตาล็อก (Catalog)
                </Link>
                <Link href="/library" className="hover:text-emerald-600 transition-colors" suppressHydrationWarning>
                  คลังหนังสือของฉัน (My Library)
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-4" suppressHydrationWarning>
              <Link
                href="/cart"
                suppressHydrationWarning
                className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-500 hover:text-emerald-600 text-slate-700 text-sm font-medium transition-colors"
              >
                <span className="relative">
                  🛒
                  {cartItemCount > 0 && (
                    <span
                      suppressHydrationWarning
                      className="absolute -top-2 -right-2.5 bg-rose-500 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-xs"
                    >
                      {cartItemCount > 9 ? '9+' : cartItemCount}
                    </span>
                  )}
                </span>
                <span>ตะกร้า (Cart)</span>
              </Link>

              {currentUser?.role === 'admin' && (
                <div className="flex items-center gap-2 border-l border-slate-200 pl-4" suppressHydrationWarning>
                  <Link
                    href="/admin/orders"
                    suppressHydrationWarning
                    className="px-2.5 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 text-xs font-semibold"
                  >
                    คิวสลิป (Orders)
                  </Link>
                  <Link
                    href="/admin/books"
                    suppressHydrationWarning
                    className="px-2.5 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 text-xs font-semibold"
                  >
                    จัดการหนังสือ (Books)
                  </Link>
                  <Link
                    href="/admin/analytics"
                    suppressHydrationWarning
                    className="px-2.5 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 text-xs font-semibold"
                  >
                    รายงาน 5 มิติ (Analytics)
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
