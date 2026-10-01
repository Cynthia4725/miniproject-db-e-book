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
    <div className="bg-slate-900 border-b border-slate-800 text-xs py-2 px-4 text-slate-300" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3" suppressHydrationWarning>
        <div className="flex items-center gap-2" suppressHydrationWarning>
          <span className="font-semibold text-emerald-400">🎓 อาจารย์ / กรรมการตรวจงาน (Demo Persona Switcher):</span>
          {currentUser ? (
            <span className="flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded border border-slate-700" suppressHydrationWarning>
              <span className={`inline-block w-2 h-2 rounded-full ${currentUser.role === 'admin' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              <strong className="text-white">{currentUser.name}</strong>
              <span className="text-slate-400">({currentUser.role.toUpperCase()})</span>
            </span>
          ) : (
            <span className="text-slate-400 italic">ยังไม่ได้เลือกบทบาท (Guest)</span>
          )}
        </div>

        <div className="flex items-center gap-2" suppressHydrationWarning>
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleSwitch('customer')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              currentUser?.role === 'customer'
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            👤 สลับเป็น ลูกค้า (Somchai)
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleSwitch('admin')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              currentUser?.role === 'admin'
                ? 'bg-amber-600 text-white cursor-default'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            🛡️ สลับเป็น แอดมิน (Admin)
          </button>
          {currentUser && (
            <button
              type="button"
              disabled={isPending}
              onClick={handleLogout}
              className="px-2.5 py-1 rounded font-medium bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/50 transition-colors"
            >
              ออก
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
