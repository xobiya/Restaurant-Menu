import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { CreditCard, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import api from '../../lib/api';
import { bi, statusLabels } from '../../lib/locale';

export default function PaymentView() {
  const { txRef } = useParams();
  const navigate = useNavigate();
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
      setError(err?.response?.data?.error || 'Failed to load payment transaction');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayment();
    // Keep page in sync in case webhook updates payment externally.
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
      setError(err?.response?.data?.error || 'Payment action failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-textMuted">{bi('Loading payment...', 'ክፍያ በመጫን ላይ...')}</div>;
  }

  if (!payment) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="glass-panel p-6 rounded-2xl text-center space-y-3">
          <p>{error || bi('Transaction not found', 'የግብይት መረጃ አልተገኘም')}</p>
          <Link to="/menu" className="text-primary text-sm font-semibold">
            {bi('Back to menu', 'ወደ ምናሌ ተመለስ')}
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = payment.status === 'Paid';
  const isFailed = payment.status === 'Failed';
  const isPending = payment.status === 'Pending' || payment.status === 'Unpaid';

  return (
    <div className="min-h-screen px-4 pt-8 pb-28">
      <button onClick={() => navigate(-1)} className="inline-flex items-center space-x-2 text-textMuted hover:text-white">
        <ArrowLeft size={16} />
        <span className="text-sm">{bi('Back', 'ተመለስ')}</span>
      </button>

      <div className="max-w-md mx-auto mt-6 glass-panel rounded-3xl p-6 border border-white/10 space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center">
            <CreditCard size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold">{payment.provider} {bi('Checkout', 'መክፈያ')}</h1>
            <p className="text-sm text-textMuted">{bi('Order', 'ትዕዛዝ')} #{payment.order.id.slice(0, 8)}</p>
          </div>
        </div>

        <div className="bg-white/5 rounded-2xl p-4 text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-textMuted">{bi('Table', 'ጠረጴዛ')}</span>
            <span>T-{payment.order.table_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-textMuted">{bi('Amount', 'መጠን')}</span>
            <span>{payment.currency} {Number(payment.amount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-textMuted">{bi('Status', 'ሁኔታ')}</span>
            <span>{statusLabels[payment.status] || payment.status}</span>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {isPending && (
          <div className="space-y-3">
            <button
              disabled={processing}
              onClick={() => simulate('success')}
              className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-60 rounded-xl py-3 font-semibold flex items-center justify-center space-x-2"
            >
              <CheckCircle2 size={18} />
              <span>{processing ? bi('Processing...', 'በሂደት ላይ...') : bi('Simulate Payment Success', 'የተሳካ ክፍያ አሳይ')}</span>
            </button>
            <button
              disabled={processing}
              onClick={() => simulate('failed')}
              className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-60 rounded-xl py-3 font-semibold flex items-center justify-center space-x-2"
            >
              <XCircle size={18} />
              <span>{processing ? bi('Processing...', 'በሂደት ላይ...') : bi('Simulate Payment Failure', 'ያልተሳካ ክፍያ አሳይ')}</span>
            </button>
          </div>
        )}

        {isPaid && (
          <button
            onClick={() => navigate(`/track/${payment.order.id}`)}
            className="w-full bg-primary hover:bg-primary/80 rounded-xl py-3 font-semibold"
          >
            {bi('Track My Order', 'ትዕዛዜን እከታተላለሁ')}
          </button>
        )}

        {isFailed && (
          <button
            onClick={() => navigate('/order')}
            className="w-full bg-primary hover:bg-primary/80 rounded-xl py-3 font-semibold"
          >
            {bi('Return to Order', 'ወደ ትዕዛዝ ተመለስ')}
          </button>
        )}
      </div>
    </div>
  );
}
