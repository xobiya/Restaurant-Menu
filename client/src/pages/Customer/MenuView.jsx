import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Zap, ShoppingBag, Check } from 'lucide-react';
import BentoCard from '../../components/common/BentoCard';
import api from '../../lib/api';
import { bi, formatCategoryLabel } from '../../lib/locale';
import { useCartStore } from '../../store/cartStore';

export default function MenuView() {
  const navigate = useNavigate();
  const addItemWithQuantity = useCartStore((state) => state.addItemWithQuantity);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [fastMode, setFastMode] = useState(true);
  const [selectedQuantities, setSelectedQuantities] = useState({});

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await api.get('/menu');
        setCategories(response.data);
      } catch (error) {
        console.error('Failed to fetch menu:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  const allItemsById = useMemo(() => {
    const map = {};
    categories.forEach((category) => {
      category.menuItems.forEach((item) => {
        map[item.id] = item;
      });
    });
    return map;
  }, [categories]);

  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      menuItems: cat.menuItems.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          (activeCategory === 'ALL' || cat.name === activeCategory)
      ),
    }))
    .filter((cat) => cat.menuItems.length > 0);

  const selectedItemsCount = useMemo(
    () => Object.values(selectedQuantities).reduce((sum, qty) => sum + qty, 0),
    [selectedQuantities]
  );

  const selectedTotal = useMemo(() => {
    return Object.entries(selectedQuantities).reduce((sum, [id, qty]) => {
      const item = allItemsById[Number(id)];
      return item ? sum + Number(item.price) * qty : sum;
    }, 0);
  }, [selectedQuantities, allItemsById]);

  const increaseSelected = (item) => {
    setSelectedQuantities((prev) => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + 1,
    }));
  };

  const decreaseSelected = (item) => {
    setSelectedQuantities((prev) => {
      const current = prev[item.id] || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[item.id];
        return next;
      }
      return { ...prev, [item.id]: current - 1 };
    });
  };

  const addSelectedToOrder = () => {
    Object.entries(selectedQuantities).forEach(([id, qty]) => {
      if (qty > 0 && allItemsById[Number(id)]) {
        addItemWithQuantity(allItemsById[Number(id)], qty);
      }
    });
    setSelectedQuantities({});
    navigate('/order');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="pt-6 px-4"
    >
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{bi('Menu', 'ምናሌ')}</h1>
          <p className="text-textMuted mt-1 text-sm">
            {bi('Table', 'ጠረጴዛ')} {localStorage.getItem('table_number') || '1'}
          </p>
        </div>
        <div className="relative group">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
          <input
            type="text"
            placeholder={bi('Search...', 'ፈልግ...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-surface rounded-full border border-white/10 text-sm focus:outline-none focus:border-primary w-[140px] focus:w-[200px] transition-all"
          />
        </div>
      </div>

      <div className="mb-4">
        <button
          onClick={() => setFastMode((prev) => !prev)}
          className={`w-full rounded-xl py-3 px-4 flex items-center justify-center gap-2 text-sm font-semibold border transition-colors ${
            fastMode ? 'bg-primary border-primary text-white' : 'bg-surface border-white/10 text-textMuted'
          }`}
        >
          <Zap size={16} />
          <span>{fastMode ? bi('Fast Order: ON', 'ፈጣን ትዕዛዝ: በርቷል') : bi('Fast Order: OFF', 'ፈጣን ትዕዛዝ: ጠፍቷል')}</span>
        </button>
      </div>

      <div className="flex space-x-2 overflow-x-auto pb-4 no-scrollbar mb-4">
        <button
          onClick={() => setActiveCategory('ALL')}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
            activeCategory === 'ALL' ? 'bg-primary text-white border-transparent' : 'bg-surface text-textMuted border-white/5'
          }`}
        >
          {bi('All', 'ሁሉም')}
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.name)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
              activeCategory === cat.name ? 'bg-primary text-white border-transparent' : 'bg-surface text-textMuted border-white/5'
            }`}
          >
            {formatCategoryLabel(cat.name)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bento-grid">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`bg-surface animate-pulse rounded-bento ${i === 0 ? 'col-span-2 row-span-2 h-[250px]' : 'col-span-1 h-[140px]'}`}
            />
          ))}
        </div>
      ) : (
        <div className={fastMode ? 'pb-44' : 'pb-24'}>
          {filteredCategories.length > 0 ? (
            filteredCategories.map((cat) => (
              <div key={cat.id} className="mb-8">
                <h2 className="text-xl font-semibold mb-4 opacity-90">{formatCategoryLabel(cat.name)}</h2>
                <div className="bento-grid">
                  {cat.menuItems.map((item, index) => (
                    <BentoCard
                      key={item.id}
                      item={item}
                      isLarge={cat.name === 'Daily Specials' && index === 0}
                      fastMode={fastMode}
                      selectedQuantity={selectedQuantities[item.id] || 0}
                      onIncrease={increaseSelected}
                      onDecrease={decreaseSelected}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center text-textMuted">
              {bi('No items found matching', 'ምንም አልተገኘም')} "{searchQuery}"
            </div>
          )}
        </div>
      )}

      {fastMode && selectedItemsCount > 0 && (
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-[92px] left-4 right-4 glass-panel rounded-2xl p-4 border border-primary/40 shadow-2xl z-40"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">
              {selectedItemsCount} {bi('items selected', 'እቃዎች ተመርጠዋል')}
            </p>
            <p className="text-sm font-bold text-primary">ETB {selectedTotal.toFixed(2)}</p>
          </div>
          <button
            onClick={addSelectedToOrder}
            className="w-full bg-primary hover:bg-primary/80 rounded-xl py-3 font-semibold flex items-center justify-center gap-2"
          >
            <Check size={16} />
            <span>{bi('Add Selected to Order', 'የተመረጡትን ወደ ትዕዛዝ ጨምር')}</span>
            <ShoppingBag size={16} />
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
