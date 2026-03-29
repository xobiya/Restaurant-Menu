import { NavLink } from 'react-router-dom';
import { Home, ShoppingBag, Clock } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useLocale } from '../../lib/locale';

export default function GlassNav() {
  const { t } = useLocale();
  const cartItemsCount = useCartStore((state) =>
    state.cartItems.reduce((acc, item) => acc + item.quantity, 0)
  );

  const navItems = [
    { to: '/menu', icon: Home, label: t('menu') },
    { to: '/order', icon: ShoppingBag, label: t('order'), badge: cartItemsCount },
    { to: '/track', icon: Clock, label: t('track') },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2">
      <nav className="mx-auto max-w-md rounded-2xl glass-panel bg-surface/95">
        <div className="grid grid-cols-3">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center py-3.5 transition-colors ${
                  isActive ? 'text-primary' : 'text-textMuted hover:text-textMain'
                }`
              }
            >
              <div className="relative">
                <item.icon size={20} strokeWidth={2} />
                {item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-black text-[10px] font-bold h-4 min-w-4 px-1 flex items-center justify-center rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 font-semibold">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
