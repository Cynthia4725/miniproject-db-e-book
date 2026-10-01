import Link from 'next/link';
import { notFound } from 'next/navigation';
import { OrderRepository } from '@/modules/orders/order.repository';
import { submitSlipAction } from '@/app/actions/cart.actions';
import { SlipUploader } from '@/components/SlipUploader';

export const dynamic = 'force-dynamic';

export default async function OrderPaymentPage({
  params,
}: {
  params: Promise<{ order_number: string }>;
}) {
  const { order_number } = await params;
  const orderRepo = new OrderRepository();
  const order = await orderRepo.findByOrderNumber(order_number);

  if (!order) {
    notFound();
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header Badge & Title */}
      <div className="text-center space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200/80 text-[11px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          สถานะคำสั่งซื้อ: {order.orderStatus}
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          ชำระเงินค่า e-Book ผ่าน พร้อมเพย์
        </h1>
        <p className="text-xs text-slate-500 font-mono">
          หมายเลขอ้างอิง: <span className="text-slate-800 font-bold">{order.orderNumber}</span>
        </p>
      </div>

      <div className="bento-surface p-6 sm:p-8 space-y-6">
        {/* Mock PromptPay QR */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-6 flex flex-col items-center justify-center space-y-4">
          <div className="w-48 h-48 bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center shadow-xs relative">
            <span className="text-6xl select-none">📱</span>
            <span className="text-[10px] text-slate-400 font-mono font-bold mt-2 uppercase tracking-widest">
              PROMPTPAY QR
            </span>
            <div className="absolute inset-x-3 bottom-3 bg-emerald-50 text-emerald-800 text-[10px] text-center font-bold py-1 rounded border border-emerald-200/80 tabular-nums">
              สแกนจ่าย ฿{Number(order.netAmount).toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <span className="text-xs text-slate-500">ยอดชำระสุทธิ</span>
            <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
              ฿{Number(order.netAmount).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Order Items Snapshot */}
        <div className="border-t border-slate-100 pt-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            รายการหนังสือในคำสั่งซื้อ ({order.items.length} รายการ)
          </h3>
          <ul className="text-xs text-slate-600 divide-y divide-slate-100">
            {order.items.map((it) => (
              <li key={it.id} className="py-2.5 flex justify-between items-center">
                <span className="text-slate-700">รหัสหนังสือ #{it.bookId} (Single Digital License)</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  ฿{Number(it.unitPrice).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Slip Submission Component */}
        <SlipUploader
          orderNumber={order_number}
          action={submitSlipAction.bind(null, order_number)}
        />
      </div>

      <div className="text-center">
        <Link
          href="/"
          suppressHydrationWarning
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors inline-flex items-center gap-1"
        >
          ← ยกเลิกหรือกลับสู่หน้าหลัก
        </Link>
      </div>
    </div>
  );
}
