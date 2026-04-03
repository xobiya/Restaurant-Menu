import { Loader2, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { formatCurrency, formatDateTime } from '../../lib/formatters';

const getErrorMessage = (error, fallback) => error?.response?.data?.error || fallback;

const statusTone = (status) =>
  ({
    Pending: 'text-amber-200',
    Paid: 'text-green-200',
    Failed: 'text-red-200',
    Unpaid: 'text-textMuted',
  }[status] || 'text-textMuted');

export default function PaymentsPanel() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadPayments = async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await api.get('/payments');
      setPayments(Array.isArray(response.data) ? response.data : []);
      setError('');
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'Failed to fetch payments.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-[2rem] border border-white/5 bg-surface p-12 text-textMuted">
        <Loader2 className="animate-spin" />
        <span>Loading payments...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2>Payment monitoring</h2>
          <p className="mt-1 text-sm text-textMuted">
            Review gateway activity and spot unpaid or failed orders quickly.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadPayments({ silent: true })}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-textMuted transition hover:text-textMain"
        >
          {refreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          <span>Refresh</span>
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {payments.length === 0 ? (
        <div className="rounded-[2rem] border border-white/5 bg-surface p-8 text-center text-textMuted">
          No payment transactions yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[2rem] border border-white/5 bg-surface">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-[0.2em] text-textMuted">
              <tr>
                <th className="px-4 py-4">Tx Ref</th>
                <th className="px-4 py-4">Order</th>
                <th className="px-4 py-4">Table</th>
                <th className="px-4 py-4">Provider</th>
                <th className="px-4 py-4">Amount</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-white/5">
                  <td className="px-4 py-4 font-mono text-xs">{payment.tx_ref}</td>
                  <td className="px-4 py-4 font-mono text-xs">{payment.orderId}</td>
                  <td className="px-4 py-4">#{payment.order?.table_number || 'N/A'}</td>
                  <td className="px-4 py-4">{payment.provider}</td>
                  <td className="px-4 py-4">{formatCurrency(payment.amount)}</td>
                  <td className={`px-4 py-4 font-semibold ${statusTone(payment.status)}`}>
                    {payment.status}
                  </td>
                  <td className="px-4 py-4 text-xs text-textMuted">
                    {formatDateTime(payment.created_at)}
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
