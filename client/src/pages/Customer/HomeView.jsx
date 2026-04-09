import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  Flame,
  Coffee,
  Wine,
  ChefHat,
  ChevronRight,
  Sparkles,
  UtensilsCrossed,
  Salad,
  Fish,
  Beef,
  Circle,
  ArrowRight,
  Percent,
  Star,
} from 'lucide-react';
import {
  CUSTOMER_EVENTS,
  getCustomerPreferences,
  getOrderHistory,
  getQueuedOrders,
} from '../../lib/customerState';
import { formatCurrency } from '../../lib/formatters';
import { useLocale } from '../../lib/locale';
import { getTableNumber } from '../../lib/table';

// --- Reusable Components ---
const CategoryPill = ({ active, icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium transition-all duration-200 ${
      active
        ? 'bg-amber-500 border-amber-500 text-black shadow-md shadow-amber-500/20'
        : 'bg-white border-gray-200 text-gray-700 hover:border-amber-300 hover:bg-amber-50'
    }`}
  >
    <Icon size={16} />
    <span>{label}</span>
  </button>
);

const MenuItemCard = ({ item }) => (
  <div className="relative flex items-start gap-4 p-4 transition-all border border-transparent group rounded-2xl hover:bg-white hover:shadow-lg hover:border-gray-100">
    <div className="flex items-center justify-center w-16 h-16 shrink-0 rounded-xl bg-gray-50 text-amber-600 group-hover:bg-amber-50">
      {item.icon === 'flame' && <Flame size={28} />}
      {item.icon === 'salad' && <Salad size={28} />}
      {item.icon === 'fish' && <Fish size={28} />}
      {item.icon === 'beef' && <Beef size={28} />}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-gray-900 truncate">{item.name}</h4>
        <span className="font-mono font-bold text-gray-900">
          {formatCurrency(item.price, 'en')}
        </span>
      </div>
      <p className="mt-1 text-sm text-gray-500 line-clamp-2">{item.description}</p>
      {item.isSpicy && (
        <div className="flex items-center gap-1 mt-2 text-xs font-medium text-red-500">
          <Flame size={12} /> Spicy
        </div>
      )}
    </div>
    <div className="absolute transition-opacity -translate-y-1/2 opacity-0 right-4 top-1/2 group-hover:opacity-100">
      <div className="flex items-center justify-center w-8 h-8 text-white rounded-full shadow-md bg-amber-500">
        <ChevronRight size={18} />
      </div>
    </div>
  </div>
);

// --- Mock Menu Data (Replace with API call) ---
const featuredItems = [
  {
    id: '1',
    name: 'Truffle Risotto',
    description: 'Arborio rice, wild mushrooms, parmesan, white truffle oil',
    price: 24.0,
    icon: 'flame',
    isSpicy: false,
    isPopular: true,
  },
  {
    id: '2',
    name: 'Grilled Octopus',
    description: 'Charred octopus, romesco, olive tapenade, lemon aioli',
    price: 28.0,
    icon: 'fish',
    isSpicy: false,
    isPopular: true,
  },
  {
    id: '3',
    name: 'Wagyu Beef Tartare',
    description: 'Hand-cut wagyu, quail egg, capers, sourdough crisps',
    price: 32.0,
    icon: 'beef',
    isSpicy: false,
    isPopular: true,
  },
  {
    id: '4',
    name: 'Spicy Tuna Crispy Rice',
    description: 'Spicy mayo, avocado, serrano peppers, eel sauce',
    price: 22.0,
    icon: 'flame',
    isSpicy: true,
    isPopular: true,
  },
];

export default function HomeView() {
  const { t, language } = useLocale();
  const [activeCategory, setActiveCategory] = useState('popular');
  const [queuedCount, setQueuedCount] = useState(() => getQueuedOrders().length);
  const [recentOrder, setRecentOrder] = useState(() => getOrderHistory()[0]);
  const tableNumber = getTableNumber();

  useEffect(() => {
    const handleQueue = () => setQueuedCount(getQueuedOrders().length);
    const handleHistory = () => setRecentOrder(getOrderHistory()[0]);

    window.addEventListener(CUSTOMER_EVENTS.queue, handleQueue);
    window.addEventListener(CUSTOMER_EVENTS.history, handleHistory);

    return () => {
      window.removeEventListener(CUSTOMER_EVENTS.queue, handleQueue);
      window.removeEventListener(CUSTOMER_EVENTS.history, handleHistory);
    };
  }, []);

  // Restaurant info
  const restaurantName = 'The Olive & Thyme';
  const openingHours = 'Open until 10:30 PM';

  return (
    <div className="flex flex-col w-full min-h-screen bg-gray-50">
      {/* Header / Status Bar */}
      <header className="sticky top-0 z-20 px-4 py-4 border-b bg-white/80 backdrop-blur-xl border-gray-200/80 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mx-auto max-w-7xl">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 text-white shadow-md rounded-xl bg-amber-500 shadow-amber-500/20">
              <UtensilsCrossed size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-gray-900">{restaurantName}</h1>
              <div className="flex items-center gap-1.5">
                <Circle size={8} className="text-green-500 fill-green-500" />
                <span className="text-xs font-medium text-gray-600">{openingHours}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {tableNumber && (
              <div className="items-center hidden gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-full sm:flex">
                <span>Table</span>
                <span className="font-mono text-amber-600">#{tableNumber}</span>
              </div>
            )}
            <Link
              to="/orders"
              className="relative flex items-center justify-center rounded-full bg-white p-2.5 shadow-sm ring-1 ring-gray-200 transition-all hover:bg-gray-50"
            >
              <Clock size={20} className="text-gray-700" />
              {queuedCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {queuedCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto space-y-10 max-w-7xl">
          {/* Welcome & CTA Section */}
          <section className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 rounded-full bg-amber-100">
                  <span className="text-xs font-bold tracking-wider uppercase text-amber-800">
                    Welcome back
                  </span>
                </div>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Ready for another round of flavors?
              </h2>
              <p className="text-lg text-gray-600">
                Browse our seasonal menu crafted by Chef Michael. Quick ordering, real-time
                updates.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  to="/menu"
                  className="inline-flex items-center gap-2 px-6 py-3 font-bold text-black transition-all rounded-full shadow-md bg-amber-500 shadow-amber-500/20 hover:bg-amber-600 hover:scale-105"
                >
                  <Sparkles size={18} />
                  View Full Menu
                  <ArrowRight size={18} />
                </Link>
                {recentOrder && (
                  <Link
                    to="/orders"
                    className="inline-flex items-center gap-2 px-6 py-3 font-medium text-gray-700 transition-all bg-white rounded-full shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
                  >
                    Reorder #{recentOrder.orderId || recentOrder.localId}
                  </Link>
                )}
              </div>
            </div>

            {/* Promo Card */}
            <div className="relative p-6 overflow-hidden text-white shadow-xl rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 lg:col-span-1">
              <div className="absolute w-24 h-24 rounded-full -right-6 -top-6 bg-amber-500/30 blur-3xl" />
              <div className="relative z-10">
                <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-2xl bg-white/10 backdrop-blur-sm">
                  <Percent size={24} className="text-amber-400" />
                </div>
                <h3 className="text-xl font-bold">Happy Hour Menu</h3>
                <p className="mt-2 text-sm text-gray-300">
                  20% off on selected appetizers and cocktails. Mon–Fri, 4–7 PM.
                </p>
                <button className="flex items-center gap-2 mt-6 text-sm font-medium transition-colors text-amber-400 hover:text-amber-300">
                  Explore deals <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </section>

          {/* Menu Categories Filter */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Explore Categories</h3>
              <Link
                to="/menu"
                className="flex items-center gap-1 text-sm font-medium text-amber-600 hover:text-amber-700"
              >
                See all <ArrowRight size={14} />
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              <CategoryPill
                active={activeCategory === 'popular'}
                icon={Star}
                label="Popular"
                onClick={() => setActiveCategory('popular')}
              />
              <CategoryPill
                active={activeCategory === 'starters'}
                icon={Salad}
                label="Starters"
                onClick={() => setActiveCategory('starters')}
              />
              <CategoryPill
                active={activeCategory === 'mains'}
                icon={ChefHat}
                label="Mains"
                onClick={() => setActiveCategory('mains')}
              />
              <CategoryPill
                active={activeCategory === 'seafood'}
                icon={Fish}
                label="Seafood"
                onClick={() => setActiveCategory('seafood')}
              />
              <CategoryPill
                active={activeCategory === 'grill'}
                icon={Flame}
                label="Grill"
                onClick={() => setActiveCategory('grill')}
              />
              <CategoryPill
                active={activeCategory === 'drinks'}
                icon={Wine}
                label="Drinks"
                onClick={() => setActiveCategory('drinks')}
              />
              <CategoryPill
                active={activeCategory === 'desserts'}
                icon={Coffee}
                label="Desserts"
                onClick={() => setActiveCategory('desserts')}
              />
            </div>
          </section>

          {/* Featured Menu Grid */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Chef's Selections</h3>
              <span className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-200 rounded-full">
                {featuredItems.length} items
              </span>
            </div>
            <div className="grid gap-2 p-2 bg-white divide-y divide-gray-100 shadow-sm rounded-3xl ring-1 ring-gray-200/50 sm:grid-cols-2 sm:divide-y-0">
              {featuredItems.map((item) => (
                <MenuItemCard key={item.id} item={item} />
              ))}
            </div>
            <div className="flex justify-center mt-4">
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-700 transition-all bg-white rounded-full shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
              >
                Browse full menu <ChevronRight size={16} />
              </Link>
            </div>
          </section>

          {/* Footer Info / Operations (Minimal) */}
          <div className="flex flex-col items-center justify-between gap-4 pt-8 text-sm text-gray-500 border-t border-gray-200 sm:flex-row">
            <div className="flex items-center gap-4">
              <span>© The Olive & Thyme</span>
              <span className="w-px h-4 bg-gray-300" />
              <span>123 Main Street</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/staff/login" className="transition-colors hover:text-gray-900">
                Staff Access
              </Link>
              <span className="w-px h-4 bg-gray-300" />
              <Link to="/admin/login" className="transition-colors hover:text-gray-900">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}