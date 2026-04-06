import {
  AlertCircle,
  Clock3,
  Flame,
  Languages,
  Leaf,
  Loader2,
  Search,
  SignalHigh,
  ShoppingCart,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SmartImage from '../../components/common/SmartImage';
import api from '../../lib/api';
import { CUSTOMER_EVENTS, getCustomerPreferences, saveCustomerPreferences } from '../../lib/customerState';
import { formatCurrency } from '../../lib/formatters';
import { enrichMenuCategories } from '../../lib/menuCatalog';
import { useLocale } from '../../lib/locale';
import { getTableNumber, setTableNumber } from '../../lib/table';
import { useCartStore } from '../../store/cartStore';

const MENU_CACHE_KEY = 'restaurant_cached_menu_v2';

const getErrorMessage = (error, fallback) => error?.response?.data?.error || fallback;

const readCachedMenu = () => {
  try {
    return JSON.parse(localStorage.getItem(MENU_CACHE_KEY) || '[]');
  } catch {
    return [];
  }
};

const writeCachedMenu = (value) => {
  localStorage.setItem(MENU_CACHE_KEY, JSON.stringify(value));
};

const spiceTone = (spiciness) =>
  ({
    mild: 'bg-emerald-500/10 text-emerald-100 border-emerald-500/20',
    medium: 'bg-amber-500/10 text-amber-100 border-amber-500/20',
    hot: 'bg-red-500/10 text-red-100 border-red-500/20',
  }[spiciness] || 'bg-white/10 text-textMuted border-white/10');

function MenuCardSkeleton() {
  return (
    <article className="overflow-hidden border glass-panel rounded-bento border-white/5">
      {/* Image Skeleton */}
      <div className="w-full h-28 animate-pulse bg-white/5 sm:h-40 md:h-44" />

      <div className="p-3 space-y-3 sm:space-y-4 sm:p-4">
        {/* Title and Price Skeleton */}
        <div className="flex items-start justify-between gap-3">
          <div className="w-full space-y-2">
            <div className="w-3/4 h-5 rounded animate-pulse bg-white/10 sm:h-6" />
            <div className="w-full h-3 rounded animate-pulse bg-white/5 sm:h-4" />
            <div className="w-5/6 h-3 rounded animate-pulse bg-white/5 sm:h-4" />
          </div>
          <div className="h-6 rounded-full w-14 shrink-0 animate-pulse bg-white/10 sm:h-7 sm:w-16" />
        </div>

        {/* Tags Skeleton */}
        <div className="flex gap-2">
          <div className="w-16 h-5 rounded-full animate-pulse bg-white/10 sm:h-6 sm:w-20" />
          <div className="w-20 h-5 rounded-full animate-pulse bg-white/5 sm:h-6 sm:w-24" />
        </div>

        {/* Action Skeleton */}
        <div className="flex items-center justify-between gap-3 pt-2 mt-2">
          <div className="w-16 h-4 rounded-md animate-pulse bg-white/5 sm:h-5 sm:w-20" />
          <div className="w-16 h-8 animate-pulse rounded-xl bg-white/10 sm:h-9 sm:w-20" />
        </div>
      </div>
    </article>
  );
}

function MenuListSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {[1, 2].map((categoryIdx) => (
        <section key={categoryIdx} className="space-y-4 sm:space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-2">
              <div className="w-16 h-3 rounded animate-pulse bg-white/5 sm:h-4" />
              <div className="w-32 h-6 rounded animate-pulse bg-white/10 sm:h-8 sm:w-48" />
            </div>
            <div className="w-20 h-6 border rounded-full animate-pulse border-white/5 bg-white/5 sm:h-7" />
          </div>
          <div className="bento-grid">
            {[1, 2, 3, 4].map((itemIdx) => (
              <MenuCardSkeleton key={itemIdx} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function MenuCard({ item, language, lowDataMode, onAdd, onUpdateQuantity, quantity, t }) {
  const localizedName = language === 'am' ? item.metadata.name_am : item.metadata.name_en;
  const localizedDescription =
    language === 'am' ? item.metadata.description_am : item.metadata.description_en;
  const portionNote =
    language === 'am' ? item.metadata.portionNote_am : item.metadata.portionNote_en;

  return (
    <motion.article 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden border glass-panel rounded-bento border-white/5"
    >
      <SmartImage
        src={item.image_url}
        alt={localizedName}
        width={lowDataMode ? 280 : 520}
        sizes="(min-width: 1024px) 22vw, (min-width: 640px) 38vw, 92vw"
        className="object-cover w-full h-28 sm:h-40 md:h-44"
      />

      <div className="space-y-2.5 p-3 sm:space-y-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold sm:text-lg">{localizedName}</h3>
            <p className="mt-1 text-xs menu-line-clamp-2 text-textMuted sm:text-sm">
              {localizedDescription}
            </p>
          </div>
          <span className="whitespace-nowrap rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-semibold text-primary sm:px-3 sm:text-xs">
            {formatCurrency(item.price, language)}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold sm:px-3 sm:text-xs ${spiceTone(item.metadata.spiciness)}`}>
            <Flame size={12} />
            <span>{t(`spice${item.metadata.spiciness[0].toUpperCase()}${item.metadata.spiciness.slice(1)}`)}</span>
          </span>

          {item.metadata.isVeg ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-100 sm:px-3 sm:text-xs">
              <Leaf size={12} />
              <span>{t('vegetarian')}</span>
            </span>
          ) : null}

          {item.metadata.isFasting ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary sm:px-3 sm:text-xs">
              <Leaf size={12} />
              <span>{t('fastingFriendly')}</span>
            </span>
          ) : null}
        </div>

        {portionNote ? (
          <p className="hidden text-xs menu-line-clamp-2 text-textMuted sm:block">
            <span className="font-semibold text-textMain">{t('portionNote')}: </span>
            {portionNote}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.15em] text-textMuted sm:gap-2 sm:text-xs sm:tracking-[0.2em]">
            <Clock3 size={14} />
            <span>
              {item.prep_time} {t('mins')}
            </span>
          </div>

          {quantity > 0 ? (
            <div className="inline-flex items-center gap-2 px-1 py-1 border rounded-xl border-primary/30 bg-primary/10">
              <motion.button
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={() => onUpdateQuantity(item.id, quantity - 1)}
                className="flex items-center justify-center text-lg font-medium transition rounded-lg w-7 h-7 text-primary hover:bg-primary/20"
              >
                -
              </motion.button>
              <span className="w-5 text-sm font-semibold text-center text-primary">
                {quantity}
              </span>
              <motion.button
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={() => onUpdateQuantity(item.id, quantity + 1)}
                className="flex items-center justify-center text-lg font-medium transition rounded-lg w-7 h-7 text-primary hover:bg-primary/20"
              >
                +
              </motion.button>
            </div>
          ) : (
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => onAdd(item)}
              className="px-3 py-2 text-xs font-semibold text-black transition rounded-xl bg-primary hover:bg-primaryDark sm:text-sm"
            >
              {t('add')}
            </motion.button>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export default function MenuView() {
  const { language, setLanguage, t, formatCategoryLabel } = useLocale();
  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.cartItems);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const totalItems = useCartStore((state) =>
    state.cartItems.reduce((sum, item) => sum + item.quantity, 0)
  );

  const [preferences, setPreferences] = useState(getCustomerPreferences);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [tableInput, setTableInputState] = useState(() => String(getTableNumber() || ''));
  const [savedTable, setSavedTable] = useState(() => getTableNumber());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usedCachedMenu, setUsedCachedMenu] = useState(false);

  useEffect(() => {
    const handlePreferenceChange = () => setPreferences(getCustomerPreferences());
    window.addEventListener(CUSTOMER_EVENTS.preferences, handlePreferenceChange);
    return () => window.removeEventListener(CUSTOMER_EVENTS.preferences, handlePreferenceChange);
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadMenu = async () => {
      setLoading(true);

      try {
        const response = await api.get('/menu');
        if (!ignore) {
          writeCachedMenu(response.data);
          setCategories(enrichMenuCategories(Array.isArray(response.data) ? response.data : []));
          setUsedCachedMenu(false);
          setError('');
        }
      } catch (loadError) {
        const cached = readCachedMenu();

        if (!ignore) {
          if (cached.length) {
            setCategories(enrichMenuCategories(cached));
            setUsedCachedMenu(true);
            setError('');
          } else {
            setError(getErrorMessage(loadError, 'Failed to load the menu.'));
          }
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadMenu();
    return () => {
      ignore = true;
    };
  }, []);

  const filteredCategories = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return categories
      .map((category) => {
        const keepCategory = selectedCategory === 'all' || String(category.id) === selectedCategory;
        if (!keepCategory) return null;

        const menuItems = (category.menuItems || []).filter((item) => {
          const localizedName = language === 'am' ? item.metadata.name_am : item.metadata.name_en;
          const localizedDescription =
            language === 'am' ? item.metadata.description_am : item.metadata.description_en;

          const matchesSearch = normalizedSearch
            ? `${localizedName} ${localizedDescription}`.toLowerCase().includes(normalizedSearch)
            : true;

          const matchesFasting = preferences.fastingOnly
            ? item.metadata.isFasting || item.metadata.isVeg
            : true;

          return matchesSearch && matchesFasting;
        });

        return {
          ...category,
          menuItems,
        };
      })
      .filter(Boolean)
      .filter((category) => category.menuItems.length > 0);
  }, [categories, language, preferences.fastingOnly, search, selectedCategory]);

  const handleSaveTable = () => {
    if (!setTableNumber(tableInput)) {
      setError(t('tableRequired'));
      return;
    }

    setSavedTable(Number(tableInput));
    setError('');
  };

  const handleAddItem = (item) => {
    addItem({
      id: item.id,
      name: item.metadata.name_en,
      price: Number(item.price),
      image_url: item.image_url,
      prep_time: item.prep_time,
    });
  };

  const handleUpdateQuantity = (id, newQuantity) => {
    if (newQuantity === 0) {
      removeItem(id);
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  const toggleLowData = () => {
    setPreferences(
      saveCustomerPreferences({
        lowDataMode: !preferences.lowDataMode,
      })
    );
  };

  return (
    <div className="flex flex-col w-full max-w-6xl min-h-screen gap-6 px-4 pt-6 mx-auto pb-28 sm:px-6 lg:px-8">
      <section className="glass-panel overflow-hidden rounded-[2rem] border border-white/10 p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">
              {t('featuredToday')}
            </p>
            <h1 className="mt-3">Ethiopian dishes prepared for fast table-side ordering.</h1>
            <p className="max-w-xl mt-3 text-sm text-textMuted sm:text-base">
              Browse signature wats, tibs, fasting plates, buna, and sides with a bilingual,
              low-friction menu built for Ethiopian restaurant service.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex p-1 border rounded-2xl border-white/10 bg-surfaceSoft">
              {[
                { value: 'am', label: 'አማ' },
                { value: 'en', label: 'EN' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setLanguage(option.value)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    language === option.value
                      ? 'bg-primary text-black'
                      : 'text-textMuted hover:text-textMain'
                  }`}
                >
                  <Languages size={14} />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={toggleLowData}
              className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                preferences.lowDataMode
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-white/10 text-textMuted hover:text-textMain'
              }`}
            >
              <SignalHigh size={16} />
              <span>{t('lowDataMode')}</span>
            </button>

            <Link
              to="/order"
              className="inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold text-black transition rounded-2xl bg-primary hover:bg-primaryDark"
            >
              <ShoppingCart size={16} />
              <span>
                {t('order')} ({totalItems})
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="glass-panel rounded-[1.75rem] border border-white/5 p-4 sm:p-5">
          <div className="flex items-center gap-3 px-4 py-3 border rounded-2xl border-white/10 bg-surfaceSoft">
            <Search size={18} className="text-textMuted" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('search')}
              className="w-full text-sm bg-transparent outline-none placeholder:text-textMuted"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4">
            <button
              type="button"
              onClick={() =>
                setPreferences(
                  saveCustomerPreferences({
                    fastingOnly: !preferences.fastingOnly,
                  })
                )
              }
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                preferences.fastingOnly
                  ? 'bg-primary text-black'
                  : 'border border-white/10 text-textMuted hover:text-textMain'
              }`}
            >
              <Leaf size={14} />
              <span>{t('fastingMode')}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                selectedCategory === 'all'
                  ? 'bg-primary text-black'
                  : 'border border-white/10 text-textMuted hover:text-textMain'
              }`}
            >
              {t('all')}
            </button>

            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(String(category.id))}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  selectedCategory === String(category.id)
                    ? 'bg-primary text-black'
                    : 'border border-white/10 text-textMuted hover:text-textMain'
                }`}
              >
                {formatCategoryLabel(category.name)}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-[1.75rem] border border-white/5 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-textMuted">
                {t('table')}
              </p>
              <h2 className="mt-2">{savedTable ? `#${savedTable}` : t('selectTablePrompt')}</h2>
            </div>
            <span className="px-3 py-1 text-xs font-semibold border rounded-full border-primary/30 bg-primary/10 text-primary">
              {savedTable ? t('editTable') : t('saveTable')}
            </span>
          </div>

          <p className="mt-3 text-sm text-textMuted">{t('selectTablePrompt')}</p>

          <div className="flex gap-3 mt-4">
            <input
              type="number"
              min="1"
              value={tableInput}
              onChange={(event) => setTableInputState(event.target.value)}
              placeholder="12"
              className="premium-input"
            />
            <button
              type="button"
              onClick={handleSaveTable}
              className="px-4 py-3 text-sm font-semibold text-black transition rounded-2xl bg-primary hover:bg-primaryDark"
            >
              {savedTable ? t('editTable') : t('saveTable')}
            </button>
          </div>

          <p className="mt-4 text-xs text-textMuted">
            {preferences.lowDataMode ? t('lowDataHelper') : t('cachedMenuReady')}
          </p>
        </div>
      </section>

      {usedCachedMenu ? (
        <div className="p-4 text-sm border glass-panel rounded-2xl border-sky-500/20 bg-sky-500/10 text-sky-100">
          Cached menu loaded because the live menu request was unavailable.
        </div>
      ) : null}

      {error ? (
        <div className="flex items-start gap-3 p-4 text-sm text-red-300 border glass-panel rounded-2xl border-red-500/20">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {loading ? (
        <MenuListSkeleton />
      ) : filteredCategories.length === 0 ? (
        <div className="glass-panel rounded-[2rem] p-12 text-center">
          <p className="text-lg font-semibold">{t('noItemsMatching')}</p>
          {search ? <p className="mt-2 text-textMuted">"{search}"</p> : null}
        </div>
      ) : (
        filteredCategories.map((category) => (
          <section key={category.id} className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-textMuted">
                  Category
                </p>
                <h2 className="mt-1">{formatCategoryLabel(category.name)}</h2>
                {category.metadata?.description_en ? (
                  <p className="mt-2 text-sm text-textMuted">
                    {language === 'am'
                      ? category.metadata.description_am
                      : category.metadata.description_en}
                  </p>
                ) : null}
              </div>
              <span className="px-3 py-1 text-xs font-semibold border rounded-full border-white/10 text-textMuted">
                {category.menuItems.length} {t('items')}
              </span>
            </div>

            <div className="bento-grid">
              {category.menuItems.map((item) => {
                const cartItem = cartItems.find((ci) => ci.id === item.id);
                const quantity = cartItem ? cartItem.quantity : 0;
                return (
                  <MenuCard
                    key={item.id}
                    item={item}
                    language={language}
                    lowDataMode={preferences.lowDataMode}
                    onAdd={handleAddItem}
                    onUpdateQuantity={handleUpdateQuantity}
                    quantity={quantity}
                    t={t}
                  />
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
