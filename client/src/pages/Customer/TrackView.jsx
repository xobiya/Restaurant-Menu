import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, Package, ChefHat, ArrowLeft } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../../lib/api';
import { useLocale } from '../../lib/locale';
import LanguageSwitch from '../../components/common/LanguageSwitch';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const StatusStep = ({ icon: Icon, label, active, completed }) => (
  <div className={`flex flex-col items-center gap-2 flex-1 ${active || completed ? 'text-textMain' : 'text-textMuted opacity-50'}`}>
    <div
      className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
        completed ? 'bg-primary text-black border-primary' : active ? 'bg-surfaceSoft border-primary text-primary' : 'bg-surface border-white/10'
      }`}
    >
      <Icon size={18} />
    </div>
    <span className="text-[10px] font-semibold text-center">{label}</span>
  </div>
);

export default function TrackView() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { t, statusLabel } = useLocale();
  const [lookupId, setLookupId] = useState(orderId || localStorage.getItem('last_order_id') || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (orderId) {
      setLookupId(orderId);
    }
  }, [orderId]);

  useEffect(() => {
    if (!lookupId) {
      setLoading(false);
      setOrder(null);
      return undefined;
    }

    const fetchOrder = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/orders/${lookupId}`);
        setOrder(response.data);
        setError('');
        localStorage.setItem('last_order_id', response.data.id);
      } catch (fetchError) {
        console.error('Failed to fetch order:', fetchError);
        setOrder(null);
        setError(fetchError?.response?.data?.error || t('failedFetchOrder'));
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    const socket = io(SOCKET_URL);
    socket.on(`orderStatusUpdate:${lookupId}`, (updatedOrder) => {
      setOrder(updatedOrder);
    });
    return () => socket.disconnect();
  }, [lookupId, t]);

  const onSubmit = (event) => {
    event.preventDefault();
    if (!lookupId.trim()) return;
    navigate(`/track/${lookupId.trim()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen px-4 pt-8">
        <div className="glass-panel rounded-2xl p-8 text-center text-textMuted">{t('fetchOrderStatus')}</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen px-4 pt-8">
        <div className="max-w-md mx-auto glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h1>{t('trackYourOrder')}</h1>
            <LanguageSwitch />
          </div>
          <p className="text-sm text-textMuted">{error || t('enterOrderIdHelp')}</p>
          <form onSubmit={onSubmit} className="space-y-3">
            <input
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              placeholder={t('pasteOrderId')}
              className="premium-input"
            />
            <button type="submit" className="w-full h-11 rounded-xl bg-primary text-black font-bold hover:bg-primaryDark">
              {t('trackOrder')}
            </button>
          </form>
          <Link to="/menu" className="text-sm text-primary font-semibold">
            {t('backToMenu')}
          </Link>
        </div>
      </div>
    );
  }

  const statuses = ['Pending', 'Preparing', 'Ready', 'Completed'];
  const currentIdx = statuses.indexOf(order.status);

  return (
    <div className="min-h-screen px-4 pt-6 pb-24">
      <div className="flex items-center justify-between mb-4">
        <Link to="/menu" className="inline-flex items-center gap-2 text-textMuted hover:text-textMain">
          <ArrowLeft size={16} />
          <span className="text-sm">{t('backToRestaurant')}</span>
        </Link>
        <LanguageSwitch />
      </div>

      <div className="glass-panel rounded-2xl p-5 mb-4">
        <h1 className="text-2xl">#{order.id.substring(0, 8)}</h1>
        <p className="text-sm text-textMuted mt-1">
          {t('table')} {order.table_number}
        </p>
      </div>

      <div className="glass-panel rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-textMuted font-semibold">{t('estimatedTime')}</p>
          <div className="text-primary font-bold flex items-center gap-1">
            <Clock size={16} />
            <span>{order.estimatedReadyTimeMinutes || 20} {t('mins')}</span>
          </div>
        </div>
        <div className="flex items-start justify-between gap-2">
          <StatusStep icon={Package} label={statusLabel('Pending')} completed={currentIdx > 0} active={currentIdx === 0} />
          <StatusStep icon={ChefHat} label={statusLabel('Preparing')} completed={currentIdx > 1} active={currentIdx === 1} />
          <StatusStep icon={CheckCircle2} label={statusLabel('Ready')} completed={currentIdx > 2} active={currentIdx === 2} />
          <StatusStep icon={CheckCircle2} label={statusLabel('Completed')} completed={currentIdx === 3} active={false} />
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-5">
        <p className="text-sm font-semibold text-textMuted mb-3">{t('orderDetails')}</p>
        <div className="space-y-2">
          {order.orderItems?.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span className="text-textMain">
                {item.quantity}x {item.menuItem?.name}
              </span>
              <span className="text-textMuted">ETB {item.subtotal}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
          <span className="font-semibold">{t('total')}</span>
          <span className="text-xl font-extrabold text-primary">ETB {Number(order.total_amount).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
