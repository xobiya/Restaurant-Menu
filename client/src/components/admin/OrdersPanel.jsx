import { Loader2, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../../lib/api';
import { formatCurrency, formatDateTime } from '../../lib/formatters';
import { SOCKET_URL } from '../../lib/socket';

const NEXT_STATUS = {
  Pending: 'Preparing',
  Preparing: 'Ready',
  Ready: 'Completed',
};

const getErrorMessage = (error, fallback) => error?.response?.data?.error || fallback;

const mergeOrder = (orders, incoming) => {
  const exists = orders.some((order) => order.id === incoming.id);
  const nextOrders = exists
    ? orders.map((order) => (order.id === incoming.id ? { ...order, ...incoming } : order))
    : [incoming, ...orders];

  return nextOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};

const statusTone = (status) =>
  ({
    Pending: 'border-white/10 bg-white/5 text-textMuted',
    Preparing: 'border-amber-500/20 bg-amber-500/10 text-amber-200',
    Ready: 'border-sky-500/20 bg-sky-500/10 text-sky-200',
    Completed: 'border-green-500/20 bg-green-500/10 text-green-200',
    Paid: 'border-green-500/20 bg-green-500/10 text-green-200',
    Failed: 'border-red-500/20 bg-red-500/10 text-red-200',
    Unpaid: 'border-white/10 bg-white/5 text-textMuted',
  }[status] || 'border-white/10 bg-white/5 text-textMuted');

export default function OrdersPanel() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState('');
  const [error, setError] = useState('');

  const loadOrders = async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await api.get('/orders');
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

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    const handleNewOrder = (order) => {
      setOrders((current) => mergeOrder(current, order));
    };

    const handleUpdatedOrder = (order) => {
      setOrders((current) => mergeOrder(current, order));
    };

    socket.on('newOrder', handleNewOrder);
    socket.on('orderUpdated', handleUpdatedOrder);

    return () => {
      socket.off('newOrder', handleNewOrder);
      socket.off('orderUpdated', handleUpdatedOrder);
      socket.disconnect();
    };
  }, []);

  const handleAdvanceStatus = async (order) => {
    const nextStatus = NEXT_STATUS[order.status];
    if (!nextStatus) return;

    setUpdatingId(order.id);

    try {
      const response = await api.patch(`/orders/${order.id}/status`, {
        status: nextStatus,
      });
      setOrders((current) => mergeOrder(current, response.data));
      setError('');
    } catch (updateError) {
      setError(getErrorMessage(updateError, 'Failed to update the order status.'));
    } finally {
      setUpdatingId('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-[2rem] border border-white/5 bg-surface p-12 text-textMuted">
        <Loader2 className="animate-spin" />
        <span>Loading live orders...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2>Live order feed</h2>
          <p className="mt-1 text-sm text-textMuted">
            Watch orders arrive in real time and push them through each kitchen stage.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadOrders({ silent: true })}
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

      {orders.length === 0 ? (
        <div className="rounded-[2rem] border border-white/5 bg-surface p-8 text-center text-textMuted">
          No orders yet.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {orders.map((order) => {
            const nextStatus = NEXT_STATUS[order.status];
            const latestPayment = order.payments?.[0];

            return (
              <article
                key={order.id}
                className="rounded-[2rem] border border-white/5 bg-surface p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-textMuted">
                      Table #{order.table_number}
                    </p>
                    <h3 className="mt-2 font-mono text-base">{order.id}</h3>
                    <p className="mt-2 text-sm text-textMuted">
                      {formatDateTime(order.created_at)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full border px-3 py-2 text-xs font-semibold ${statusTone(order.status)}`}>
                      {order.status}
                    </span>
                    <span
                      className={`rounded-full border px-3 py-2 text-xs font-semibold ${statusTone(
                        order.payment_status
                      )}`}
                    >
                      {order.payment_status}
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-surfaceSoft p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-textMuted">Total</p>
                    <p className="mt-2 text-lg font-bold">{formatCurrency(order.total_amount)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-surfaceSoft p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-textMuted">ETA</p>
                    <p className="mt-2 text-lg font-bold">
                      {order.estimatedReadyTimeMinutes || 0} min
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-surfaceSoft p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-textMuted">Payment</p>
                    <p className="mt-2 text-lg font-bold">
                      {latestPayment?.provider || 'Not started'}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {(order.orderItems || []).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-surfaceSoft p-4"
                    >
                      <div>
                        <p className="font-semibold">{item.menuItem?.name || `Item #${item.menuItemId}`}</p>
                        <p className="mt-1 text-sm text-textMuted">
                          Qty {item.quantity} · {item.menuItem?.prep_time || 0} min each
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-primary">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>

                {nextStatus ? (
                  <button
                    type="button"
                    onClick={() => handleAdvanceStatus(order)}
                    disabled={updatingId === order.id}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-4 text-sm font-semibold text-black transition hover:bg-primaryDark disabled:cursor-not-allowed disabled:bg-primary/60"
                  >
                    {updatingId === order.id ? <Loader2 size={16} className="animate-spin" /> : null}
                    <span>Move to {nextStatus}</span>
                  </button>
                ) : (
                  <div className="mt-5 rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-sm font-semibold text-green-200">
                    This order has completed the kitchen flow.
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
