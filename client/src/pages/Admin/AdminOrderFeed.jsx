import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Check,
  ChefHat,
  AlertCircle,
  MapPin,
  Clock,
  Printer,
  Bell,
  BellOff,
  Volume2,
} from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../../lib/api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
const SOUND_PREF_KEY = 'kitchen_sound_enabled';

const statusPriority = {
  Pending: 0,
  Preparing: 1,
  Ready: 2,
  Completed: 3,
};

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const playKitchenAlert = () => {
  if (typeof window === 'undefined') return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  const audioContext = new AudioContextClass();

  const playPattern = () => {
    const pattern = [
      { start: 0, frequency: 880, duration: 0.12 },
      { start: 0.18, frequency: 1174, duration: 0.14 },
      { start: 0.38, frequency: 880, duration: 0.12 },
    ];

    pattern.forEach((tone) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(tone.frequency, audioContext.currentTime + tone.start);

      gain.gain.setValueAtTime(0.0001, audioContext.currentTime + tone.start);
      gain.gain.exponentialRampToValueAtTime(0.2, audioContext.currentTime + tone.start + 0.01);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        audioContext.currentTime + tone.start + tone.duration
      );

      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(audioContext.currentTime + tone.start);
      oscillator.stop(audioContext.currentTime + tone.start + tone.duration);
    });
  };

  if (audioContext.state === 'suspended') {
    audioContext.resume().then(playPattern).catch(() => {});
  } else {
    playPattern();
  }

  setTimeout(() => {
    audioContext.close().catch(() => {});
  }, 1300);
};

const printKitchenTicket = (order) => {
  if (!order) return;

  const popup = window.open('', '_blank', 'width=420,height=720');
  if (!popup) {
    window.alert('Please allow popups to print kitchen tickets.');
    return;
  }

  const createdAt = new Date(order.created_at).toLocaleString();
  const itemRows = (order.orderItems || [])
    .map(
      (item) => `
      <tr>
        <td>${escapeHtml(`${item.quantity}x`)}</td>
        <td>${escapeHtml(item.menuItem?.name || 'Item')}</td>
        <td style="text-align:right;">${escapeHtml(Number(item.subtotal).toFixed(2))}</td>
      </tr>
    `
    )
    .join('');

  const ticketHtml = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Kitchen Ticket #${escapeHtml(order.id.substring(0, 8))}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 16px; color: #111; }
          .ticket { width: 320px; margin: 0 auto; }
          h1, h2, p { margin: 0; }
          .title { text-align: center; margin-bottom: 8px; }
          .muted { color: #555; font-size: 12px; }
          .line { border-top: 1px dashed #777; margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          td { padding: 4px 0; vertical-align: top; }
          .meta { font-size: 13px; line-height: 1.45; }
          .total { font-weight: bold; font-size: 14px; margin-top: 8px; display: flex; justify-content: space-between; }
          .footer { margin-top: 12px; text-align: center; font-size: 11px; color: #444; }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="title">
            <h2>KITCHEN TICKET</h2>
            <p class="muted">Restaurant Order Slip</p>
          </div>
          <div class="line"></div>
          <div class="meta">
            <p><strong>Order:</strong> #${escapeHtml(order.id.substring(0, 8))}</p>
            <p><strong>Table:</strong> ${escapeHtml(order.table_number)}</p>
            <p><strong>Status:</strong> ${escapeHtml(order.status)}</p>
            <p><strong>Payment:</strong> ${escapeHtml(order.payment_status)}</p>
            <p><strong>Time:</strong> ${escapeHtml(createdAt)}</p>
            <p><strong>ETA:</strong> ${escapeHtml(order.estimatedReadyTimeMinutes || 0)} min</p>
          </div>
          <div class="line"></div>
          <table>
            <tbody>
              ${itemRows || '<tr><td colspan="3">No items</td></tr>'}
            </tbody>
          </table>
          <div class="line"></div>
          <div class="total">
            <span>Total</span>
            <span>ETB ${escapeHtml(Number(order.total_amount).toFixed(2))}</span>
          </div>
          <div class="footer">
            <p>Print Time: ${escapeHtml(new Date().toLocaleString())}</p>
          </div>
        </div>
      </body>
    </html>
  `;

  popup.document.open();
  popup.document.write(ticketHtml);
  popup.document.close();
  popup.focus();
  popup.onload = () => {
    popup.print();
  };
  popup.onafterprint = () => popup.close();
};

const StatusBadge = ({ status }) => {
  const configs = {
    Pending: { color: 'bg-orange-500', icon: AlertCircle, pulse: true },
    Preparing: { color: 'bg-blue-500', icon: ChefHat, pulse: true },
    Ready: { color: 'bg-green-500', icon: Check, pulse: false },
    Completed: { color: 'bg-gray-500', icon: Check, pulse: false },
  };

  const config = configs[status] || configs.Pending;
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold ${config.color} text-white`}>
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

const PaymentBadge = ({ paymentStatus }) => (
  <span
    className={`text-xs font-semibold ${
      paymentStatus === 'Paid'
        ? 'text-green-400'
        : paymentStatus === 'Failed'
          ? 'text-red-400'
          : 'text-orange-400'
    }`}
  >
    {paymentStatus}
  </span>
);

const ActionButtons = ({ order, updateStatus, onPrint }) => (
  <div className="flex items-center gap-2 flex-wrap justify-end">
    <button
      onClick={() => onPrint(order)}
      className="h-8 px-3 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 text-xs font-semibold inline-flex items-center gap-1.5"
    >
      <Printer size={13} />
      Ticket
    </button>

    {order.status === 'Pending' && (
      <button
        onClick={() => updateStatus(order.id, 'Preparing')}
        className="h-8 px-3 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-xs font-semibold"
      >
        Start
      </button>
    )}
    {order.status === 'Preparing' && (
      <button
        onClick={() => updateStatus(order.id, 'Ready')}
        className="h-8 px-3 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 text-xs font-semibold"
      >
        Ready
      </button>
    )}
    {order.status === 'Ready' && (
      <button
        onClick={() => updateStatus(order.id, 'Completed')}
        className="h-8 px-3 rounded-lg bg-white/10 text-textMuted hover:bg-white/20 text-xs font-semibold"
      >
        Done
      </button>
    )}
  </div>
);

export default function AdminOrderFeed() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem(SOUND_PREF_KEY);
    return stored === null ? true : stored === 'true';
  });
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
    localStorage.setItem(SOUND_PREF_KEY, String(soundEnabled));
  }, [soundEnabled]);

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

    const socket = io(SOCKET_URL);

    socket.on('newOrder', (newOrder) => {
      setOrders((prev) => [newOrder, ...prev]);
      if (soundEnabledRef.current && newOrder.status === 'Pending') {
        playKitchenAlert();
      }
    });

    socket.on('orderUpdated', (updatedOrder) => {
      setOrders((prev) => prev.map((order) => (order.id === updatedOrder.id ? updatedOrder : order)));
    });

    return () => socket.disconnect();
  }, []);

  const groupedByTable = useMemo(() => {
    const groups = {};
    orders.forEach((order) => {
      const key = String(order.table_number || '-');
      if (!groups[key]) groups[key] = [];
      groups[key].push(order);
    });

    return Object.entries(groups)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([tableNumber, tableOrders]) => {
        const sortedOrders = [...tableOrders].sort((a, b) => {
          const statusDiff = (statusPriority[a.status] ?? 99) - (statusPriority[b.status] ?? 99);
          if (statusDiff !== 0) return statusDiff;
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
        return { tableNumber, tableOrders: sortedOrders };
      });
  }, [orders]);

  const updateStatus = async (id, newStatus) => {
    try {
      const response = await api.patch(`/orders/${id}/status`, { status: newStatus });
      setOrders((prev) => prev.map((order) => (order.id === id ? response.data : order)));
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  if (loading) return <div className="p-8 text-center text-textMuted font-mono">Loading Kitchen Feed...</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-xl font-bold">Live Orders</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            className={`h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border ${
              soundEnabled
                ? 'bg-green-500/15 text-green-300 border-green-500/30'
                : 'bg-white/5 text-textMuted border-white/10'
            }`}
          >
            {soundEnabled ? <Bell size={14} /> : <BellOff size={14} />}
            {soundEnabled ? 'Sound ON' : 'Sound OFF'}
          </button>
          <button
            onClick={playKitchenAlert}
            className="h-8 px-3 rounded-lg bg-white/5 border border-white/10 text-textMuted hover:text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Volume2 size={14} />
            Test Sound
          </button>
          <span className="text-xs text-textMuted bg-surface px-2 py-1 rounded border border-white/5">
            {orders.length} Active
          </span>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="glass-panel rounded-xl p-8 text-center text-textMuted">No active orders.</div>
      ) : (
        <div className="space-y-4">
          {groupedByTable.map(({ tableNumber, tableOrders }) => (
            <div key={tableNumber} className="glass-panel rounded-xl border border-white/5 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <div className="inline-flex items-center gap-2 font-semibold">
                  <MapPin size={16} className="text-primary" />
                  <span>Table {tableNumber}</span>
                </div>
                <span className="text-xs text-textMuted">{tableOrders.length} order(s)</span>
              </div>

              <div className="divide-y divide-white/5">
                {tableOrders.map((order) => (
                  <div key={order.id} className="px-4 py-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-textMuted">#{order.id.substring(0, 8)}</span>
                          <StatusBadge status={order.status} />
                          <PaymentBadge paymentStatus={order.payment_status} />
                        </div>
                        <div className="text-sm text-textMuted inline-flex items-center gap-1">
                          <Clock size={14} />
                          <span>{new Date(order.created_at).toLocaleTimeString()}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">ETB {Number(order.total_amount).toFixed(2)}</p>
                        <p className="text-xs text-textMuted">{order.estimatedReadyTimeMinutes || 0} min ETA</p>
                      </div>
                    </div>

                    <div className="mt-3 text-sm text-textMuted">
                      {order.orderItems?.length
                        ? order.orderItems.map((item) => `${item.quantity}x ${item.menuItem?.name || 'Item'}`).join(', ')
                        : 'No item details'}
                    </div>

                    <div className="mt-3 flex justify-end">
                      <ActionButtons order={order} updateStatus={updateStatus} onPrint={printKitchenTicket} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
