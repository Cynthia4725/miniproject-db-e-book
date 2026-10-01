'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginAction } from '@/app/actions/auth.actions';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await loginAction(formData);
      if (!res.success) {
        setError(res.error || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      } else if (res.redirectUrl) {
        router.push(res.redirectUrl);
        router.refresh();
      }
    });
  };

  const fillQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="max-w-md mx-auto my-8 space-y-6" suppressHydrationWarning>
      <div className="text-center space-y-1.5" suppressHydrationWarning>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200/80 text-[11px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Single Sign-On & Verification
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          เข้าสู่ระบบ
        </h1>
        <p className="text-xs text-slate-500">
          เข้าสู่ระบบร้านหนังสือออนไลน์เพื่อจัดการตะกร้าสินค้า สั่งซื้อ หรือตรวจสอบสิทธิ์คลังหนังสือ
        </p>
      </div>

      <div className="bento-surface p-6 sm:p-8" suppressHydrationWarning>
        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200/80 rounded-xl text-xs text-red-700 flex items-start gap-2.5">
            <span className="text-red-500 font-bold">!</span>
            <div className="flex-1 leading-relaxed">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-xs font-semibold text-slate-800">
              อีเมล (Email)
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              suppressHydrationWarning
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-xs font-semibold text-slate-800">
              รหัสผ่าน (Password)
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              suppressHydrationWarning
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            suppressHydrationWarning
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 mt-3"
          >
            {isPending ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>กำลังเข้าสู่ระบบ...</span>
              </>
            ) : (
              <span>เข้าสู่ระบบ (Sign In)</span>
            )}
          </button>
        </form>

        {/* Quick Fill Cards */}
        <div className="mt-6 pt-5 border-t border-slate-100" suppressHydrationWarning>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
            บัญชีทดสอบสำหรับประเมินผล (Quick Fill):
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs" suppressHydrationWarning>
            <button
              type="button"
              onClick={() => fillQuickLogin('somchai@example.com', 'password123')}
              suppressHydrationWarning
              className="p-2.5 text-left bg-slate-50 hover:bg-emerald-50/40 border border-slate-200/80 hover:border-emerald-300 rounded-xl transition-all"
            >
              <span className="font-semibold text-slate-800 block truncate text-[11px]">👤 สมชาย (ลูกค้า)</span>
              <span className="text-[10px] text-slate-400 font-mono block truncate">somchai@example.com</span>
            </button>
            <button
              type="button"
              onClick={() => fillQuickLogin('admin@ebookstore.com', 'admin123')}
              suppressHydrationWarning
              className="p-2.5 text-left bg-slate-50 hover:bg-amber-50/40 border border-slate-200/80 hover:border-amber-300 rounded-xl transition-all"
            >
              <span className="font-semibold text-slate-800 block truncate text-[11px]">🛡️ ผู้ดูแลระบบ (Admin)</span>
              <span className="text-[10px] text-slate-400 font-mono block truncate">admin@ebookstore.com</span>
            </button>
          </div>
        </div>

        <div className="border-t border-slate-100 mt-6 pt-4 text-center" suppressHydrationWarning>
          <p className="text-xs text-slate-500" suppressHydrationWarning>
            ยังไม่มีบัญชีผู้ใช้งาน?{' '}
            <Link
              href="/register"
              suppressHydrationWarning
              className="text-emerald-600 hover:text-emerald-700 font-semibold underline underline-offset-2"
            >
              สมัครสมาชิกใหม่
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
