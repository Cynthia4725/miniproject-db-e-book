'use client';

import React, { useState } from 'react';

interface SlipPreviewModalProps {
  orderNumber: string;
  userName: string;
  amountPaid: number;
  slipImageUrl: string;
}

export function SlipPreviewModal({
  orderNumber,
  userName,
  amountPaid,
  slipImageUrl,
}: SlipPreviewModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          suppressHydrationWarning
          className="group relative w-11 h-13 bg-slate-100 border border-slate-200 rounded-lg overflow-hidden flex-shrink-0 hover:border-emerald-500 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
          title="คลิกเพื่อดูสลิปขนาดเต็ม"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slipImageUrl}
            alt={`Slip for ${orderNumber}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
          <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-xs font-bold">🔍</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          suppressHydrationWarning
          className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold underline underline-offset-2"
        >
          ดูสลิป
        </button>
      </div>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bento-surface max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  หลักฐานสลิปการโอนเงิน (Order #{orderNumber})
                </h3>
                <p className="text-xs text-slate-500">
                  ลูกค้า: {userName} • ยอดเงิน: <strong className="text-emerald-700 font-mono tabular-nums">฿{Number(amountPaid).toLocaleString()}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                suppressHydrationWarning
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold text-xs transition-colors"
                title="ปิด"
              >
                ✕
              </button>
            </div>

            {/* Modal Body - Image */}
            <div className="p-4 bg-slate-950/5 max-h-[70vh] overflow-auto flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slipImageUrl}
                alt={`Full Slip for ${orderNumber}`}
                className="max-h-[65vh] w-auto rounded-lg shadow-sm border border-slate-200 object-contain"
              />
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
              <a
                href={slipImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={`slip-${orderNumber}.png`}
                suppressHydrationWarning
                className="text-emerald-700 hover:text-emerald-900 font-medium underline underline-offset-2"
              >
                ดาวน์โหลด / เปิดในแท็บใหม่ ↗
              </a>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                suppressHydrationWarning
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors shadow-2xs"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
