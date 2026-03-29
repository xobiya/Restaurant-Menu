import { NavLink } from 'react-router-dom';
import { Home, ShoppingBag, Clock } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';

export default function GlassNav() {
  const cartItemsCount = useCartStore((state) => state.cartItems.reduce((acc, item) => acc + item.quantity, 0));

  const navItems = [
    { to: '/menu', icon: Home, label: 'ምናሌ' },
    { to: '/order', icon: ShoppingBag, label: 'ትዕዛዝ', badge: cartItemsCount },
    { to: '/track', icon: Clock, label: 'ክትትል' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2">
      <nav className="glass-panel mx-auto max-w-sm rounded-full bg-surface/80 shadow-2xl backdrop-blur-xl border border-white/20">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center w-full h-full transition-colors duration-300 ${
                  isActive ? 'text-primary' : 'text-textMuted hover:text-white'
                }`
              }
            >
              <div className="relative">
                <item.icon size={24} strokeWidth={1.5} />
                {item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium mt-1">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
