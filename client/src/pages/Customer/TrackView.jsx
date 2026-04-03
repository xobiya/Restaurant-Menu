import {
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  SmartphoneCharging,
  WifiOff,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../../lib/api';
import {
  CUSTOMER_EVENTS,
  getOrderHistory,
} from '../../lib/customerState';
import { formatCurrency, formatDateTime } from '../../lib/formatters';
import { useLocale } from '../../lib/locale';
import { SOCKET_URL } from '../../lib/socket';

const STATUS_STEPS = ['Pending', 'Preparing', 'Ready', 'Completed'];

const getErrorMessage = (error, fallback) => error?.response?.data?.error || fallback;

const getStatusClass = (status) =>
  ({
    Pending: 'bg-white/10 text-textMuted border-white/10',
    Preparing: 'bg-amber-500/15 text-amber-200 border-amber-500/20',
    Ready: 'bg-sky-500/15 text-sky-200 border-sky-500/20',
    Completed: 'bg-green-500/15 text-green-200 border-green-500/20',
    Paid: 'bg-green-500/15 text-green-200 border-green-500/20',
    Failed: 'bg-red-500/15 text-red-200 border-red-500/20',
    Unpaid: 'bg-white/10 text-textMuted border-white/10',
    Queued: 'bg-primary/15 text-primary border-primary/20',
    Syncing: 'bg-sky-500/15 text-sky-200 border-sky-500/20',
  }[status] || 'bg-white/10 text-textMuted border-white/10');

export default function TrackView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId: routeOrderId } = useParams();
  const { language, paymentMethodLabel, t, statusLabel } = useLocale();

  const [lookupId, setLookupId] = useState(() => routeOrderId || '');
  const [history, setHistory] = useState(getOrderHistory);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(Boolean(routeOrderId));
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const notice = location.state?.notice;

  const estimatedReadyTimeMinutes = useMemo(() => {
    if (!order) return null;

    if (order.estimatedReadyTimeMinutes !== undefined) {
      return Number(order.estimatedReadyTimeMinutes);
    }

    return (order.orderItems || []).reduce(
      (sum, item) => sum + (Number(item.menuItem?.prep_time) || 0) * Number(item.quantity || 0),
      0
    );
  }, [order]);

  useEffect(() => {
    const handleHistoryChange = () => setHistory(getOrderHistory());
    window.addEventListener(CUSTOMER_EVENTS.history, handleHistoryChange);
    return () => window.removeEventListener(CUSTOMER_EVENTS.history, handleHistoryChange);
  }, []);

  const fetchOrder = async (id, { silent = false } = {}) => {
    if (!id) {
      setLoading(false);
      return;
    }

    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await api.get(`/orders/${encodeURIComponent(id)}`);
      setOrder(response.data);
      setError('');
      setHistory(getOrderHistory());
    } catch (fetchError) {
      setOrder(null);
      setError(getErrorMessage(fetchError, t('failedFetchOrder')));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLookupId(routeOrderId || '');
    if (routeOrderId) {
      fetchOrder(routeOrderId);
    } else {
      setOrder(null);
      setLoading(false);
    }
  }, [routeOrderId]);

  useEffect(() => {
    const socketTargetId = order?.id || routeOrderId;
    if (!socketTargetId) return undefined;

    const socket = io(SOCKET_URL);

    const eventName = `orderStatusUpdate:${socketTargetId}`;
    const handleUpdate = (payload) => {
      setOrder((current) => ({
        ...(current || {}),
        ...payload,
      }));
      setError('');
    };

    socket.on(eventName, handleUpdate);
    return () => {
      socket.off(eventName, handleUpdate);
      socket.disconnect();
    };
  }, [order?.id, routeOrderId]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = lookupId.trim();
    if (!trimmed) return;
    navigate(`/orders/${encodeURIComponent(trimmed)}`);
  };

  const latestPayment = order?.payments?.[0];

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 pb-28 pt-6 sm:px-6 lg:px-8">
      <section className="glass-panel rounded-[2rem] border border-white/10 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              {t('orders')}
            </p>
            <h1 className="mt-3">{t('trackYourOrder')}</h1>
            <p className="mt-3 max-w-2xl text-sm text-textMuted">{t('enterOrderIdHelp')}</p>
          </div>

          <form onSubmit={handleSubmit} className="flex w-full max-w-xl flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-surfaceSoft px-4 py-3">
              <Search size={18} className="text-textMuted" />
              <input
                value={lookupId}
                onChange={(event) => setLookupId(event.target.value)}
                placeholder={t('pasteOrderId')}
                className="w-full bg-transparent text-sm outline-none placeholder:text-textMuted"
              />
            </div>

            <button
              type="submit"
              className="rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-black transition hover:bg-primaryDark"
            >
              {t('trackOrder')}
            </button>
          </form>
        </div>
      </section>

      {notice ? (
        <div className="glass-panel rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-100">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="glass-panel flex items-start gap-3 rounded-2xl border border-red-500/20 p-4 text-sm text-red-300">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <aside className="space-y-4">
          <div className="glass-panel rounded-[2rem] border border-white/5 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-textMuted">
                  {t('liveHistory')}
                </p>
                <h2 className="mt-2">{t('recentOrders')}</h2>
              </div>

              <Link
                to="/menu"
                className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-textMain transition hover:bg-white/5"
              >
                {t('browseAgain')}
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {history.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-surfaceSoft p-4 text-sm text-textMuted">
                  {t('recentOrdersEmpty')}
                </div>
              ) : (
                history.map((entry) => (
                  <article
                    key={entry.localId || entry.orderId}
                    className="rounded-2xl border border-white/10 bg-surfaceSoft p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{entry.orderId || entry.localId}</p>
                        <p className="mt-1 text-xs text-textMuted">
                          {formatDateTime(entry.createdAt, language)}
                        </p>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(
                          entry.syncState === 'queued'
                            ? 'Queued'
                            : entry.syncState === 'syncing'
                              ? 'Syncing'
                              : entry.orderStatus || 'Pending'
                        )}`}
                      >
                        {entry.syncState === 'queued'
                          ? t('queued')
                          : entry.syncState === 'syncing'
                            ? statusLabel('Syncing')
                            : statusLabel(entry.orderStatus || 'Pending')}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-textMuted">
                      #{entry.tableNumber} · {paymentMethodLabel(entry.paymentMethod)} ·{' '}
                      {formatCurrency(entry.total, language)}
                    </p>

                    {entry.syncState === 'queued' ? (
                      <div className="mt-3 flex items-start gap-2 rounded-2xl border border-primary/20 bg-primary/10 p-3 text-xs text-primary">
                        <WifiOff size={14} className="mt-0.5 shrink-0" />
                        <span>{t('queueNotice')}</span>
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {entry.orderId ? (
                        <Link
                          to={`/orders/${encodeURIComponent(entry.orderId)}`}
                          className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-textMain transition hover:bg-white/5"
                        >
                          {t('openTracking')}
                        </Link>
                      ) : null}

                      {entry.txRef && entry.paymentStatus !== 'Paid' ? (
                        <Link
                          to={`/payment/${encodeURIComponent(entry.txRef)}`}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-textMain transition hover:bg-white/5"
                        >
                          <SmartphoneCharging size={14} />
                          <span>{t('openPayment')}</span>
                        </Link>
                      ) : null}
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </aside>

        <section className="space-y-6">
          {loading ? (
            <div className="glass-panel flex items-center justify-center gap-3 rounded-[2rem] p-12 text-textMuted">
              <Loader2 className="animate-spin" />
              <span>{t('fetchOrderStatus')}</span>
            </div>
          ) : order ? (
            <>
              <div className="glass-panel rounded-[2rem] border border-white/5 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-textMuted">
                      {t('orderDetails')}
                    </p>
                    <h2 className="mt-2 font-mono text-lg">{order.order_number || order.id}</h2>
                    <p className="mt-2 text-sm text-textMuted">
                      {formatDateTime(order.created_at, language)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => fetchOrder(order.id, { silent: true })}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-textMuted transition hover:text-textMain"
                  >
                    {refreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                    <span>Refresh</span>
                  </button>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-surfaceSoft p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-textMuted">{t('table')}</p>
                    <p className="mt-2 text-2xl font-bold">{order.table_label || `#${order.table_number}`}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-surfaceSoft p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-textMuted">{t('estimatedTime')}</p>
                    <p className="mt-2 text-2xl font-bold">
                      {estimatedReadyTimeMinutes ?? 0} {t('mins')}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-surfaceSoft p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-textMuted">{t('total')}</p>
                    <p className="mt-2 text-2xl font-bold">
                      {formatCurrency(order.total_amount, language)}
                    </p>
                    <p className="mt-2 text-xs text-textMuted">
                      {paymentMethodLabel(order.payment_method || 'Cash')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-panel rounded-[2rem] border border-white/5 p-6">
                <h2>Kitchen status</h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-4">
                  {STATUS_STEPS.map((step, index) => {
                    const currentIndex = STATUS_STEPS.indexOf(order.status);
                    const isDone = currentIndex >= index;

                    return (
                      <div
                        key={step}
                        className={`rounded-2xl border p-4 transition ${
                          isDone
                            ? 'border-primary/30 bg-primary/10 text-textMain'
                            : 'border-white/10 bg-surfaceSoft text-textMuted'
                        }`}
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.25em]">
                          Step {index + 1}
                        </p>
                        <p className="mt-2 text-sm font-semibold">{statusLabel(step)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="glass-panel rounded-[2rem] border border-white/5 p-6">
                <div className="flex flex-wrap gap-3">
                  <span className={`rounded-full border px-3 py-2 text-sm font-semibold ${getStatusClass(order.status)}`}>
                    {statusLabel(order.status)}
                  </span>
                  <span
                    className={`rounded-full border px-3 py-2 text-sm font-semibold ${getStatusClass(
                      order.payment_status
                    )}`}
                  >
                    {statusLabel(order.payment_status === 'Pending' ? 'PendingPayment' : order.payment_status)}
                  </span>
                </div>

                {latestPayment?.tx_ref ? (
                  <Link
                    to={`/payment/${encodeURIComponent(latestPayment.tx_ref)}`}
                    className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-textMain transition hover:bg-white/5"
                  >
                    <SmartphoneCharging size={16} />
                    <span>{t('openPayment')}</span>
                  </Link>
                ) : null}

                <div className="mt-5 space-y-3">
                  {(order.orderItems || []).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-surfaceSoft p-4"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold">{item.menuItem?.name || `Item #${item.menuItemId}`}</p>
                        <p className="mt-1 text-sm text-textMuted">
                          {item.quantity} x{' '}
                          {formatCurrency(
                            item.menuItem?.price || Number(item.subtotal) / Number(item.quantity),
                            language
                          )}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-primary">
                        {formatCurrency(item.subtotal, language)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="glass-panel rounded-[2rem] p-10 text-center text-textMuted">
              <p>{t('recentOrdersEmpty')}</p>
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
