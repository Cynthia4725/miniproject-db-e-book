'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registerAction } from '@/app/actions/auth.actions';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await registerAction(formData);
      if (!res.success) {
        setError(res.error || 'เกิดข้อผิดพลาดในการลงทะเบียน');
      } else if (res.redirectUrl) {
        router.push(res.redirectUrl);
        router.refresh();
      }
    });
  };

  return (
    <div className="max-w-md mx-auto my-8 space-y-6">
      <div className="text-center">
        <span className="text-3xl block mb-2">📚</span>
        <h1 className="text-2xl font-extrabold text-slate-900">
          สมัครสมาชิกใหม่ (Register)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          สร้างบัญชีเพื่อสั่งซื้อ e-Book และรับสิทธิ์อ่านในคลังหนังสือดิจิทัลส่วนตัว
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
            <label htmlFor="full_name" className="block text-xs font-semibold text-slate-700 mb-1">
              ชื่อ - นามสกุล <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              required
              placeholder="เช่น อารยา สุขใจ"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1">
              อีเมล (Email) <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              placeholder="name@example.com"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-xs font-semibold text-slate-700 mb-1">
              เบอร์โทรศัพท์ (Phone)
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              placeholder="081-234-5678"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1">
              รหัสผ่าน (Password) <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              minLength={6}
              placeholder="อย่างน้อย 6 ตัวอักษร"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label htmlFor="confirm_password" className="block text-xs font-semibold text-slate-700 mb-1">
              ยืนยันรหัสผ่าน (Confirm Password) <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="confirm_password"
              name="confirm_password"
              required
              minLength={6}
              placeholder="พิมพ์รหัสผ่านเดิมอีกครั้ง"
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
                <span>กำลังสร้างบัญชี...</span>
              </>
            ) : (
              <span>✨ ยืนยันการสมัครสมาชิก (Create Account)</span>
            )}
          </button>
        </form>

        <div className="border-t border-slate-100 mt-6 pt-4 text-center">
          <p className="text-xs text-slate-500">
            มีบัญชีผู้ใช้งานอยู่แล้ว?{' '}
            <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-bold underline">
              เข้าสู่ระบบที่นี่
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
