import {
  Clock3,
  Languages,
  Leaf,
  MenuSquare,
  PackageCheck,
  SignalHigh,
  ShoppingCart,
  WalletCards,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CUSTOMER_EVENTS,
  getCustomerPreferences,
  getOrderHistory,
  getQueuedOrders,
  saveCustomerPreferences,
} from '../../lib/customerState';
import { formatCurrency, formatDateTime } from '../../lib/formatters';
import { useLocale } from '../../lib/locale';
import { getTableNumber } from '../../lib/table';

function PreferenceToggle({ active, label, helper, onClick, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[1.5rem] border p-4 text-left transition ${
        active
          ? 'border-primary/40 bg-primary/10 text-textMain'
          : 'border-white/10 bg-surfaceSoft text-textMuted hover:text-textMain'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5">
          <Icon size={18} />
        </div>
        <div>
          <p className="font-semibold">{label}</p>
          <p className="mt-1 text-xs">{helper}</p>
        </div>
      </div>
    </button>
  );
}

export default function HomeView() {
  const { language, setLanguage, t, statusLabel } = useLocale();
  const [preferences, setPreferences] = useState(getCustomerPreferences);
  const [history, setHistory] = useState(() => getOrderHistory().slice(0, 3));
  const [queuedCount, setQueuedCount] = useState(() => getQueuedOrders().length);
  const tableNumber = getTableNumber();

  useEffect(() => {
    const handlePreferences = () => setPreferences(getCustomerPreferences());
    const handleHistory = () => setHistory(getOrderHistory().slice(0, 3));
    const handleQueue = () => setQueuedCount(getQueuedOrders().length);

    window.addEventListener(CUSTOMER_EVENTS.preferences, handlePreferences);
    window.addEventListener(CUSTOMER_EVENTS.history, handleHistory);
    window.addEventListener(CUSTOMER_EVENTS.queue, handleQueue);

    return () => {
      window.removeEventListener(CUSTOMER_EVENTS.preferences, handlePreferences);
      window.removeEventListener(CUSTOMER_EVENTS.history, handleHistory);
      window.removeEventListener(CUSTOMER_EVENTS.queue, handleQueue);
    };
  }, []);

  const togglePreference = (key) => {
    const next = saveCustomerPreferences({
      [key]: !preferences[key],
    });
    setPreferences(next);
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 pb-28 pt-6 sm:px-6 lg:px-8">
      <section className="glass-panel overflow-hidden rounded-[2rem] border border-white/10 p-6">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">
              እንኳን ደህና መጡ
            </p>
            <h1 className="mt-3">Fast table ordering built for Ethiopian restaurant service.</h1>
            <p className="mt-3 max-w-2xl text-sm text-textMuted sm:text-base">
              Browse the menu in Amharic or English, stay ready for weak connections,
              and place orders with cash-first checkout or local mobile payments.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-black transition hover:bg-primaryDark"
              >
                <MenuSquare size={18} />
                <span>{t('viewMenu')}</span>
              </Link>
              <Link
                to="/orders"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-textMain transition hover:bg-white/5"
              >
                <Clock3 size={18} />
                <span>{t('orders')}</span>
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-[1.75rem] border border-white/10 bg-surfaceSoft p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-textMuted">{t('table')}</p>
              <p className="mt-2 text-3xl font-black">{tableNumber ? `#${tableNumber}` : '...'}</p>
              <p className="mt-2 text-sm text-textMuted">
                {tableNumber ? t('tableReady') : t('scanTableHint')}
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-surfaceSoft p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-textMuted">{t('offlineReady')}</p>
              <p className="mt-2 text-3xl font-black">{queuedCount}</p>
              <p className="mt-2 text-sm text-textMuted">
                {queuedCount
                  ? t('queuedOrdersReady')
                  : t('cachedMenuReady')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="glass-panel rounded-[1.75rem] border border-white/5 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <WalletCards size={20} />
          </div>
          <h2 className="mt-4 text-lg">Cash-first checkout</h2>
          <p className="mt-2 text-sm text-textMuted">
            Cash stays front and center, with Telebirr and other digital handoffs available.
          </p>
        </div>

        <div className="glass-panel rounded-[1.75rem] border border-white/5 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <SignalHigh size={20} />
          </div>
          <h2 className="mt-4 text-lg">Low-bandwidth friendly</h2>
          <p className="mt-2 text-sm text-textMuted">
            Cached menu browsing, lighter image loads, and queued orders when the network drops.
          </p>
        </div>

        <div className="glass-panel rounded-[1.75rem] border border-white/5 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Leaf size={20} />
          </div>
          <h2 className="mt-4 text-lg">Fasting-aware menu</h2>
          <p className="mt-2 text-sm text-textMuted">
            Highlight vegetarian and fasting dishes quickly on Wednesdays, Fridays, or Lent.
          </p>
        </div>

        <div className="glass-panel rounded-[1.75rem] border border-white/5 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <PackageCheck size={20} />
          </div>
          <h2 className="mt-4 text-lg">Order history</h2>
          <p className="mt-2 text-sm text-textMuted">
            Keep recent table orders nearby so it is easy to reopen tracking or payment.
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-panel rounded-[2rem] border border-white/5 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-textMuted">
                {t('quickSettings')}
              </p>
              <h2 className="mt-2">{t('customizeExperience')}</h2>
            </div>

            <div className="inline-flex rounded-2xl border border-white/10 bg-surfaceSoft p-1">
              {[
                { value: 'am', label: 'አማ' },
                { value: 'en', label: 'EN' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setLanguage(option.value)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    language === option.value
                      ? 'bg-primary text-black'
                      : 'text-textMuted hover:text-textMain'
                  }`}
                >
                  <Languages size={14} />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <PreferenceToggle
              active={preferences.lowDataMode}
              label={t('lowDataMode')}
              helper={t('lowDataHelper')}
              onClick={() => togglePreference('lowDataMode')}
              icon={SignalHigh}
            />
            <PreferenceToggle
              active={preferences.fastingOnly}
              label={t('fastingMode')}
              helper={t('fastingModeHelper')}
              onClick={() => togglePreference('fastingOnly')}
              icon={Leaf}
            />
          </div>
        </div>

        <div className="glass-panel rounded-[2rem] border border-white/5 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-textMuted">
                {t('recentOrders')}
              </p>
              <h2 className="mt-2">{t('keepTracking')}</h2>
            </div>
            <Link
              to="/orders"
              className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-textMain transition hover:bg-white/5"
            >
              {t('openOrders')}
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
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {entry.orderId || entry.localId}
                      </p>
                      <p className="mt-1 text-xs text-textMuted">
                        {formatDateTime(entry.createdAt, language)}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-textMuted">
                      {entry.syncState === 'queued' ? t('queued') : statusLabel(entry.orderStatus || 'Pending')}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-textMuted">
                    #{entry.tableNumber} · {entry.paymentMethod} · {formatCurrency(entry.total, language)}
                  </p>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Link
          to="/menu"
          className="glass-panel rounded-[1.75rem] border border-white/5 p-5 transition hover:border-primary/25"
        >
          <MenuSquare size={20} className="text-primary" />
          <h2 className="mt-4 text-lg">{t('browseDishes')}</h2>
          <p className="mt-2 text-sm text-textMuted">
            Explore fasting dishes, tibs, wats, coffee, and shareable injera sides.
          </p>
        </Link>

        <Link
          to="/order"
          className="glass-panel rounded-[1.75rem] border border-white/5 p-5 transition hover:border-primary/25"
        >
          <ShoppingCart size={20} className="text-primary" />
          <h2 className="mt-4 text-lg">{t('goToCart')}</h2>
          <p className="mt-2 text-sm text-textMuted">
            Review your tray, pick a payment method, and send the order in a few taps.
          </p>
        </Link>

        <Link
          to="/orders"
          className="glass-panel rounded-[1.75rem] border border-white/5 p-5 transition hover:border-primary/25"
        >
          <Clock3 size={20} className="text-primary" />
          <h2 className="mt-4 text-lg">{t('trackOrders')}</h2>
          <p className="mt-2 text-sm text-textMuted">
            Follow live kitchen progress and reopen pending mobile payments when needed.
          </p>
        </Link>
      </section>
    </div>
  );
}
