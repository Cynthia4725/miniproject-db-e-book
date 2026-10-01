import { getDatabaseExecutor } from '@/db/client';
import { verifyPaymentAction } from '@/app/actions/admin.actions';
import { SlipPreviewModal } from '@/components/SlipPreviewModal';

export const dynamic = 'force-dynamic';

interface PendingOrderItem {
  payment_id: number;
  order_id: number;
  order_number: string;
  user_name: string;
  user_email: string;
  amount_paid: number;
  slip_image_url: string;
  transferred_at: string;
}

export default async function AdminOrdersPage() {
  const db = getDatabaseExecutor();
  const pendingOrders = await db.query<PendingOrderItem>(`
    SELECT 
      p.id AS payment_id,
      o.id AS order_id,
      o.order_number,
      u.full_name AS user_name,
      u.email AS user_email,
      p.amount_paid,
      p.slip_image_url,
      p.transferred_at
    FROM orders o
    JOIN users u ON o.user_id = u.id
    JOIN payments p ON o.id = p.order_id
    WHERE o.order_status = 'PAYMENT_SUBMITTED' AND p.status = 'PENDING_REVIEW'
    ORDER BY p.transferred_at ASC;
  `);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            คิวตรวจสอบสลิปการโอนเงิน
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-mono">
            PAYMENT_SUBMITTED & PENDING_REVIEW: {pendingOrders.length} รายการ
          </p>
        </div>
      </div>

      {pendingOrders.length === 0 ? (
        <div className="bento-surface p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-2xl mx-auto">
            ✨
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-sm">ไม่มีสลิปที่รอการตรวจสอบในขณะนี้</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              เมื่อลูกค้าทำการสั่งซื้อและอัปโหลดสลิปโอนเงิน รายการจะปรากฏขึ้นที่นี่โดยอัตโนมัติ
            </p>
          </div>
        </div>
      ) : (
        <div className="bento-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">หมายเลขคำสั่งซื้อ</th>
                  <th className="py-3 px-4">ลูกค้า</th>
                  <th className="py-3 px-4">ยอดเงินที่โอน</th>
                  <th className="py-3 px-4">หลักฐานสลิป</th>
                  <th className="py-3 px-4 text-right">ดำเนินการ (Action)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {pendingOrders.map((order) => (
                  <tr key={order.payment_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {order.order_number}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">{order.user_name}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{order.user_email}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-600 font-mono tabular-nums">
                      ฿{Number(order.amount_paid).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <SlipPreviewModal
                        orderNumber={order.order_number}
                        userName={order.user_name}
                        amountPaid={order.amount_paid}
                        slipImageUrl={order.slip_image_url}
                      />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Approve Form */}
                        <form action={verifyPaymentAction.bind(null, order.payment_id, 'APPROVED', undefined)}>
                          <button
                            type="submit"
                            suppressHydrationWarning
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-all shadow-xs text-xs flex items-center gap-1"
                          >
                            <span>✓</span>
                            <span>อนุมัติ (Fulfill)</span>
                          </button>
                        </form>

                        {/* Reject Form */}
                        <form action={verifyPaymentAction.bind(null, order.payment_id, 'REJECTED', 'สลิปไม่ถูกต้อง')}>
                          <button
                            type="submit"
                            suppressHydrationWarning
                            className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200/60 text-red-700 font-medium rounded-lg transition-colors text-xs"
                          >
                            ✕ ปฏิเสธ
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
