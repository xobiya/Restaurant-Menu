import {
  AlertCircle,
  ArrowLeft,
  CreditCard,
  Loader2,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SmartImage from '../../components/common/SmartImage';
import {
  getCustomerPreferences,
  getCustomerProfile,
} from '../../lib/customerState';
import { formatCurrency } from '../../lib/formatters';
import { useLocale } from '../../lib/locale';
import {
  buildOrderDraft,
  PAYMENT_METHODS,
  placeOrderDraft,
} from '../../lib/orderFlow';
import { getTableNumber, setTableNumber } from '../../lib/table';
import { useCartStore } from '../../store/cartStore';

export default function CartView() {
  const navigate = useNavigate();
  const { language, paymentMethodLabel, t } = useLocale();

  const cartItems = useCartStore((state) => state.cartItems);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);

  const preferences = getCustomerPreferences();
  const profile = getCustomerProfile();

  const [tableInput, setTableInputState] = useState(() => String(getTableNumber() || ''));
  const [savedTable, setSavedTable] = useState(() => getTableNumber());
  const [customerName, setCustomerName] = useState(profile.customerName || '');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0),
    [cartItems]
  );

  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const handleSaveTable = () => {
    if (!setTableNumber(tableInput)) {
      setError(t('tableRequired'));
      return;
    }

    setSavedTable(Number(tableInput));
    setError('');
  };

  const handleCheckout = async () => {
    if (!cartItems.length) return;

    if (!savedTable) {
      setError(t('tableRequired'));
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const draft = buildOrderDraft({
        customerName,
        tableNumber: savedTable,
        items: cartItems,
        paymentMethod,
      });

      const submission = await placeOrderDraft(draft);

      clearCart();

      if (submission.status === 'queued') {
        navigate('/orders', {
          state: {
            notice: t('orderQueuedSuccess'),
          },
        });
        return;
      }

      if (paymentMethod === 'Cash') {
        navigate(`/orders/${encodeURIComponent(submission.result.order.id)}`, {
          state: {
            notice: t('orderPlacedSuccess'),
          },
        });
        return;
      }

      navigate(`/payment/${encodeURIComponent(submission.result.payment.tx_ref)}`, {
        state: {
          notice: t('orderPlacedSuccess'),
        },
      });
    } catch (checkoutError) {
      setError(checkoutError?.response?.data?.error || t('checkoutFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 pb-28 pt-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/menu"
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-textMuted transition hover:text-textMain"
        >
          <ArrowLeft size={16} />
          <span>{t('backToMenu')}</span>
        </Link>

        <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-textMuted">
          {totalItems} {t('items')}
        </span>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="glass-panel rounded-[2rem] border border-white/10 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              {t('yourOrder')}
            </p>
            <h1 className="mt-3">Review the tray, then send it to the kitchen in one tap.</h1>
          </div>

          {cartItems.length === 0 ? (
            <div className="glass-panel rounded-[2rem] p-10 text-center">
              <ShoppingCart className="mx-auto text-textMuted" size={28} />
              <h2 className="mt-4">{t('orderEmpty')}</h2>
              <p className="mt-2 text-sm text-textMuted">
                Add some dishes from the menu to continue.
              </p>
              <Link
                to="/menu"
                className="mt-5 inline-flex rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-black transition hover:bg-primaryDark"
              >
                {t('viewMenu')}
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <article
                  key={item.id}
                  className="glass-panel flex gap-4 rounded-[1.75rem] border border-white/5 p-4"
                >
                  <SmartImage
                    src={item.image_url}
                    alt={item.name}
                    width={preferences.lowDataMode ? 180 : 240}
                    sizes="96px"
                    className="h-24 w-24 rounded-2xl object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg">{item.name}</h2>
                        <p className="mt-1 text-sm text-textMuted">
                          {formatCurrency(item.price, language)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="rounded-xl border border-white/10 p-2 text-textMuted transition hover:border-red-500/30 hover:text-red-300"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-surfaceSoft px-2 py-2">
                        <button
                          type="button"
                          onClick={() =>
                            item.quantity === 1
                              ? removeItem(item.id)
                              : updateQuantity(item.id, item.quantity - 1)
                          }
                          className="rounded-xl p-2 text-textMuted transition hover:text-textMain"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="min-w-8 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="rounded-xl p-2 text-textMuted transition hover:text-textMain"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <p className="text-sm font-semibold text-primary">
                        {formatCurrency(Number(item.price) * item.quantity, language)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <section className="glass-panel rounded-[2rem] border border-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-textMuted">
              Guest details
            </p>
            <div className="mt-4 grid gap-3">
              <input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder={t('customerNamePlaceholder')}
                className="premium-input"
              />
            </div>
          </section>

          <section className="glass-panel rounded-[2rem] border border-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-textMuted">
              {t('table')}
            </p>
            <div className="mt-3 flex gap-3">
              <input
                type="number"
                min="1"
                value={tableInput}
                onChange={(event) => setTableInputState(event.target.value)}
                placeholder="12"
                className="premium-input"
              />
              <button
                type="button"
                onClick={handleSaveTable}
                className="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-black transition hover:bg-primaryDark"
              >
                {savedTable ? t('editTable') : t('saveTable')}
              </button>
            </div>
            <p className="mt-3 text-sm text-textMuted">
              {savedTable ? `Table #${savedTable} is ready.` : t('selectTablePrompt')}
            </p>
          </section>

          <section className="glass-panel rounded-[2rem] border border-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-textMuted">
              {t('paymentMethod')}
            </p>
            <div className="mt-4 grid gap-3">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    paymentMethod === method.id
                      ? 'border-primary bg-primary/10 text-textMain'
                      : 'border-white/10 bg-surfaceSoft text-textMuted hover:text-textMain'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{paymentMethodLabel(method.id)}</span>
                    <CreditCard size={16} />
                  </div>
                  <p className="mt-2 text-xs text-textMuted">
                    {language === 'am' ? method.description_am : method.description_en}
                  </p>
                </button>
              ))}
            </div>

            <p className="mt-4 text-xs text-textMuted">
              {paymentMethod === 'Cash' ? t('cashPaymentHint') : t('paymentQueuedHint')}
            </p>
          </section>

          <section className="glass-panel rounded-[2rem] border border-white/5 p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-textMuted">
                <span>{t('subtotal')}</span>
                <span>{formatCurrency(subtotal, language)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-textMuted">
                <span>{t('items')}</span>
                <span>{totalItems}</span>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-3 text-base font-semibold">
                <span>{t('total')}</span>
                <span className="text-primary">{formatCurrency(subtotal, language)}</span>
              </div>
            </div>

            {error ? (
              <div className="mt-4 flex gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleCheckout}
              disabled={!cartItems.length || submitting}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-4 text-sm font-semibold text-black transition hover:bg-primaryDark disabled:cursor-not-allowed disabled:bg-primary/60"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
              <span>{submitting ? t('processingPayment') : t('placeOrderPay')}</span>
            </button>
          </section>
        </aside>
      </section>
    </div>
  );
}
