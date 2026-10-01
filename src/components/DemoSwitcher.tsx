'use client';

import { useTransition } from 'react';
import { switchDemoRoleAction, logoutAction } from '@/app/actions/auth.actions';
import { SessionUser } from '@/lib/session';

interface DemoSwitcherProps {
  currentUser: SessionUser | null;
}

export function DemoSwitcher({ currentUser }: DemoSwitcherProps) {
  const [isPending, startTransition] = useTransition();

  const handleSwitch = (role: 'customer' | 'admin') => {
    startTransition(async () => {
      await switchDemoRoleAction(role);
    });
  };

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  return (
    <div className="bg-slate-950 border-b border-slate-800/80 text-xs py-1.5 px-4 text-slate-300" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5" suppressHydrationWarning>
        {/* Left: Persona Status Badge */}
        <div className="flex items-center gap-2" suppressHydrationWarning>
          <span className="font-mono text-[11px] font-semibold text-emerald-400/90 tracking-wide uppercase">
            Demo Persona:
          </span>
          {currentUser ? (
            <div className="flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-0.5 rounded-full border border-slate-800 text-[11px]" suppressHydrationWarning>
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${currentUser.role === 'admin' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'}`} />
              <strong className="text-white font-medium">{currentUser.name}</strong>
              <span className="text-slate-400 font-mono text-[10px]">({currentUser.role})</span>
            </div>
          ) : (
            <span className="text-slate-400 text-[11px] italic">Guest (ยังไม่ได้เลือกบทบาท)</span>
          )}
        </div>

        {/* Right: Switcher & Auth Actions */}
        <div className="flex items-center gap-1.5" suppressHydrationWarning>
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleSwitch('customer')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              currentUser?.role === 'customer'
                ? 'bg-emerald-600/90 text-white shadow-xs cursor-default'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:text-white'
            }`}
          >
            👤 ลูกค้า (Somchai)
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleSwitch('admin')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              currentUser?.role === 'admin'
                ? 'bg-amber-600/90 text-white shadow-xs cursor-default'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:text-white'
            }`}
          >
            🛡️ แอดมิน (Admin)
          </button>

          <span className="text-slate-700 mx-1">|</span>

          <a
            href="/login"
            suppressHydrationWarning
            className="px-2 py-1 rounded text-[11px] text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
          >
            เข้าสู่ระบบ
          </a>
          <a
            href="/register"
            suppressHydrationWarning
            className="px-2 py-1 rounded text-[11px] text-emerald-400 hover:text-emerald-300 hover:bg-slate-900 transition-colors font-medium"
          >
            สมัครสมาชิก
          </a>

          {currentUser && (
            <button
              type="button"
              disabled={isPending}
              onClick={handleLogout}
              className="px-2 py-0.5 rounded text-[11px] text-rose-300/80 hover:text-rose-200 hover:bg-rose-950/40 border border-rose-900/40 transition-colors ml-1"
            >
              ออก
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
