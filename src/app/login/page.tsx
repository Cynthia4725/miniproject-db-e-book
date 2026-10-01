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
    <div className="max-w-md mx-auto my-8 space-y-6">
      <div className="text-center">
        <span className="text-3xl block mb-2">🔐</span>
        <h1 className="text-2xl font-extrabold text-slate-900">
          เข้าสู่ระบบ (Sign In)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          เข้าสู่ระบบร้านหนังสือออนไลน์เพื่อดูตะกร้าสินค้า สั่งซื้อ หรือจัดการระบบ
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
            <span>⚠️</span>
            <div className="flex-1">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1">
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
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1">
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
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-2 mt-2"
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

        {/* Evaluator Quick-Fill Cards */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
            บัญชีทดสอบสำหรับอาจารย์/ผู้ตรวจ (Quick Fill):
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => fillQuickLogin('somchai@example.com', 'password123')}
              className="p-2 text-left bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 rounded-lg transition-colors"
            >
              <span className="font-bold text-slate-800 block truncate">👤 สมชาย (ลูกค้า)</span>
              <span className="text-[10px] text-slate-400 block truncate">somchai@example.com</span>
            </button>
            <button
              type="button"
              onClick={() => fillQuickLogin('admin@ebookstore.com', 'admin123')}
              className="p-2 text-left bg-slate-50 hover:bg-amber-50/50 border border-slate-200 hover:border-amber-300 rounded-lg transition-colors"
            >
              <span className="font-bold text-slate-800 block truncate">🛡️ ผู้ดูแลระบบ (Admin)</span>
              <span className="text-[10px] text-slate-400 block truncate">admin@ebookstore.com</span>
            </button>
          </div>
        </div>

        <div className="border-t border-slate-100 mt-6 pt-4 text-center">
          <p className="text-xs text-slate-500">
            ยังไม่มีบัญชีผู้ใช้งาน?{' '}
            <Link href="/register" className="text-emerald-600 hover:text-emerald-700 font-bold underline">
              สมัครสมาชิกใหม่
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
