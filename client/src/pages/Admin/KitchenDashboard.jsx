import { ChefHat, Loader2, LogOut, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { formatCurrency, formatDateTime } from '../../lib/formatters';
import { SOCKET_URL } from '../../lib/socket';
import { clearStaffSession, getStoredStaffUser } from '../../lib/staffSession';

const NEXT_STATUS = {
  Pending: 'Preparing',
  Preparing: 'Ready',
  Ready: 'Completed',
};

const columns = [
  { key: 'Pending', label: 'New orders' },
  { key: 'Preparing', label: 'Preparing' },
  { key: 'Ready', label: 'Ready to serve' },
];

const getErrorMessage = (error, fallback) => error?.response?.data?.error || fallback;

export default function KitchenDashboard() {
  const navigate = useNavigate();
  const user = getStoredStaffUser();

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
      setError(getErrorMessage(loadError, 'Failed to load the kitchen board.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();

    const socket = io(SOCKET_URL);

    const mergeOrder = (incoming) => {
      setOrders((current) => {
        const exists = current.some((order) => order.id === incoming.id);
        const next = exists
          ? current.map((order) => (order.id === incoming.id ? { ...order, ...incoming } : order))
          : [incoming, ...current];
        return next.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      });
    };

    socket.on('orderPlaced', mergeOrder);
    socket.on('statusUpdated', mergeOrder);
    socket.on('orderUpdated', mergeOrder);

    return () => {
      socket.disconnect();
    };
  }, []);

  const groupedOrders = useMemo(() => {
    const base = {
      Pending: [],
      Preparing: [],
      Ready: [],
    };

    orders.forEach((order) => {
      if (base[order.status]) {
        base[order.status].push(order);
      }
    });

    return base;
  }, [orders]);

  const handleAdvance = async (order) => {
    const nextStatus = NEXT_STATUS[order.status];
    if (!nextStatus) return;

    setUpdatingId(order.id);
    try {
      await api.patch(`/orders/${order.id}/status`, {
        status: nextStatus,
      });
    } catch (updateError) {
      setError(getErrorMessage(updateError, 'Failed to update order status.'));
    } finally {
      setUpdatingId('');
    }
  };

  const handleLogout = () => {
    clearStaffSession();
    navigate('/staff/login', { replace: true });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 text-textMuted">
        <Loader2 className="animate-spin" />
        <span>Loading kitchen board...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-white/5 bg-surface p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)] lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
              <ChefHat size={28} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-textMuted">
                Kitchen mode
              </p>
              <h1 className="mt-2 text-3xl">Live preparation board</h1>
              <p className="mt-2 text-sm text-textMuted">
                Signed in as {user?.name || 'Kitchen Staff'}.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => loadOrders({ silent: true })}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-textMain transition hover:bg-white/5"
            >
              {refreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              <span>Refresh</span>
            </button>
            {user?.role === 'ADMIN' ? (
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-textMain transition hover:bg-white/5"
              >
                Open admin
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-textMain transition hover:bg-white/5"
            >
              <LogOut size={16} />
              <span>Sign out</span>
            </button>
          </div>
        </header>

        {error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-3">
          {columns.map((column) => (
            <section
              key={column.key}
              className="rounded-[2rem] border border-white/5 bg-surface p-5 shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-textMuted">
                    {column.label}
                  </p>
                  <h2 className="mt-2">{groupedOrders[column.key].length}</h2>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {groupedOrders[column.key].length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-surfaceSoft p-4 text-sm text-textMuted">
                    No orders in this stage.
                  </div>
                ) : (
                  groupedOrders[column.key].map((order) => (
                    <article
                      key={order.id}
                      className="rounded-[1.5rem] border border-white/10 bg-surfaceSoft p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{order.order_number}</p>
                          <p className="mt-1 text-xs text-textMuted">{formatDateTime(order.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-primary">{order.table_label}</p>
                          <p className="mt-1 text-xs text-textMuted">{order.customer_name}</p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        {(order.orderItems || []).map((item) => (
                          <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                            <span className="text-textMuted">
                              {item.quantity} x {item.menuItem?.name || `Item ${item.menuItemId}`}
                            </span>
                            <span className="font-semibold">{formatCurrency(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-textMuted">
                        <span>{order.payment_method}</span>
                        <span>{order.estimatedReadyTimeMinutes || 0} mins</span>
                      </div>

                      {NEXT_STATUS[order.status] ? (
                        <button
                          type="button"
                          onClick={() => handleAdvance(order)}
                          disabled={updatingId === order.id}
                          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-black transition hover:bg-primaryDark disabled:cursor-not-allowed disabled:bg-primary/60"
                        >
                          {updatingId === order.id ? <Loader2 size={16} className="animate-spin" /> : null}
                          <span>
                            {order.status === 'Ready'
                              ? 'Mark served'
                              : `Move to ${NEXT_STATUS[order.status]}`}
                          </span>
                        </button>
                      ) : null}
                    </article>
                  ))
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
