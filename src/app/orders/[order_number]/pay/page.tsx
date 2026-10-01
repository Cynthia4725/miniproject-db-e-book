import Link from 'next/link';
import { notFound } from 'next/navigation';
import { OrderRepository } from '@/modules/orders/order.repository';
import { submitSlipAction } from '@/app/actions/cart.actions';

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
      <div className="text-center">
        <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full border border-amber-200">
          สถานะคำสั่งซื้อ: {order.orderStatus}
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-3">
          ชำระเงินค่า e-Book ผ่าน พร้อมเพย์ (PromptPay)
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-1">
          หมายเลขอ้างอิง: {order.orderNumber}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Mock PromptPay QR */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center space-y-3">
          <div className="w-48 h-48 bg-white border border-slate-300 rounded-xl p-3 flex flex-col items-center justify-center shadow-inner relative">
            <span className="text-6xl">📱</span>
            <span className="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-wider">PromptPay QR</span>
            <div className="absolute inset-x-2 bottom-2 bg-emerald-50 text-emerald-800 text-[9px] text-center font-bold py-0.5 rounded border border-emerald-200">
              สแกนจ่าย ฿{Number(order.netAmount).toLocaleString()}
            </div>
          </div>
          <p className="text-xs text-slate-500 text-center">
            ยอดชำระสุทธิ: <strong className="text-slate-900 text-base">฿{Number(order.netAmount).toLocaleString()}</strong>
          </p>
        </div>

        {/* Order Items Snapshot */}
        <div className="border-t border-slate-100 pt-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            รายการหนังสือในคำสั่งซื้อ ({order.items.length} รายการ):
          </h3>
          <ul className="text-xs text-slate-600 divide-y divide-slate-100">
            {order.items.map((it) => (
              <li key={it.id} className="py-2 flex justify-between">
                <span>รหัสหนังสือ #{it.bookId} (Single Digital License)</span>
                <span className="font-semibold text-slate-800">฿{Number(it.unitPrice).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Slip Submission Form */}
        <form action={submitSlipAction.bind(null, order_number)} className="border-t border-slate-100 pt-4 space-y-4">
          <div>
            <label htmlFor="slip_url" className="block text-xs font-semibold text-slate-700 mb-1">
              แนบ URL รูปภาพสลิปโอนเงิน (Transfer Slip URL)
            </label>
            <input
              type="text"
              id="slip_url"
              name="slip_url"
              defaultValue="https://placehold.co/400x600/png?text=PromptPay+Slip+Success"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <span className="text-[10px] text-slate-400 block mt-1">
              *จำลองหลักฐานการโอนเงินเพื่อส่งให้ผู้ดูแลระบบตรวจสอบ
            </span>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-1.5"
          >
            <span>📤 ส่งหลักฐานการชำระเงิน (Submit Slip)</span>
          </button>
        </form>
      </div>

      <div className="text-center">
        <Link href="/" className="text-xs text-slate-400 hover:text-slate-600">
          ยกเลิกหรือกลับสู่หน้าหลัก
        </Link>
      </div>
    </div>
  );
}
