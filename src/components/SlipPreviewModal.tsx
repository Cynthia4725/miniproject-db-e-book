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
          className="group relative w-12 h-14 bg-slate-100 border border-slate-200 rounded-lg overflow-hidden flex-shrink-0 hover:border-emerald-500 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
          title="คลิกเพื่อดูสลิปขนาดเต็ม"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slipImageUrl}
            alt={`Slip for ${orderNumber}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-xs font-bold">🔍</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold underline"
        >
          ดูสลิป
        </button>
      </div>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  สลิปการโอนเงิน (Order #{orderNumber})
                </h3>
                <p className="text-xs text-slate-500">
                  ลูกค้า: {userName} • ยอดเงิน: ฿{Number(amountPaid).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center font-bold text-sm transition-colors"
                title="ปิด"
              >
                ✕
              </button>
            </div>

            {/* Modal Body - Image */}
            <div className="p-4 bg-slate-900/5 max-h-[70vh] overflow-auto flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slipImageUrl}
                alt={`Full Slip for ${orderNumber}`}
                className="max-h-[65vh] w-auto rounded-lg shadow-md border border-slate-200 object-contain"
              />
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
              <a
                href={slipImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={`slip-${orderNumber}.png`}
                className="text-emerald-700 hover:text-emerald-900 font-medium underline"
              >
                ดาวน์โหลด / เปิดในแท็บใหม่ ↗
              </a>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-colors"
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
