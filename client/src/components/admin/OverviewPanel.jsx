import { LayoutDashboard, Loader2, ReceiptText, Soup, TrendingUp, WalletCards } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { formatCurrency, formatDateTime } from '../../lib/formatters';

const getErrorMessage = (error, fallback) => error?.response?.data?.error || fallback;

const statCards = [
  { key: 'todayOrders', label: "Today's orders", icon: ReceiptText },
  { key: 'activeOrders', label: 'Active kitchen queue', icon: Soup },
  { key: 'revenue_etb', label: "Today's revenue", icon: WalletCards, currency: true },
  { key: 'averageTicket_etb', label: 'Average ticket', icon: TrendingUp, currency: true },
];

export default function OverviewPanel() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    const loadSummary = async () => {
      try {
        const response = await api.get('/orders/summary');
        if (!ignore) {
          setSummary(response.data);
          setError('');
        }
      } catch (loadError) {
        if (!ignore) {
          setError(getErrorMessage(loadError, 'Failed to load dashboard summary.'));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadSummary();
    return () => {
      ignore = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-[2rem] border border-white/5 bg-surface p-12 text-textMuted">
        <Loader2 className="animate-spin" />
        <span>Loading dashboard summary...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          const rawValue = summary?.totals?.[card.key] ?? 0;

          return (
            <article
              key={card.key}
              className="rounded-[1.75rem] border border-white/5 bg-surface p-5 shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon size={20} />
              </div>
              <p className="mt-4 text-sm text-textMuted">{card.label}</p>
              <p className="mt-2 text-3xl font-black">
                {card.currency ? formatCurrency(rawValue) : rawValue}
              </p>
            </article>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] border border-white/5 bg-surface p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-textMuted">
                Latest orders
              </p>
              <h2 className="mt-2">Recent service activity</h2>
            </div>
            <Link
              to="/admin/orders"
              className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-textMain transition hover:bg-white/5"
            >
              Open orders
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {(summary?.latestOrders || []).length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-surfaceSoft p-4 text-sm text-textMuted">
                No orders yet today.
              </div>
            ) : (
              summary.latestOrders.map((order) => (
                <article
                  key={order.id}
                  className="rounded-2xl border border-white/10 bg-surfaceSoft p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{order.order_number}</p>
                      <p className="mt-1 text-xs text-textMuted">{formatDateTime(order.created_at)}</p>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-textMuted">
                      {order.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-textMuted">
                    {order.customer_name} · {order.table_label} · {formatCurrency(order.total_amount)}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/5 bg-surface p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <LayoutDashboard size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-textMuted">
                Popular items
              </p>
              <h2 className="mt-2">What guests are ordering</h2>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {(summary?.popularItems || []).length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-surfaceSoft p-4 text-sm text-textMuted">
                Popular dishes will show up after orders start coming in.
              </div>
            ) : (
              summary.popularItems.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-surfaceSoft p-4"
                >
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.25em] text-textMuted">
                      #{index + 1}
                    </p>
                    <p className="mt-2 truncate font-semibold">{item.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">{item.quantity} sold</p>
                    <p className="mt-1 text-xs text-textMuted">{formatCurrency(item.revenue)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
