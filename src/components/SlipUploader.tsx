'use client';

import React, { useState, useRef, useTransition } from 'react';

interface SlipUploaderProps {
  orderNumber: string;
  action: (formData: FormData) => Promise<void>;
}

export function SlipUploader({ orderNumber, action }: SlipUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);

    // Enforce 2MB limit
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      const actualMb = (file.size / (1024 * 1024)).toFixed(2);
      setErrorMessage(`ไฟล์มีขนาด ${actualMb} MB ซึ่งเกินขีดจำกัด 2 MB กรุณาเลือกรูปภาพที่มีขนาดเล็กกว่า 2 MB`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(1)} KB`);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPreviewUrl(reader.result);
      }
    };
    reader.onerror = () => {
      setErrorMessage('เกิดข้อผิดพลาดในการอ่านไฟล์รูปภาพ');
    };
    reader.readAsDataURL(file);
  };

  const handleClear = () => {
    setPreviewUrl(null);
    setFileName(null);
    setFileSize(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUseMock = () => {
    setErrorMessage(null);
    setFileName('mock-promptpay-slip.png');
    setFileSize('18.4 KB');
    setPreviewUrl('https://placehold.co/400x600/png?text=PromptPay+Slip+Success');
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!previewUrl) {
      setErrorMessage('กรุณาเลือกไฟล์สลิปการโอนเงินก่อนส่ง');
      return;
    }

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await action(formData);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-slate-100 pt-5 space-y-4">
      <input type="hidden" name="slip_url" value={previewUrl || ''} />

      <div>
        <label className="block text-xs font-semibold text-slate-800 mb-2">
          อัปโหลดรูปภาพสลิปโอนเงิน (Transfer Slip)
        </label>

        {/* Upload Dropzone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/30 rounded-xl p-5 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 group bg-slate-50/50"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 group-hover:border-emerald-300 group-hover:bg-emerald-50 flex items-center justify-center text-slate-500 group-hover:text-emerald-700 transition-colors shadow-xs">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors">
              คลิกเพื่อเลือกไฟล์รูปภาพสลิป
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              รองรับ PNG, JPEG, WebP (ขนาดไม่เกิน 2 MB)
            </p>
          </div>
        </div>

        {/* Quick Mock Helper */}
        <div className="flex justify-between items-center mt-2 px-1">
          <span className="text-[10px] text-slate-400">
            ระบบจัดเก็บ Base64 Data URL โดยตรง ปลอดภัยต่อการตรวจสอบ
          </span>
          <button
            type="button"
            onClick={handleUseMock}
            suppressHydrationWarning
            className="text-[10px] text-emerald-600 hover:text-emerald-800 font-medium underline underline-offset-2"
          >
            ใช้รูปตัวอย่างจำลอง
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200/80 rounded-xl text-xs text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-red-500 font-bold">!</span>
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            suppressHydrationWarning
            className="text-red-400 hover:text-red-700 text-sm font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Live Preview Card */}
      {previewUrl && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center gap-4">
          <div className="w-16 h-20 bg-white rounded-lg border border-slate-200 overflow-hidden flex-shrink-0 relative shadow-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Slip preview"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded border border-emerald-200/60">
              พร้อมส่งตรวจสอบ
            </span>
            <p className="text-xs font-semibold text-slate-800 truncate">
              {fileName || 'slip-image'}
            </p>
            <p className="text-[11px] text-slate-400 font-mono">
              ขนาด: {fileSize || '-'}
            </p>
            <button
              type="button"
              onClick={handleClear}
              suppressHydrationWarning
              className="text-[11px] text-red-600 hover:text-red-800 font-medium block pt-0.5"
            >
              ลบ / เลือกรูปใหม่
            </button>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!previewUrl || isPending}
        suppressHydrationWarning
        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
      >
        {isPending ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <span>กำลังส่งข้อมูลสลิป...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>ส่งหลักฐานการชำระเงิน (Submit Slip)</span>
          </>
        )}
      </button>
    </form>
  );
}
