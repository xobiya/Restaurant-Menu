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

function MenuCard({ item, language, lowDataMode, onAdd, t }) {
  const localizedName = language === 'am' ? item.metadata.name_am : item.metadata.name_en;
  const localizedDescription =
    language === 'am' ? item.metadata.description_am : item.metadata.description_en;
  const portionNote =
    language === 'am' ? item.metadata.portionNote_am : item.metadata.portionNote_en;

  return (
    <article className="glass-panel overflow-hidden rounded-bento border border-white/5">
      <SmartImage
        src={item.image_url}
        alt={localizedName}
        width={lowDataMode ? 280 : 520}
        sizes="(min-width: 1024px) 22vw, (min-width: 640px) 38vw, 92vw"
        className="h-44 w-full object-cover"
      />

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold">{localizedName}</h3>
            <p className="mt-1 text-sm text-textMuted">{localizedDescription}</p>
          </div>
          <span className="whitespace-nowrap rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
            {formatCurrency(item.price, language)}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${spiceTone(item.metadata.spiciness)}`}>
            <Flame size={12} />
            <span>{t(`spice${item.metadata.spiciness[0].toUpperCase()}${item.metadata.spiciness.slice(1)}`)}</span>
          </span>

          {item.metadata.isVeg ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100">
              <Leaf size={12} />
              <span>{t('vegetarian')}</span>
            </span>
          ) : null}

          {item.metadata.isFasting ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Leaf size={12} />
              <span>{t('fastingFriendly')}</span>
            </span>
          ) : null}
        </div>

        {portionNote ? (
          <p className="text-xs text-textMuted">
            <span className="font-semibold text-textMain">{t('portionNote')}: </span>
            {portionNote}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-textMuted">
            <Clock3 size={14} />
            <span>
              {item.prep_time} {t('mins')}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onAdd(item)}
            className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-black transition hover:bg-primaryDark"
          >
            {t('add')}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function MenuView() {
  const { language, setLanguage, t, formatCategoryLabel } = useLocale();
  const addItem = useCartStore((state) => state.addItem);
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

  const toggleLowData = () => {
    setPreferences(
      saveCustomerPreferences({
        lowDataMode: !preferences.lowDataMode,
      })
    );
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 pb-28 pt-6 sm:px-6 lg:px-8">
      <section className="glass-panel overflow-hidden rounded-[2rem] border border-white/10 p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">
              {t('featuredToday')}
            </p>
            <h1 className="mt-3">Ethiopian dishes prepared for fast table-side ordering.</h1>
            <p className="mt-3 max-w-xl text-sm text-textMuted sm:text-base">
              Browse signature wats, tibs, fasting plates, buna, and sides with a bilingual,
              low-friction menu built for Ethiopian restaurant service.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-2xl border border-white/10 bg-surfaceSoft p-1">
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
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-black transition hover:bg-primaryDark"
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
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-surfaceSoft px-4 py-3">
            <Search size={18} className="text-textMuted" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('search')}
              className="w-full bg-transparent text-sm outline-none placeholder:text-textMuted"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
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
            <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {savedTable ? t('editTable') : t('saveTable')}
            </span>
          </div>

          <p className="mt-3 text-sm text-textMuted">{t('selectTablePrompt')}</p>

          <div className="mt-4 flex gap-3">
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
              className="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-black transition hover:bg-primaryDark"
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
        <div className="glass-panel rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4 text-sm text-sky-100">
          Cached menu loaded because the live menu request was unavailable.
        </div>
      ) : null}

      {error ? (
        <div className="glass-panel flex items-start gap-3 rounded-2xl border border-red-500/20 p-4 text-sm text-red-300">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {loading ? (
        <div className="glass-panel flex items-center justify-center gap-3 rounded-[2rem] p-12 text-textMuted">
          <Loader2 className="animate-spin" />
          <span>Loading menu...</span>
        </div>
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
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-textMuted">
                {category.menuItems.length} {t('items')}
              </span>
            </div>

            <div className="bento-grid">
              {category.menuItems.map((item) => (
                <MenuCard
                  key={item.id}
                  item={item}
                  language={language}
                  lowDataMode={preferences.lowDataMode}
                  onAdd={handleAddItem}
                  t={t}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
