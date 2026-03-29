import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { CreditCard, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import api from '../../lib/api';
import { useLocale } from '../../lib/locale';
import LanguageSwitch from '../../components/common/LanguageSwitch';

export default function PaymentView() {
  const { txRef } = useParams();
  const navigate = useNavigate();
  const { t, statusLabel } = useLocale();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const fetchPayment = async () => {
    if (!txRef) return;
    try {
      const response = await api.get(`/payments/tx/${encodeURIComponent(txRef)}`);
      setPayment(response.data);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.error || t('transactionNotFound'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayment();
    const interval = setInterval(fetchPayment, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txRef]);

  const simulate = async (status) => {
    if (!payment) return;
    setProcessing(true);
    setError('');
    try {
      await api.post('/payments/mock/complete', {
        tx_ref: payment.tx_ref,
        status,
        gateway_reference: `mock_${Date.now()}`,
      });
      await fetchPayment();
      if (status.toLowerCase() === 'success') {
        navigate(`/track/${payment.order.id}`);
      }
    } catch (err) {
      setError(err?.response?.data?.error || t('checkoutFailed'));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen px-4 pt-8">
        <div className="glass-panel rounded-2xl p-8 text-center text-textMuted">{t('loadingPayment')}</div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-panel p-6 rounded-2xl text-center space-y-3 max-w-md">
          <p>{error || t('transactionNotFound')}</p>
          <Link to="/menu" className="text-primary text-sm font-semibold">
            {t('backToMenu')}
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = payment.status === 'Paid';
  const isFailed = payment.status === 'Failed';
  const isPending = payment.status === 'Pending' || payment.status === 'Unpaid';

  return (
    <div className="min-h-screen px-4 pt-6 pb-24">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-textMuted hover:text-textMain">
          <ArrowLeft size={16} />
          <span className="text-sm">{t('back')}</span>
        </button>
        <LanguageSwitch />
      </div>

      <div className="max-w-md mx-auto glass-panel rounded-2xl p-5 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
            <CreditCard size={20} />
          </div>
          <div>
            <h1 className="text-2xl">{payment.provider} {t('checkout')}</h1>
            <p className="text-sm text-textMuted">
              {t('order')} #{payment.order.id.slice(0, 8)}
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-surfaceSoft p-4 text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-textMuted">{t('table')}</span>
            <span>T-{payment.order.table_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-textMuted">{t('amount')}</span>
            <span>{payment.currency} {Number(payment.amount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-textMuted">{t('status')}</span>
            <span>{statusLabel(payment.status) || payment.status}</span>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {isPending && (
          <div className="space-y-2">
            <button
              disabled={processing}
              onClick={() => simulate('success')}
              className="w-full h-11 bg-green-600 hover:bg-green-500 disabled:opacity-60 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={18} />
              <span>{processing ? t('processing') : t('completePayment')}</span>
            </button>
            <button
              disabled={processing}
              onClick={() => simulate('failed')}
              className="w-full h-11 bg-red-600 hover:bg-red-500 disabled:opacity-60 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              <XCircle size={18} />
              <span>{t('markFailed')}</span>
            </button>
          </div>
        )}

        {isPaid && (
          <button
            onClick={() => navigate(`/track/${payment.order.id}`)}
            className="w-full h-11 bg-primary hover:bg-primaryDark rounded-xl text-black font-bold"
          >
            {t('trackMyOrder')}
          </button>
        )}

        {isFailed && (
          <button
            onClick={() => navigate('/order')}
            className="w-full h-11 bg-primary hover:bg-primaryDark rounded-xl text-black font-bold"
          >
            {t('returnToOrder')}
          </button>
        )}
      </div>
    </div>
  );
}
