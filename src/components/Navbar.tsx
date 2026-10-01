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
    <header className="sticky top-0 z-50 shadow-xs" suppressHydrationWarning>
      <DemoSwitcher currentUser={currentUser} />
      <nav className="glass-nav" suppressHydrationWarning>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Brand Logo & Core Nav */}
            <div className="flex items-center gap-8">
              <Link
                href="/"
                className="group flex items-center gap-2.5 text-lg font-bold text-slate-900 tracking-tight transition-colors hover:text-emerald-700"
                suppressHydrationWarning
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
                  📚
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold tracking-tight">Neon</span>
                  <span className="font-normal text-slate-500">e-Book</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" title="Neon Database Connected" />
                </div>
              </Link>

              <div className="hidden sm:flex items-center gap-1 text-xs font-medium text-slate-600" suppressHydrationWarning>
                <Link
                  href="/"
                  className="px-3 py-1.5 rounded-md hover:text-slate-900 hover:bg-slate-100/70 transition-colors"
                  suppressHydrationWarning
                >
                  แคตตาล็อก (Catalog)
                </Link>
                <Link
                  href="/library"
                  className="px-3 py-1.5 rounded-md hover:text-slate-900 hover:bg-slate-100/70 transition-colors"
                  suppressHydrationWarning
                >
                  คลังหนังสือของฉัน (Library)
                </Link>
              </div>
            </div>

            {/* Actions & Cart */}
            <div className="flex items-center gap-3" suppressHydrationWarning>
              <Link
                href="/cart"
                suppressHydrationWarning
                className="relative flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200/90 bg-white/70 hover:bg-white hover:border-emerald-500/60 hover:text-emerald-700 text-slate-700 text-xs font-medium transition-all shadow-2xs"
              >
                <span className="text-sm">🛒</span>
                <span>ตะกร้า</span>
                {cartItemCount > 0 ? (
                  <span
                    suppressHydrationWarning
                    className="tabular-nums font-mono bg-rose-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full min-w-[1.1rem] h-[1.1rem] flex items-center justify-center shadow-xs"
                  >
                    {cartItemCount > 9 ? '9+' : cartItemCount}
                  </span>
                ) : (
                  <span className="tabular-nums font-mono text-slate-400 text-[10px]">0</span>
                )}
              </Link>

              {currentUser?.role === 'admin' && (
                <div className="flex items-center gap-1.5 border-l border-slate-200/80 pl-3 ml-1" suppressHydrationWarning>
                  <Link
                    href="/admin/orders"
                    suppressHydrationWarning
                    className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-800 hover:bg-amber-500/20 border border-amber-500/25 text-[11px] font-semibold transition-colors"
                  >
                    คิวสลิป (Orders)
                  </Link>
                  <Link
                    href="/admin/books"
                    suppressHydrationWarning
                    className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-800 hover:bg-amber-500/20 border border-amber-500/25 text-[11px] font-semibold transition-colors"
                  >
                    จัดการหนังสือ (Books)
                  </Link>
                  <Link
                    href="/admin/analytics"
                    suppressHydrationWarning
                    className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-800 hover:bg-amber-500/20 border border-amber-500/25 text-[11px] font-semibold transition-colors"
                  >
                    วิเคราะห์ 5 มิติ (Analytics)
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
