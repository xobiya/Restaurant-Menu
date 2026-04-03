import { Clock3, Languages, Leaf, MenuSquare, Shield, SignalHigh, Users } from 'lucide-react';
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
  const { language, setLanguage, t, statusLabel, paymentMethodLabel } = useLocale();
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
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">እንኳን ደህና መጡ</p>
            <h1 className="mt-3">Fast, simple table ordering for your restaurant visit.</h1>
            <p className="mt-3 text-sm text-textMuted sm:text-base">
              Open the menu, add dishes, and send your order to the kitchen in a few taps.
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

          <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[340px]">
            <div className="rounded-[1.5rem] border border-white/10 bg-surfaceSoft p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-textMuted">{t('table')}</p>
              <p className="mt-2 text-2xl font-black">{tableNumber ? `#${tableNumber}` : '...'}</p>
              <p className="mt-2 text-xs text-textMuted">{tableNumber ? t('tableReady') : t('scanTableHint')}</p>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-surfaceSoft p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-textMuted">{t('offlineReady')}</p>
              <p className="mt-2 text-2xl font-black">{queuedCount}</p>
              <p className="mt-2 text-xs text-textMuted">
                {queuedCount ? t('queuedOrdersReady') : t('cachedMenuReady')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-panel rounded-[2rem] border border-white/5 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-textMuted">{t('quickSettings')}</p>
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
                    language === option.value ? 'bg-primary text-black' : 'text-textMuted hover:text-textMain'
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
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-textMuted">{t('recentOrders')}</p>
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
                <article key={entry.localId || entry.orderId} className="rounded-2xl border border-white/10 bg-surfaceSoft p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{entry.orderId || entry.localId}</p>
                      <p className="mt-1 text-xs text-textMuted">{formatDateTime(entry.createdAt, language)}</p>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-textMuted">
                      {entry.syncState === 'queued' ? t('queued') : statusLabel(entry.orderStatus || 'Pending')}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-textMuted">
                    #{entry.tableNumber} · {paymentMethodLabel(entry.paymentMethod)} · {formatCurrency(entry.total, language)}
                  </p>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-white/10 bg-surfaceSoft p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-textMuted">Staff Access</p>
            <p className="mt-1 text-sm text-textMuted">For restaurant team use only.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/staff/login"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-textMuted transition hover:bg-white/5 hover:text-textMain"
            >
              <Users size={14} />
              <span>Staff Login</span>
            </Link>
            <Link
              to="/admin/login"
              className="inline-flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-primary transition hover:bg-primary/20"
            >
              <Shield size={14} />
              <span>Admin Login</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
