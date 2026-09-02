import { Receipt } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { OrderPublic, PaymentStatus } from '@/types/order';
import { PLAN_MAP } from '@/lib/constants';

interface TransactionTableProps {
  orders: OrderPublic[];
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  const map: Record<PaymentStatus, { variant: 'success' | 'warning' | 'error'; label: string }> = {
    paid:      { variant: 'success', label: '✅ Paid' },
    COMPLETED: { variant: 'success', label: '✅ Completed' },
    verifying: { variant: 'warning', label: '⚡ Verifying' },
    pending:   { variant: 'warning', label: '⏳ Pending' },
    failed:    { variant: 'error',   label: '❌ Failed' },
  };
  const { variant, label } = map[status] || { variant: 'warning', label: String(status) };
  return <Badge variant={variant}>{label}</Badge>;
}

export function TransactionTable({ orders }: TransactionTableProps) {
  return (
    <div className="bg-surface-800 border border-surface-600 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-surface-600">
        <Receipt size={18} className="text-brand-400" />
        <h2 className="text-white font-bold">Recent Transactions</h2>
        <span className="ml-auto text-xs text-gray-500">{orders.length} orders</span>
      </div>

      {orders.length === 0 ? (
        <div className="py-16 text-center text-gray-500">
          <Receipt size={40} className="mx-auto mb-3 opacity-30" />
          No transactions yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-700 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-6 py-3">Order ID</th>
                <th className="text-left px-4 py-3">Plan</th>
                <th className="text-left px-4 py-3">Amount</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-700">
              {orders.map((order) => {
                const plan = PLAN_MAP[order.plan_type];
                const amountDisplay =
                  order.currency === 'INR'
                    ? `₹${(order.amount / 100).toLocaleString('en-IN')}`
                    : `$${(order.amount / 100).toFixed(2)}`;

                return (
                  <tr
                    key={order.order_id}
                    className="hover:bg-surface-700/50 transition-colors"
                  >
                    <td className="px-6 py-3.5">
                      <code className="text-brand-300 text-xs font-mono">
                        {order.order_id}
                      </code>
                    </td>
                    <td className="px-4 py-3.5 text-gray-300">
                      {plan?.name ?? order.plan_type}
                    </td>
                    <td className="px-4 py-3.5 text-white font-semibold">
                      {amountDisplay}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={order.payment_status} />
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 text-xs">
                      {order.created_at
                        ? new Date(order.created_at).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
