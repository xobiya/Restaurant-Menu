import { Clock3, Home, Menu, ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useLocale } from '../../lib/locale';
import { CUSTOMER_EVENTS, getQueuedOrders } from '../../lib/customerState';
import { useCartStore } from '../../store/cartStore';

export default function GlassNav() {
  const { t } = useLocale();
  const totalItems = useCartStore((state) =>
    state.cartItems.reduce((sum, item) => sum + item.quantity, 0)
  );
  const [queuedCount, setQueuedCount] = useState(() => getQueuedOrders().length);

  useEffect(() => {
    const handleQueueChange = () => setQueuedCount(getQueuedOrders().length);
    window.addEventListener(CUSTOMER_EVENTS.queue, handleQueueChange);
    return () => window.removeEventListener(CUSTOMER_EVENTS.queue, handleQueueChange);
  }, []);

  const links = [
    { to: '/', label: t('home'), icon: Home },
    { to: '/menu', label: t('menu'), icon: Menu },
    { to: '/order', label: t('order'), icon: ShoppingCart, badge: totalItems },
    { to: '/orders', label: t('orders'), icon: Clock3, badge: queuedCount || undefined },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2">
      <nav className="glass-panel mx-auto max-w-xl rounded-3xl bg-surface/95">
        <div className="grid grid-cols-4">
          {links.map(({ to, label, icon: Icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center py-3.5 transition-colors ${
                  isActive ? 'text-primary' : 'text-textMuted hover:text-textMain'
                }`
              }
            >
              <div className="relative">
                <Icon size={20} strokeWidth={2} />
                {badge > 0 ? (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-black">
                    {badge}
                  </span>
                ) : null}
              </div>
              <span className="mt-1 text-[11px] font-semibold">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
