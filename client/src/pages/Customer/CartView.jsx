import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { Minus, Plus, Trash2, ArrowRight, WalletCards } from 'lucide-react';
import { useState } from 'react';
import api from '../../lib/api';
import FastImage from '../../components/common/FastImage';
import { bi } from '../../lib/locale';

export default function CartView() {
  const { cartItems, removeItem, updateQuantity, getCartTotal, getTotalItems, clearCart } = useCartStore();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState('Chapa');
  const [error, setError] = useState('');

  const total = getCartTotal();

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setIsProcessing(true);
    setError('');

    try {
      // 1. Create order in DB first
      const orderResponse = await api.post('/orders', {
        table_number: Number(localStorage.getItem('table_number') || 1),
        items: cartItems.map(item => ({ menuItemId: item.id, quantity: item.quantity }))
      });

      const orderId = orderResponse.data.id;
      localStorage.setItem('last_order_id', orderId);

      // 2. Initiate Payment (Chapa/Telebirr)
      const paymentResponse = await api.post('/payments/initiate', {
        orderId,
        provider: paymentProvider,
        customerInfo: { name: 'Guest Customer', email: 'guest@example.com' },
      });

      clearCart();

      // 3. Redirect to checkout page (gateway or mock)
      if (paymentResponse.data.checkoutUrl) {
        window.location.href = paymentResponse.data.checkoutUrl;
      } else if (paymentResponse.data.tx_ref) {
        navigate(`/payment/${paymentResponse.data.tx_ref}`);
      } else {
        navigate(`/track/${orderId}`);
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      setIsProcessing(false);
      setError(error?.response?.data?.error || bi('Checkout failed. Ensure backend is running.', 'ክፍያ አልተሳካም። ባክኤንድ እየሰራ መሆኑን ያረጋግጡ።'));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="pt-6 px-4 flex flex-col min-h-screen"
    >
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">{bi('Your Order', 'ትዕዛዝዎ')}</h1>
        <span className="bg-surface px-3 py-1 rounded-full text-sm font-medium border border-white/10">
          {getTotalItems()} {bi('items', 'እቃዎች')}
        </span>
      </div>

      {cartItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-grow opacity-50 space-y-4">
          <Trash2 size={48} strokeWidth={1} />
          <p className="text-lg">{bi('Your order is empty.', 'ትዕዛዝዎ ባዶ ነው።')}</p>
        </div>
      ) : (
        <div className="space-y-4 flex-grow pb-[120px]">
          {cartItems.map((item) => (
            <motion.div
              layout
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              key={item.id}
              className="glass-panel p-4 rounded-2xl flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                 <div className="w-16 h-16 rounded-xl overflow-hidden shadow-lg flex-shrink-0">
                    {item.image_url ? (
                      <FastImage
                        src={item.image_url}
                        alt={item.name}
                        width={240}
                        sizes="64px"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/20" />
                    )}
                 </div>
                 <div>
                   <h3 className="font-semibold text-white truncate max-w-[120px]">{item.name}</h3>
                   <p className="text-primary font-medium">ETB {item.price}</p>
                 </div>
              </div>

              <div className="flex flex-col items-end justify-between h-full space-y-2">
                 <button 
                   onClick={() => removeItem(item.id)} 
                   className="text-red-400 hover:text-red-300 p-1"
                 >
                   <Trash2 size={18} />
                 </button>
                 <div className="flex items-center bg-background rounded-full border border-white/10 p-1">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-full active:bg-white/10"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-full active:bg-white/10 text-primary"
                    >
                      <Plus size={14} />
                    </button>
                 </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Checkout Overlay Area */}
      {cartItems.length > 0 && (
         <motion.div 
           initial={{ y: 50, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           className="fixed bottom-[90px] left-4 right-4 glass-panel p-5 rounded-[2rem] shadow-2xl z-40"
         >
            <div className="flex justify-between items-center mb-4">
               <span className="text-textMuted font-medium text-lg">{bi('Subtotal', 'ጠቅላላ')}</span>
               <span className="text-2xl font-bold text-white">ETB {total}</span>
            </div>

            <div className="mb-4">
              <p className="text-xs uppercase tracking-wider text-textMuted mb-2">
                {bi('Payment Method', 'የክፍያ ዘዴ')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {['Chapa', 'Telebirr'].map((provider) => (
                  <button
                    key={provider}
                    type="button"
                    onClick={() => setPaymentProvider(provider)}
                    className={`rounded-xl py-2 px-3 text-sm font-semibold border transition-colors ${
                      paymentProvider === provider
                        ? 'bg-primary border-primary text-white'
                        : 'bg-surface border-white/10 text-textMuted hover:text-white'
                    }`}
                  >
                    <span className="inline-flex items-center space-x-2">
                      <WalletCards size={14} />
                      <span>{provider}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            
            <button
               disabled={isProcessing}
               onClick={handleCheckout}
               className={`w-full py-4 rounded-xl flex items-center justify-center space-x-2 text-lg font-semibold transition-all ${
                 isProcessing 
                 ? 'bg-primary/50 cursor-not-allowed opacity-80' 
                 : 'bg-primary text-white hover:bg-blue-600 active:scale-95 shadow-lg shadow-primary/30'
               }`}
            >
               <span>{isProcessing ? bi('Processing payment...', 'ክፍያ በሂደት ላይ...') : bi('Place Order & Pay', 'ትዕዛዝ አስገባ እና ክፈል')}</span>
               {!isProcessing && <ArrowRight size={20} />}
            </button>
         </motion.div>
      )}
    </motion.div>
  );
}
