'use client';

import React, { useState, useRef, useTransition } from 'react';

interface AdminAddBookFormProps {
  action: (formData: FormData) => Promise<void>;
}

const DEFAULT_NO_COVER = '/images/no-cover.svg';

export function AdminAddBookForm({ action }: AdminAddBookFormProps) {
  const [mode, setMode] = useState<'url' | 'upload' | 'nocover'>('nocover');
  const [urlInput, setUrlInput] = useState('');
  const [uploadBase64, setUploadBase64] = useState<string | null>(null);
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Compute active preview URL
  const activeCoverUrl =
    mode === 'upload' && uploadBase64
      ? uploadBase64
      : mode === 'url' && urlInput.trim().length > 0
      ? urlInput.trim()
      : DEFAULT_NO_COVER;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);

    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SIZE) {
      const actualMb = (file.size / (1024 * 1024)).toFixed(2);
      setErrorMessage(`ไฟล์มีขนาด ${actualMb} MB ซึ่งเกินขีดจำกัด 2 MB กรุณาเลือกรูปภาพที่มีขนาดเล็กกว่า 2 MB`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploadFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUploadBase64(reader.result);
      }
    };
    reader.onerror = () => {
      setErrorMessage('เกิดข้อผิดพลาดในการอ่านไฟล์รูปภาพ');
    };
    reader.readAsDataURL(file);
  };

  const handleClearUpload = () => {
    setUploadBase64(null);
    setUploadFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Explicitly set cover_image_url
    formData.set('cover_image_url', activeCoverUrl);

    startTransition(async () => {
      try {
        await action(formData);
        form.reset();
        setUrlInput('');
        setUploadBase64(null);
        setUploadFileName(null);
        setMode('nocover');
      } catch (err: any) {
        setErrorMessage(err?.message || 'เกิดข้อผิดพลาดในการบันทึกหนังสือ');
      }
    });
  };

  return (
    <div className="bento-surface p-6 sm:p-7 space-y-5" suppressHydrationWarning>
      <div className="flex items-center justify-between border-b border-slate-100 pb-3" suppressHydrationWarning>
        <div className="flex items-center gap-2" suppressHydrationWarning>
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            เพิ่มหนังสือเล่มใหม่เข้าแคตตาล็อก (Add New Book)
          </h2>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">3NF E-Book Catalog</span>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200/80 rounded-xl text-xs text-red-700 flex items-center justify-between" suppressHydrationWarning>
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

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6" suppressHydrationWarning>
        {/* Core Book Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" suppressHydrationWarning>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              ชื่อหนังสือ (Title) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              required
              placeholder="e.g. Distributed Systems in Go"
              suppressHydrationWarning
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              ISBN <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="isbn"
              required
              placeholder="e.g. 978-0123456789"
              suppressHydrationWarning
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              ราคาปกติ (Price ฿) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="price"
              step="0.01"
              required
              placeholder="e.g. 690"
              suppressHydrationWarning
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              ราคาโปรโมชั่น (Discount ฿)
            </label>
            <input
              type="number"
              name="discount_price"
              step="0.01"
              placeholder="เว้นว่างได้"
              suppressHydrationWarning
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono"
            />
          </div>
        </div>

        {/* Cover Image Selector Section */}
        <div className="border border-slate-200/80 rounded-2xl p-5 bg-slate-50/50 space-y-4" suppressHydrationWarning>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3" suppressHydrationWarning>
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                ภาพหน้าปกหนังสือ (Cover Image)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                เลือกรูปแบบ: อัปโหลดรูปภาพ, ระบุ URL รูปภาพ, หรือใช้ภาพ No-Cover อัตโนมัติ
              </p>
            </div>

            {/* Mode Toggle Buttons */}
            <div className="inline-flex rounded-lg bg-white p-1 border border-slate-200 shadow-2xs" suppressHydrationWarning>
              <button
                type="button"
                onClick={() => setMode('nocover')}
                suppressHydrationWarning
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  mode === 'nocover'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🚫 No-Cover (เริ่มต้น)
              </button>
              <button
                type="button"
                onClick={() => setMode('url')}
                suppressHydrationWarning
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  mode === 'url'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🔗 ระบุ URL
              </button>
              <button
                type="button"
                onClick={() => setMode('upload')}
                suppressHydrationWarning
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  mode === 'upload'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📁 อัปโหลดรูป
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center" suppressHydrationWarning>
            {/* Input Form Column */}
            <div className="md:col-span-8 space-y-3" suppressHydrationWarning>
              {mode === 'nocover' && (
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold text-sm">✓</span>
                    <span className="text-xs font-semibold text-slate-800">ใช้ภาพหน้าปกมาตรฐาน (Default No-Cover)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    ระบบจะใช้ภาพปก SVG สไตล์โมเดิร์นสี Slate Dark อัตโนมัติ โดยไม่จำเป็นต้องอัปโหลดรูปภาพ สามารถมาแก้ไขในภายหลังได้
                  </p>
                </div>
              )}

              {mode === 'url' && (
                <div className="space-y-1.5" suppressHydrationWarning>
                  <label className="block text-xs font-semibold text-slate-700">
                    URL รูปภาพหน้าปก (Image URL)
                  </label>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://images.unsplash.com/... หรือ https://placehold.co/..."
                    suppressHydrationWarning
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono"
                  />
                  <p className="text-[10px] text-slate-400">
                    *หากเว้นว่างไว้หรือลิงก์เข้าถึงไม่ได้ ระบบจะสลับไปใช้ภาพ No-Cover โดยอัตโนมัติ
                  </p>
                </div>
              )}

              {mode === 'upload' && (
                <div className="space-y-2" suppressHydrationWarning>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/20 rounded-xl p-4 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-1.5 bg-white group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-slate-50 group-hover:bg-emerald-50 border border-slate-200 flex items-center justify-center text-slate-500 group-hover:text-emerald-600 transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800 group-hover:text-emerald-700">
                        {uploadFileName ? `ไฟล์ที่เลือก: ${uploadFileName}` : 'คลิกเพื่อเลือกไฟล์รูปภาพหน้าปก'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        รองรับ PNG, JPEG, WebP (ขนาดไม่เกิน 2 MB • แปลงเป็น Base64 Data URL)
                      </p>
                    </div>
                  </div>

                  {uploadBase64 && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-emerald-700 text-[11px] font-semibold">
                        ✓ อัปโหลดสำเร็จ ({uploadFileName})
                      </span>
                      <button
                        type="button"
                        onClick={handleClearUpload}
                        className="text-red-500 hover:text-red-700 text-[11px] underline"
                      >
                        ยกเลิกรูปนี้
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Live Preview Card */}
            <div className="md:col-span-4 flex flex-col items-center justify-center" suppressHydrationWarning>
              <div className="w-24 h-36 bg-slate-900 rounded-lg overflow-hidden border border-slate-300 shadow-md relative group flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeCoverUrl}
                  alt="Cover Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to default if external URL fails to load
                    (e.target as HTMLImageElement).src = DEFAULT_NO_COVER;
                  }}
                />
                <span className="absolute bottom-1 inset-x-1 text-center bg-black/70 text-white text-[9px] font-mono py-0.5 rounded backdrop-blur-xs">
                  {mode === 'nocover' ? 'NO-COVER' : mode === 'url' ? 'URL' : 'UPLOAD'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono mt-2">พรีวิวรูปปกที่จะแสดง</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2" suppressHydrationWarning>
          <button
            type="submit"
            disabled={isPending}
            suppressHydrationWarning
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs rounded-xl shadow-xs hover:shadow transition-all flex items-center gap-2"
          >
            {isPending ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>กำลังบันทึกหนังสือ...</span>
              </>
            ) : (
              <>
                <span>+</span>
                <span>บันทึกหนังสือเล่มใหม่ (Save Book)</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
