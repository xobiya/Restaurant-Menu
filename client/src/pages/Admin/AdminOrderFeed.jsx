import { useState, useEffect } from 'react';
import { Check, ChefHat, AlertCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../../lib/api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const StatusBadge = ({ status }) => {
  const configs = {
    'Pending': { color: 'bg-orange-500', icon: AlertCircle, pulse: true },
    'Preparing': { color: 'bg-blue-500', icon: ChefHat, pulse: true },
    'Ready': { color: 'bg-green-500', icon: Check, pulse: false },
    'Completed': { color: 'bg-gray-500', icon: Check, pulse: false },
  };

  const config = configs[status] || configs['Pending'];
  const Icon = config.icon;

  return (
    <div className={`flex items-center space-x-2 px-2 py-1 rounded-full text-xs font-semibold ${config.color} text-white`}>
      {config.pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
        </span>
      )}
      <Icon size={12} strokeWidth={2.5} />
      <span>{status}</span>
    </div>
  );
};

export default function AdminOrderFeed() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get('/orders');
        setOrders(response.data);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    // Connect to socket server
    const socket = io(SOCKET_URL);

    // Listen for real-time updates
    socket.on('newOrder', (newOrder) => {
      console.log('New real-time order received:', newOrder);
      setOrders(prev => [newOrder, ...prev]);
    });

    socket.on('orderUpdated', (updatedOrder) => {
      setOrders((prev) => prev.map((order) => (order.id === updatedOrder.id ? updatedOrder : order)));
    });

    return () => socket.disconnect();
  }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      const response = await api.patch(`/orders/${id}/status`, { status: newStatus });
      setOrders(prev => prev.map(o => o.id === id ? response.data : o));
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  if (loading) return <div className="p-8 text-center text-textMuted font-mono">Loading Kitchen Feed...</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Live Orders</h2>
        <span className="text-xs text-textMuted bg-surface px-2 py-1 rounded border border-white/5">
          {orders.length} Active
        </span>
      </div>

      <div className="glass-panel overflow-hidden border border-white/5 rounded-xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-textMuted uppercase text-[10px] font-bold tracking-wider">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Table</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-4 font-mono text-xs">#{order.id.substring(0, 8)}</td>
                <td className="px-4 py-4 font-bold">T-{order.table_number}</td>
                <td className="px-4 py-4">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-4 py-4">
                  <span className={`text-xs font-semibold ${
                    order.payment_status === 'Paid'
                      ? 'text-green-400'
                      : order.payment_status === 'Failed'
                        ? 'text-red-400'
                        : 'text-orange-400'
                  }`}>
                    {order.payment_status}
                  </span>
                </td>
                <td className="px-4 py-4 font-semibold">ETB {order.total_amount}</td>
                <td className="px-4 py-4">
                  <div className="flex space-x-2">
                    {order.status === 'Pending' && (
                      <button 
                        onClick={() => updateStatus(order.id, 'Preparing')}
                        className="p-1 hover:text-blue-400 transition-colors"
                      >
                        Start
                      </button>
                    )}
                    {order.status === 'Preparing' && (
                      <button 
                        onClick={() => updateStatus(order.id, 'Ready')}
                        className="p-1 hover:text-green-400 transition-colors"
                      >
                        Ready
                      </button>
                    )}
                    {order.status === 'Ready' && (
                      <button 
                        onClick={() => updateStatus(order.id, 'Completed')}
                        className="p-1 hover:text-gray-400 transition-colors"
                      >
                         Done
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
