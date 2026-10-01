import { getDatabaseExecutor } from '@/db/client';
import { verifyPaymentAction } from '@/app/actions/admin.actions';

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            คิวตรวจสอบสลิปการโอนเงิน (Payment Slip Verification Queue)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            รายการคำสั่งซื้อสถานะ PAYMENT_SUBMITTED ที่รอดำเนินการ: {pendingOrders.length} รายการ
          </p>
        </div>
      </div>

      {pendingOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm space-y-2">
          <span className="text-4xl block">✨</span>
          <h3 className="font-bold text-slate-800 text-sm">ไม่มีสลิปที่รอการตรวจสอบในขณะนี้</h3>
          <p className="text-xs text-slate-400">เมื่อลูกค้าทำการสั่งซื้อและส่งสลิปโอนเงิน รายการจะปรากฏขึ้นที่นี่โดยอัตโนมัติ</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
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
                  <tr key={order.payment_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {order.order_number}
                    </td>
                    <td className="py-3 px-4">
                      <strong>{order.user_name}</strong>
                      <span className="block text-[11px] text-slate-400">{order.user_email}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-600">
                      ฿{Number(order.amount_paid).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <a
                        href={order.slip_image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        suppressHydrationWarning
                        className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-800 underline font-medium"
                      >
                        <span>🧾 ดูสลิป</span>
                      </a>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Approve Form */}
                        <form action={verifyPaymentAction.bind(null, order.payment_id, 'APPROVED', undefined)}>
                          <button
                            type="submit"
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors shadow-xs"
                          >
                            ✓ อนุมัติ (Fulfill)
                          </button>
                        </form>

                        {/* Reject Form */}
                        <form action={verifyPaymentAction.bind(null, order.payment_id, 'REJECTED', 'สลิปไม่ถูกต้อง')}>
                          <button
                            type="submit"
                            className="px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg transition-colors"
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
