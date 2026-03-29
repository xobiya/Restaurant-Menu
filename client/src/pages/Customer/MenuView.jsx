import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Zap, ShoppingBag, MapPin } from 'lucide-react';
import BentoCard from '../../components/common/BentoCard';
import LanguageSwitch from '../../components/common/LanguageSwitch';
import api from '../../lib/api';
import { useLocale } from '../../lib/locale';
import { useCartStore } from '../../store/cartStore';
import { getTableNumber, setTableNumber } from '../../lib/table';

export default function MenuView() {
  const navigate = useNavigate();
  const addItemWithQuantity = useCartStore((state) => state.addItemWithQuantity);
  const { t, formatCategoryLabel } = useLocale();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [fastMode, setFastMode] = useState(true);
  const [selectedQuantities, setSelectedQuantities] = useState({});
  const [tableNumber, setTableNumberState] = useState(getTableNumber());
  const [tableInput, setTableInput] = useState(getTableNumber() ? String(getTableNumber()) : '');
  const [tableError, setTableError] = useState('');

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

  const saveTable = () => {
    if (!setTableNumber(tableInput)) {
      setTableError(t('tableRequired'));
      return;
    }
    setTableError('');
    const saved = getTableNumber();
    setTableNumberState(saved);
  };

  const addSelectedToOrder = () => {
    const activeTable = getTableNumber();
    if (!activeTable) {
      setTableError(t('tableRequired'));
      return;
    }

    Object.entries(selectedQuantities).forEach(([id, qty]) => {
      if (qty > 0 && allItemsById[Number(id)]) {
        addItemWithQuantity(allItemsById[Number(id)], qty);
      }
    });
    setSelectedQuantities({});
    navigate('/order');
  };

  return (
    <div className="px-4 pt-6 pb-32">
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-2xl p-4 mb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h1>{t('menu')}</h1>
            <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-surfaceSoft px-3 py-1.5 text-sm">
              <MapPin size={14} className="text-primary" />
              <span className="text-textMuted">
                {t('table')}: <span className="text-textMain font-semibold">{tableNumber || '-'}</span>
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <LanguageSwitch />
            <button
              onClick={() => setFastMode((prev) => !prev)}
              className={`h-9 px-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                fastMode
                  ? 'bg-primary text-black border-primary'
                  : 'bg-surfaceSoft text-textMuted border-white/10'
              }`}
            >
              <Zap size={14} />
              <span>{fastMode ? t('fastOrderOn') : t('fastOrderOff')}</span>
            </button>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <input
            type="number"
            min="1"
            value={tableInput}
            onChange={(e) => setTableInput(e.target.value)}
            placeholder={t('table')}
            className="premium-input h-10 py-2"
          />
          <button
            onClick={saveTable}
            className="h-10 px-3 rounded-xl bg-primary text-black text-sm font-semibold hover:bg-primaryDark"
          >
            {tableNumber ? t('editTable') : t('saveTable')}
          </button>
        </div>
        {tableError && <p className="text-red-400 text-sm mt-2">{tableError}</p>}
      </motion.section>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('search')}
          className="premium-input pl-9"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-3">
        <button
          onClick={() => setActiveCategory('ALL')}
          className={`h-9 px-4 rounded-full text-xs font-bold whitespace-nowrap ${
            activeCategory === 'ALL'
              ? 'bg-primary text-black'
              : 'bg-surfaceSoft text-textMuted border border-white/10'
          }`}
        >
          {t('all')}
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.name)}
            className={`h-9 px-4 rounded-full text-xs font-bold whitespace-nowrap ${
              activeCategory === cat.name
                ? 'bg-primary text-black'
                : 'bg-surfaceSoft text-textMuted border border-white/10'
            }`}
          >
            {formatCategoryLabel(cat.name)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bento-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-panel rounded-bento h-[210px] animate-pulse" />
          ))}
        </div>
      ) : filteredCategories.length > 0 ? (
        <div className={fastMode ? 'space-y-6 pb-28' : 'space-y-6'}>
          {filteredCategories.map((cat) => (
            <section key={cat.id}>
              <h2 className="mb-3 text-textMain">{formatCategoryLabel(cat.name)}</h2>
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
            </section>
          ))}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-8 text-center text-textMuted">
          {t('noItemsMatching')} "{searchQuery}"
        </div>
      )}

      {fastMode && selectedItemsCount > 0 && (
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-[84px] left-4 right-4 glass-panel rounded-2xl p-3.5 border border-primary/40 z-40"
        >
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-semibold text-textMain">
              {selectedItemsCount} {t('itemsSelected')}
            </span>
            <span className="font-bold text-primary">ETB {selectedTotal.toFixed(2)}</span>
          </div>
          <button
            onClick={addSelectedToOrder}
            className="w-full h-11 rounded-xl bg-primary text-black font-bold flex items-center justify-center gap-2 hover:bg-primaryDark"
          >
            <ShoppingBag size={16} />
            <span>{t('addSelected')}</span>
          </button>
        </motion.div>
      )}
    </div>
  );
}
