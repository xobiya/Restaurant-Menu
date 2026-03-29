import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, Package, ChefHat, ArrowLeft } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../../lib/api';
import { bi, statusLabels } from '../../lib/locale';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const StatusStep = ({ icon: Icon, label, active, completed }) => (
  <div className={`flex flex-col items-center space-y-3 flex-1 relative ${active || completed ? 'text-white' : 'text-textMuted opacity-40'}`}>
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-700 ${
      completed ? 'bg-green-500 shadow-lg shadow-green-500/20' : 
      active ? 'bg-primary shadow-lg shadow-primary/20 scale-110' : 'bg-surface border border-white/5'
    }`}>
      <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
    </div>
    <span className="text-[10px] font-bold uppercase tracking-widest text-center">{label}</span>
  </div>
);

export default function TrackView() {
  const { orderId } = useParams();
  const navigate = useNavigate();
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
      } catch (error) {
        console.error('Failed to fetch order:', error);
        setOrder(null);
        setError(error?.response?.data?.error || 'Failed to fetch order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    // Socket for real-time updates
    const socket = io(SOCKET_URL);

    // Listen for status updates for this specific order
    socket.on(`orderStatusUpdate:${lookupId}`, (updatedOrder) => {
      console.log('Real-time status update:', updatedOrder.status);
      setOrder(updatedOrder);
    });

    return () => socket.disconnect();
  }, [lookupId]);

  const onSubmit = (event) => {
    event.preventDefault();
    if (!lookupId.trim()) return;
    navigate(`/track/${lookupId.trim()}`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-mono opacity-50">{bi('Fetching order status...', 'የትዕዛዝ ሁኔታ በመጫን ላይ...')}</div>;

  if (!order) {
    return (
      <div className="min-h-screen px-4 pt-10">
        <div className="max-w-md mx-auto glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
          <h1 className="text-2xl font-bold">{bi('Track Your Order', 'ትዕዛዝዎን ይከታተሉ')}</h1>
          <p className="text-sm text-textMuted">
            {error || bi('Enter your order ID to see live status updates.', 'ቀጥታ ሁኔታ ለማየት የትዕዛዝ መለያ ያስገቡ።')}
          </p>
          <form onSubmit={onSubmit} className="space-y-3">
            <input
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              placeholder={bi('Paste order ID', 'የትዕዛዝ መለያ ያስገቡ')}
              className="w-full rounded-xl bg-surface border border-white/10 px-4 py-3 focus:outline-none focus:border-primary"
            />
            <button type="submit" className="w-full rounded-xl bg-primary hover:bg-primary/80 py-3 font-semibold">
              {bi('Track Order', 'ትዕዛዝ ይከታተሉ')}
            </button>
          </form>
          <Link to="/menu" className="inline-flex text-sm text-primary font-semibold">
            {bi('Back to menu', 'ወደ ምናሌ ተመለስ')}
          </Link>
        </div>
      </div>
    );
  }

  const statuses = ['Pending', 'Preparing', 'Ready', 'Completed'];
  const currentIdx = statuses.indexOf(order.status);

  return (
    <div className="min-h-screen pb-20 pt-8 px-6">
      <Link to="/menu" className="inline-flex items-center space-x-2 text-textMuted hover:text-white transition-colors mb-10">
        <ArrowLeft size={16} />
        <span className="text-sm font-medium">{bi('Back to Restaurant', 'ወደ ሬስቶራንቱ ተመለስ')}</span>
      </Link>

      <div className="space-y-12">
        <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">#{order.id.substring(0, 8)}</h1>
            <p className="text-textMuted text-sm">{bi('Table', 'ጠረጴዛ')} {order.table_number}</p>
        </div>

        {/* Status Stepper */}
        <div className="flex justify-between items-start relative px-2">
           {/* Line Background */}
           <div className="absolute top-6 left-12 right-12 h-[2px] bg-white/5 -z-10" />
           {/* Progress Line */}
           <motion.div 
             initial={{ width: 0 }}
             animate={{ width: `${(currentIdx / (statuses.length - 1)) * 100}%` }}
             className="absolute top-6 left-6 h-[2px] bg-primary -z-10 transition-all duration-1000" 
           />

           <StatusStep icon={Package} label={bi('Pending', 'በመጠበቅ')} completed={currentIdx > 0} active={currentIdx === 0} />
           <StatusStep icon={ChefHat} label={bi('Preparing', 'በማብሰል')} completed={currentIdx > 1} active={currentIdx === 1} />
           <StatusStep icon={CheckCircle2} label={bi('Ready', 'ዝግጁ')} completed={currentIdx > 2} active={currentIdx === 2} />
           <StatusStep icon={CheckCircle2} label={bi('Completed', 'ተጠናቋል')} completed={currentIdx === 3} active={false} />
        </div>

        <div className="glass-panel p-8 rounded-3xl border border-white/5 space-y-6">
           <div className="flex justify-between items-center pb-6 border-b border-white/5">
              <span className="text-sm font-bold text-textMuted uppercase tracking-wider">{bi('Estimated Time', 'የተገመተ ጊዜ')}</span>
              <div className="flex items-center space-x-2 text-primary font-bold text-xl">
                 <Clock size={20} />
                 <span>{order.estimatedReadyTimeMinutes || 20} {bi('mins', 'ደቂቃ')}</span>
              </div>
           </div>

           <div className="space-y-4 pt-2">
              <p className="text-xs font-bold text-textMuted uppercase tracking-widest">{bi('Order Details', 'የትዕዛዝ ዝርዝር')}</p>
              <p className="text-xs text-primary font-semibold">{statusLabels[order.status] || order.status}</p>
              {order.orderItems?.map(item => (
                <div key={item.id} className="flex justify-between items-center">
                   <div className="flex items-center space-x-3">
                      <span className="w-5 h-5 flex items-center justify-center bg-white/5 rounded text-[10px] font-bold text-primary">
                        {item.quantity}x
                      </span>
                      <span className="text-sm font-medium opacity-90">{item.menuItem?.name}</span>
                   </div>
                   <span className="text-xs font-mono opacity-50">ETB {item.subtotal}</span>
                </div>
              ))}
              <div className="pt-4 flex justify-between items-center border-t border-white/5">
               <span className="text-sm font-bold">{bi('Total', 'ጠቅላላ')}</span>
                 <span className="text-lg font-black text-primary">ETB {Number(order.total_amount).toFixed(2)}</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
