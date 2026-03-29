import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { Minus, Plus, Trash2, ArrowRight, WalletCards, MapPin } from 'lucide-react';
import { useState } from 'react';
import api from '../../lib/api';
import FastImage from '../../components/common/FastImage';
import LanguageSwitch from '../../components/common/LanguageSwitch';
import { useLocale } from '../../lib/locale';
import { getTableNumber, setTableNumber } from '../../lib/table';

export default function CartView() {
  const { cartItems, removeItem, updateQuantity, getCartTotal, getTotalItems, clearCart } = useCartStore();
  const navigate = useNavigate();
  const { t } = useLocale();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState('Chapa');
  const [error, setError] = useState('');
  const [tableNumber, setTableNumberState] = useState(getTableNumber());
  const [tableInput, setTableInput] = useState(getTableNumber() ? String(getTableNumber()) : '');

  const total = getCartTotal();

  const saveTable = () => {
    if (!setTableNumber(tableInput)) {
      setError(t('tableRequired'));
      return;
    }
    setError('');
    const current = getTableNumber();
    setTableNumberState(current);
  };

  const handleCheckout = async () => {
    const activeTable = getTableNumber();
    if (!activeTable) {
      setError(t('tableRequired'));
      return;
    }
    if (cartItems.length === 0) return;
    setIsProcessing(true);
    setError('');

    try {
      const orderResponse = await api.post('/orders', {
        table_number: activeTable,
        items: cartItems.map((item) => ({ menuItemId: item.id, quantity: item.quantity })),
      });

      const orderId = orderResponse.data.id;
      localStorage.setItem('last_order_id', orderId);

      const paymentResponse = await api.post('/payments/initiate', {
        orderId,
        provider: paymentProvider,
        customerInfo: { name: 'Guest Customer', email: 'guest@example.com' },
      });

      clearCart();

      if (paymentResponse.data.checkoutUrl) {
        window.location.href = paymentResponse.data.checkoutUrl;
      } else if (paymentResponse.data.tx_ref) {
        navigate(`/payment/${paymentResponse.data.tx_ref}`);
      } else {
        navigate(`/track/${orderId}`);
      }
    } catch (checkoutError) {
      console.error('Checkout failed:', checkoutError);
      setIsProcessing(false);
      setError(checkoutError?.response?.data?.error || t('checkoutFailed'));
    }
  };

  return (
    <div className="px-4 pt-6 pb-36">
      <div className="glass-panel rounded-2xl p-4 mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1>{t('yourOrder')}</h1>
            <p className="text-sm text-textMuted mt-1">
              {getTotalItems()} {t('items')}
            </p>
          </div>
          <LanguageSwitch />
        </div>

        <div className="mt-3 flex gap-2 items-center">
          <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-surfaceSoft px-3 py-2 text-sm text-textMuted">
            <MapPin size={14} className="text-primary" />
            <span>
              {t('table')}: <span className="font-semibold text-textMain">{tableNumber || '-'}</span>
            </span>
          </div>
          <input
            type="number"
            min="1"
            value={tableInput}
            onChange={(e) => setTableInput(e.target.value)}
            placeholder={t('table')}
            className="premium-input h-10 py-2"
          />
          <button
            onClick={saveTable}
            className="h-10 px-3 rounded-xl bg-primary text-black text-sm font-semibold hover:bg-primaryDark"
          >
            {t('editTable')}
          </button>
        </div>
      </div>

      {cartItems.length === 0 ? (
        <div className="glass-panel rounded-2xl p-10 text-center text-textMuted">
          <Trash2 size={30} className="mx-auto mb-3 opacity-70" />
          <p>{t('orderEmpty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cartItems.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-2xl p-3 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                  {item.image_url ? (
                    <FastImage src={item.image_url} alt={item.name} width={240} sizes="64px" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-surfaceSoft" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{item.name}</h3>
                  <p className="text-sm text-primary font-bold">ETB {item.price}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-300 p-1">
                  <Trash2 size={16} />
                </button>
                <div className="flex items-center rounded-full border border-white/15 bg-surfaceSoft p-1">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 text-primary"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {cartItems.length > 0 && (
        <div className="fixed bottom-[84px] left-4 right-4 glass-panel rounded-2xl p-4 z-40">
          <div className="flex items-center justify-between mb-3">
            <span className="text-textMuted font-medium">{t('subtotal')}</span>
            <span className="text-xl font-extrabold text-primary">ETB {total.toFixed(2)}</span>
          </div>

          <div className="text-xs text-textMuted mb-3">
            {t('table')}: <span className="text-textMain font-semibold">{tableNumber || '-'}</span>
          </div>

          <div className="mb-3">
            <p className="text-xs uppercase tracking-wide text-textMuted mb-2">{t('paymentMethod')}</p>
            <div className="grid grid-cols-2 gap-2">
              {['Chapa', 'Telebirr'].map((provider) => (
                <button
                  key={provider}
                  onClick={() => setPaymentProvider(provider)}
                  className={`h-10 rounded-xl text-sm font-semibold border flex items-center justify-center gap-2 ${
                    paymentProvider === provider
                      ? 'bg-primary border-primary text-black'
                      : 'bg-surfaceSoft border-white/10 text-textMuted'
                  }`}
                >
                  <WalletCards size={14} />
                  <span>{provider}</span>
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm mb-2">{error}</p>}

          <button
            disabled={isProcessing}
            onClick={handleCheckout}
            className={`w-full h-12 rounded-xl font-bold flex items-center justify-center gap-2 ${
              isProcessing ? 'bg-primary/60 text-black cursor-not-allowed' : 'bg-primary hover:bg-primaryDark text-black'
            }`}
          >
            <span>{isProcessing ? t('processingPayment') : t('placeOrderPay')}</span>
            {!isProcessing && <ArrowRight size={18} />}
          </button>
        </div>
      )}
    </div>
  );
}
