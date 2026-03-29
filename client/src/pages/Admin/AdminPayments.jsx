import { useEffect, useState } from 'react';
import { CreditCard, RefreshCcw } from 'lucide-react';
import api from '../../lib/api';

const statusColor = {
  Paid: 'text-green-400',
  Pending: 'text-orange-400',
  Failed: 'text-red-400',
  Unpaid: 'text-gray-400',
};

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPayments = async () => {
    try {
      const response = await api.get('/payments');
      setPayments(response.data);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Payment Monitoring</h2>
          <p className="text-sm text-textMuted">Track payment provider, status, and order linkage.</p>
        </div>
        <button
          onClick={fetchPayments}
          className="inline-flex items-center space-x-2 rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
        >
          <RefreshCcw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-textMuted">Loading payments...</div>
      ) : error ? (
        <div className="glass-panel rounded-2xl p-4 text-red-400">{error}</div>
      ) : payments.length === 0 ? (
        <div className="glass-panel rounded-2xl p-6 text-textMuted">No payment transactions yet.</div>
      ) : (
        <div className="glass-panel overflow-hidden border border-white/5 rounded-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-textMuted uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-4 py-3">Tx Ref</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">{payment.tx_ref}</td>
                  <td className="px-4 py-3 font-mono text-xs">#{payment.orderId.slice(0, 8)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center space-x-2">
                      <CreditCard size={14} />
                      <span>{payment.provider}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">{payment.currency} {Number(payment.amount).toFixed(2)}</td>
                  <td className={`px-4 py-3 font-semibold ${statusColor[payment.status] || 'text-textMuted'}`}>
                    {payment.status}
                  </td>
                  <td className="px-4 py-3 text-xs text-textMuted">
                    {new Date(payment.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
