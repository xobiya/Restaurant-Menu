import { Loader2, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../../lib/api';
import { formatCurrency, formatDateTime } from '../../lib/formatters';
import { SOCKET_URL } from '../../lib/socket';

const NEXT_STATUS = {
  Pending: 'Preparing',
  Preparing: 'Ready',
  Ready: 'Completed',
};

const statusTone = (status) =>
  ({
    Pending: 'border-white/10 bg-white/5 text-textMuted',
    Preparing: 'border-amber-500/20 bg-amber-500/10 text-amber-200',
    Ready: 'border-sky-500/20 bg-sky-500/10 text-sky-200',
    Completed: 'border-green-500/20 bg-green-500/10 text-green-200',
    Cancelled: 'border-red-500/20 bg-red-500/10 text-red-200',
    Paid: 'border-green-500/20 bg-green-500/10 text-green-200',
    Failed: 'border-red-500/20 bg-red-500/10 text-red-200',
    Unpaid: 'border-white/10 bg-white/5 text-textMuted',
    PendingPayment: 'border-amber-500/20 bg-amber-500/10 text-amber-200',
  }[status] || 'border-white/10 bg-white/5 text-textMuted');

const getErrorMessage = (error, fallback) => error?.response?.data?.error || fallback;

const mergeOrder = (orders, incoming) => {
  const exists = orders.some((order) => order.id === incoming.id);
  const next = exists
    ? orders.map((order) => (order.id === incoming.id ? { ...order, ...incoming } : order))
    : [incoming, ...orders];

  return next.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};

export default function OrdersPanel() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionId, setActionId] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');

  const loadOrders = async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await api.get('/orders', {
        params: statusFilter === 'all' ? undefined : { status: statusFilter },
      });
      setOrders(Array.isArray(response.data) ? response.data : []);
      setError('');
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'Failed to fetch orders.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  useEffect(() => {
    const socket = io(SOCKET_URL);

    const handleIncoming = (incoming) => {
      setOrders((current) => mergeOrder(current, incoming));
    };

    socket.on('orderPlaced', handleIncoming);
    socket.on('statusUpdated', handleIncoming);
    socket.on('orderUpdated', handleIncoming);

    return () => {
      socket.disconnect();
    };
  }, []);

  const stats = useMemo(
    () => ({
      total: orders.length,
      active: orders.filter((order) => ['Pending', 'Preparing', 'Ready'].includes(order.status)).length,
      paid: orders.filter((order) => order.payment_status === 'Paid').length,
      revenue: orders.reduce((sum, order) => {
        const cashCompleted = order.payment_method === 'Cash' && order.status === 'Completed';
        return order.payment_status === 'Paid' || cashCompleted ? sum + Number(order.total_amount) : sum;
      }, 0),
    }),
    [orders]
  );

  const handleAdvanceStatus = async (order) => {
    const nextStatus = NEXT_STATUS[order.status];
    if (!nextStatus) return;

    setActionId(order.id);

    try {
      await api.patch(`/orders/${order.id}/status`, {
        status: nextStatus,
      });
      setError('');
    } catch (updateError) {
      setError(getErrorMessage(updateError, 'Failed to update order status.'));
    } finally {
      setActionId('');
    }
  };

  const handleCancel = async (order) => {
    if (!window.confirm(`Cancel ${order.order_number}?`)) return;

    setActionId(order.id);
    try {
      await api.patch(`/orders/${order.id}/status`, {
        status: 'Cancelled',
      });
      setError('');
    } catch (updateError) {
      setError(getErrorMessage(updateError, 'Failed to cancel order.'));
    } finally {
      setActionId('');
    }
  };

  const handleMarkPaid = async (order) => {
    setActionId(order.id);

    try {
      await api.patch(`/orders/${order.id}/payment-status`, {
        payment_status: 'Paid',
      });
      setError('');
    } catch (updateError) {
      setError(getErrorMessage(updateError, 'Failed to mark order as paid.'));
    } finally {
      setActionId('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-[2rem] border border-white/5 bg-surface p-12 text-textMuted">
        <Loader2 className="animate-spin" />
        <span>Loading orders...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2>Orders management</h2>
          <p className="mt-1 text-sm text-textMuted">
            Track every table order, reconcile cash, and keep the kitchen status in sync.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="premium-input min-w-44"
          >
            <option value="all">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="Preparing">Preparing</option>
            <option value="Ready">Ready</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <button
            type="button"
            onClick={() => loadOrders({ silent: true })}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-textMuted transition hover:text-textMain"
          >
            {refreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Total orders', stats.total],
          ['Active queue', stats.active],
          ['Paid orders', stats.paid],
          ['Revenue', formatCurrency(stats.revenue)],
        ].map(([label, value]) => (
          <article
            key={label}
            className="rounded-[1.75rem] border border-white/5 bg-surface p-5 shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
          >
            <p className="text-sm text-textMuted">{label}</p>
            <p className="mt-2 text-3xl font-black">{value}</p>
          </article>
        ))}
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {orders.length === 0 ? (
        <div className="rounded-[2rem] border border-white/5 bg-surface p-8 text-center text-textMuted">
          No orders found for this filter.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[2rem] border border-white/5 bg-surface shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-[0.2em] text-textMuted">
              <tr>
                <th className="px-4 py-4">Order</th>
                <th className="px-4 py-4">Customer</th>
                <th className="px-4 py-4">Items</th>
                <th className="px-4 py-4">Total</th>
                <th className="px-4 py-4">Payment</th>
                <th className="px-4 py-4">Kitchen</th>
                <th className="px-4 py-4">Created</th>
                <th className="px-4 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orders.map((order) => (
                <tr key={order.id} className="align-top hover:bg-white/5">
                  <td className="px-4 py-4">
                    <p className="font-semibold">{order.order_number}</p>
                    <p className="mt-1 text-xs text-textMuted">{order.table_label}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p>{order.customer_name}</p>
                    <p className="mt-1 text-xs text-textMuted">{order.customer_phone || 'No phone'}</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      {(order.orderItems || []).map((item) => (
                        <p key={item.id} className="text-xs text-textMuted">
                          {item.quantity} x {item.menuItem?.name || `Item ${item.menuItemId}`}
                        </p>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 font-semibold">{formatCurrency(order.total_amount)}</td>
                  <td className="px-4 py-4">
                    <div className="space-y-2">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(
                          order.payment_status === 'Pending' ? 'PendingPayment' : order.payment_status
                        )}`}
                      >
                        {order.payment_status}
                      </span>
                      <p className="text-xs text-textMuted">{order.payment_method}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs text-textMuted">
                    {formatDateTime(order.created_at)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex min-w-48 flex-col gap-2">
                      {NEXT_STATUS[order.status] ? (
                        <button
                          type="button"
                          onClick={() => handleAdvanceStatus(order)}
                          disabled={actionId === order.id}
                          className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-black transition hover:bg-primaryDark disabled:opacity-60"
                        >
                          {actionId === order.id ? 'Updating...' : `Move to ${NEXT_STATUS[order.status]}`}
                        </button>
                      ) : null}

                      {order.payment_method === 'Cash' && order.payment_status !== 'Paid' ? (
                        <button
                          type="button"
                          onClick={() => handleMarkPaid(order)}
                          disabled={actionId === order.id}
                          className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-textMain transition hover:bg-white/5 disabled:opacity-60"
                        >
                          Mark cash paid
                        </button>
                      ) : null}

                      {['Pending', 'Preparing'].includes(order.status) ? (
                        <button
                          type="button"
                          onClick={() => handleCancel(order)}
                          disabled={actionId === order.id}
                          className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-500/15 disabled:opacity-60"
                        >
                          Cancel order
                        </button>
                      ) : null}
                    </div>
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
