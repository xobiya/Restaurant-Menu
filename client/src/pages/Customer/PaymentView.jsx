import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import api from '../../lib/api';
import { formatCurrency, formatDateTime } from '../../lib/formatters';
import { useLocale } from '../../lib/locale';

const getErrorMessage = (error, fallback) => error?.response?.data?.error || fallback;

const getStatusClass = (status) =>
  ({
    Pending: 'border-amber-500/20 bg-amber-500/10 text-amber-200',
    Paid: 'border-green-500/20 bg-green-500/10 text-green-200',
    Failed: 'border-red-500/20 bg-red-500/10 text-red-200',
  }[status] || 'border-white/10 bg-white/5 text-textMuted');

export default function PaymentView() {
  const location = useLocation();
  const { txRef } = useParams();
  const { language, paymentMethodLabel, t, statusLabel } = useLocale();

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');
  const notice = location.state?.notice;

  const loadPayment = async () => {
    if (!txRef) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await api.get(`/payments/tx/${encodeURIComponent(txRef)}`);
      setPayment(response.data);
      setError('');
      if (response.data?.order?.id) {
        localStorage.setItem('last_order_id', response.data.order.id);
      }
    } catch (loadError) {
      setPayment(null);
      setError(getErrorMessage(loadError, t('transactionNotFound')));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayment();
  }, [txRef]);

  const handleMockStatusUpdate = async (nextStatus) => {
    if (!txRef) return;

    setActionLoading(nextStatus);

    try {
      await api.post('/payments/mock/complete', {
        tx_ref: txRef,
        status: nextStatus,
      });
      await loadPayment();
    } catch (actionError) {
      setError(getErrorMessage(actionError, 'Failed to update payment status.'));
    } finally {
      setActionLoading('');
    }
  };

  const displayProvider =
    payment?.requested_provider ||
    payment?.raw_payload?.requestedProvider ||
    payment?.raw_payload?.requested_provider ||
    payment?.raw_payload?.customer?.requestedProvider ||
    payment?.raw_payload?.customer?.requested_provider ||
    payment?.provider;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-4 lg:gap-6 px-4 pb-28 pt-4 sm:px-6 lg:pt-6 lg:px-8">
      <Link
        to={payment?.order?.id ? `/track/${encodeURIComponent(payment.order.id)}` : '/order'}
        className="inline-flex w-fit items-center gap-2 rounded-xl lg:rounded-2xl border border-white/10 px-3 py-2 lg:px-4 lg:py-3 text-xs lg:text-sm font-semibold text-textMuted transition hover:text-textMain"
      >
        <ArrowLeft size={16} />
        <span>{t('back')}</span>
      </Link>

      <section className="glass-panel rounded-2xl lg:rounded-[2rem] border border-white/10 p-5 lg:p-6 text-center sm:text-left">
        <p className="text-[10px] lg:text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          {t('checkout')}
        </p>
        <h1 className="mt-2 lg:mt-3 text-xl lg:text-2xl font-bold">Complete the payment and return to live tracking.</h1>
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

      {loading ? (
        <div className="glass-panel flex flex-col sm:flex-row items-center justify-center gap-3 rounded-2xl lg:rounded-[2rem] p-10 lg:p-12 text-sm lg:text-base text-textMuted">
          <Loader2 className="animate-spin h-6 w-6 lg:h-8 lg:w-8" />
          <span>{t('loadingPayment')}</span>
        </div>
      ) : payment ? (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
          <section className="glass-panel rounded-2xl lg:rounded-[2rem] border border-white/5 p-5 lg:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] lg:text-xs uppercase tracking-[0.25em] text-textMuted">Transaction</p>
                <h2 className="mt-1 lg:mt-2 font-mono text-sm lg:text-lg truncate max-w-full">{payment.tx_ref}</h2>
              </div>

              <span className={`rounded-full border px-3 py-1.5 lg:py-2 text-xs lg:text-sm font-semibold shrink-0 ${getStatusClass(payment.status)}`}>
                {statusLabel(payment.status === 'Pending' ? 'PendingPayment' : payment.status)}
              </span>
            </div>

            <div className="mt-5 lg:mt-6 grid gap-3 lg:gap-4 sm:grid-cols-2">
              <div className="rounded-xl lg:rounded-2xl border border-white/10 bg-surfaceSoft p-3 lg:p-4">
                <p className="text-[10px] lg:text-xs uppercase tracking-[0.25em] text-textMuted">{t('amount')}</p>
                <p className="mt-1 lg:mt-2 text-xl lg:text-2xl font-bold">
                  {formatCurrency(payment.amount, language)}
                </p>
              </div>
              <div className="rounded-xl lg:rounded-2xl border border-white/10 bg-surfaceSoft p-3 lg:p-4">
                <p className="text-[10px] lg:text-xs uppercase tracking-[0.25em] text-textMuted">Provider</p>
                <p className="mt-1 lg:mt-2 text-xl lg:text-2xl font-bold truncate">{paymentMethodLabel(displayProvider)}</p>
              </div>
            </div>

            <div className="mt-5 lg:mt-6 space-y-2 lg:space-y-3 rounded-xl lg:rounded-2xl border border-white/10 bg-surfaceSoft p-3 lg:p-4 text-xs lg:text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-textMuted">{t('status')}</span>
                <span className="font-semibold">
                  {statusLabel(payment.status === 'Pending' ? 'PendingPayment' : payment.status)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-textMuted">Created</span>
                <span className="font-semibold">{formatDateTime(payment.created_at, language)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-textMuted">Order</span>
                <span className="font-mono text-xs">{payment.order?.id || 'N/A'}</span>
              </div>
            </div>
          </section>

          <aside className="space-y-4 lg:space-y-6">
            <section className="glass-panel rounded-2xl lg:rounded-[2rem] border border-white/5 p-5 lg:p-6">
              <p className="text-[10px] lg:text-xs font-semibold uppercase tracking-[0.25em] text-textMuted">
                Order summary
              </p>
              <div className="mt-3 lg:mt-4 space-y-2 lg:space-y-3 text-xs lg:text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-textMuted">{t('table')}</span>
                  <span className="font-semibold">
                    {payment.order?.table_label || `#${payment.order?.table_number || 'N/A'}`}
                  </span>
              </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-textMuted">{t('paymentMethod')}</span>
                  <span className="font-semibold">{paymentMethodLabel(displayProvider)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-textMuted">Kitchen status</span>
                  <span className="font-semibold">
                    {statusLabel(payment.order?.status || 'Pending')}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-textMuted">Order payment</span>
                  <span className="font-semibold">
                    {statusLabel(
                      payment.order?.payment_status === 'Pending'
                        ? 'PendingPayment'
                        : payment.order?.payment_status || 'Unpaid'
                    )}
                  </span>
                </div>
              </div>
            </section>

            {payment.status === 'Pending' ? (
              <section className="glass-panel rounded-2xl lg:rounded-[2rem] border border-white/5 p-5 lg:p-6">
                <div className="space-y-3">
                  {payment.checkout_url && typeof payment.checkout_url === 'string' && !payment.checkout_url.startsWith(window.location.origin) ? (
                    <a
                      href={payment.checkout_url}
                      className="flex w-full items-center justify-center gap-2 rounded-xl lg:rounded-2xl bg-primary px-3 py-3 lg:px-4 lg:py-4 text-xs lg:text-sm font-semibold text-black transition hover:bg-primaryDark"
                    >
                      <CreditCard size={18} className="h-4 w-4 lg:h-4.5 lg:w-4.5" />
                      <span>Proceed to Pay</span>
                    </a>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleMockStatusUpdate('success')}
                        disabled={Boolean(actionLoading)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl lg:rounded-2xl bg-primary px-3 py-3 lg:px-4 lg:py-4 text-xs lg:text-sm font-semibold text-black transition hover:bg-primaryDark disabled:cursor-not-allowed disabled:bg-primary/60"
                      >
                        {actionLoading === 'success' ? (
                          <Loader2 size={18} className="animate-spin h-4 w-4 lg:h-4.5 lg:w-4.5" />
                        ) : (
                          <CheckCircle2 size={18} className="h-4 w-4 lg:h-4.5 lg:w-4.5" />
                        )}
                        <span>{t('completePayment')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMockStatusUpdate('failed')}
                        disabled={Boolean(actionLoading)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl lg:rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-3 lg:px-4 lg:py-4 text-xs lg:text-sm font-semibold text-red-200 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {actionLoading === 'failed' ? (
                          <Loader2 size={18} className="animate-spin h-4 w-4 lg:h-4.5 lg:w-4.5" />
                        ) : (
                          <XCircle size={18} className="h-4 w-4 lg:h-4.5 lg:w-4.5" />
                        )}
                        <span>{t('markFailed')}</span>
                      </button>
                    </>
                  )}
                </div>
              </section>
            ) : null}

            <Link
              to={payment.order?.id ? `/track/${encodeURIComponent(payment.order.id)}` : '/track'}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-4 text-sm font-semibold text-textMain transition hover:bg-white/5"
            >
              <CreditCard size={18} />
              <span>{t('trackMyOrder')}</span>
            </Link>
          </aside>
        </div>
      ) : (
        <div className="glass-panel rounded-[2rem] p-10 text-center text-textMuted">
          {t('transactionNotFound')}
        </div>
      )}
    </div>
  );
}
