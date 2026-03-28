import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { Clock, CheckCircle2, Package, ChefHat, ArrowLeft } from 'lucide-react';
import { io } from 'socket.io-client';

const API_BASE_URL = 'http://localhost:5000/api';

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
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/orders/${id}`);
        setOrder(response.data);
      } catch (error) {
        console.error('Failed to fetch order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    // Socket for real-time updates
    const socket = io('http://localhost:5000');
    
    // Listen for status updates for this specific order
    socket.on(`orderStatusUpdate:${id}`, (updatedOrder) => {
      console.log('Real-time status update:', updatedOrder.status);
      setOrder(updatedOrder);
    });

    return () => socket.disconnect();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-mono opacity-50">Fetching Order Status...</div>;
  if (!order) return <div className="min-h-screen flex items-center justify-center flex-col space-y-4">
    <p>Order not found</p>
    <Link to="/" className="text-primary text-sm font-bold uppercase">Back to Menu</Link>
  </div>;

  const statuses = ['Pending', 'Preparing', 'Ready', 'Completed'];
  const currentIdx = statuses.indexOf(order.status);

  return (
    <div className="min-h-screen pb-20 pt-8 px-6">
      <Link to="/" className="inline-flex items-center space-x-2 text-textMuted hover:text-white transition-colors mb-10">
        <ArrowLeft size={16} />
        <span className="text-sm font-medium">Back to Restaurant</span>
      </Link>

      <div className="space-y-12">
        <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">#{order.id.substring(0, 8)}</h1>
            <p className="text-textMuted text-sm">Table {order.table_number}</p>
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

           <StatusStep icon={Package} label="Pending" completed={currentIdx > 0} active={currentIdx === 0} />
           <StatusStep icon={ChefHat} label="Kitchen" completed={currentIdx > 1} active={currentIdx === 1} />
           <StatusStep icon={CheckCircle2} label="Ready" completed={currentIdx > 2} active={currentIdx === 2} />
           <StatusStep icon={CheckCircle2} label="Done" completed={currentIdx === 3} active={false} />
        </div>

        <div className="glass-panel p-8 rounded-3xl border border-white/5 space-y-6">
           <div className="flex justify-between items-center pb-6 border-b border-white/5">
              <span className="text-sm font-bold text-textMuted uppercase tracking-wider">Estimated Time</span>
              <div className="flex items-center space-x-2 text-primary font-bold text-xl">
                 <Clock size={20} />
                 <span>{order.estimatedReadyTimeMinutes || 20} mins</span>
              </div>
           </div>

           <div className="space-y-4 pt-2">
              <p className="text-xs font-bold text-textMuted uppercase tracking-widest">Order Details</p>
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
                 <span className="text-sm font-bold">Total</span>
                 <span className="text-lg font-black text-primary">ETB {order.total_amount}</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
