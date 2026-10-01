# 01: Reactive Cart Item Badge in Navigation Header Slice

**What to build:** An interactive cart quantity indicator in the main application header. When a customer adds books to their cart, the cart button in `Navbar.tsx` dynamically displays a colored notification badge with the current number of distinct books in the active cart. Removing an item decrements the count, and checkout resets it. The badge updates without requiring manual browser refreshes via Next.js path revalidations.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] `Navbar.tsx` queries the active customer's cart via `CartRepository` or direct SQL count.
- [ ] If cart contains 1 or more items, render a distinct badge showing the count over/beside the cart icon.
- [ ] If cart is empty, do not display a counter badge.
- [ ] `addToCartAction`, `removeFromCartAction`, and `checkoutAction` trigger `revalidatePath('/', 'layout')` to keep badge in sync.
- [ ] Badge container uses `suppressHydrationWarning` to remain resilient against client browser extensions.
