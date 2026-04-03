import { Edit3, Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import SmartImage from '../common/SmartImage';
import api from '../../lib/api';
import { formatCurrency } from '../../lib/formatters';

const emptyCategoryForm = {
  name_en: '',
  name_am: '',
  description_en: '',
  description_am: '',
  icon: 'Utensils',
  sort_order: '0',
};

const emptyItemForm = {
  name_en: '',
  name_am: '',
  description_en: '',
  description_am: '',
  portion_note_en: '',
  portion_note_am: '',
  price_etb: '',
  prep_time: '15',
  image_url: '',
  categoryId: '',
  is_available: true,
  is_fasting: false,
  is_veg: false,
  featured: false,
  spiciness: '0',
};

const getErrorMessage = (error, fallback) => error?.response?.data?.error || fallback;

function CategoryForm({ value, onChange, onSubmit, submitting, editing }) {
  return (
    <div className="rounded-[2rem] border border-white/5 bg-surface p-5 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-textMuted">
            Categories
          </p>
          <h2 className="mt-2">{editing ? 'Edit category' : 'Create category'}</h2>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <input
          value={value.name_en}
          onChange={(event) => onChange('name_en', event.target.value)}
          className="premium-input"
          placeholder="English name"
        />
        <input
          value={value.name_am}
          onChange={(event) => onChange('name_am', event.target.value)}
          className="premium-input"
          placeholder="የአማርኛ ስም"
        />
        <textarea
          value={value.description_en}
          onChange={(event) => onChange('description_en', event.target.value)}
          className="premium-input min-h-24"
          placeholder="English description"
        />
        <textarea
          value={value.description_am}
          onChange={(event) => onChange('description_am', event.target.value)}
          className="premium-input min-h-24"
          placeholder="የአማርኛ መግለጫ"
        />
        <input
          value={value.icon}
          onChange={(event) => onChange('icon', event.target.value)}
          className="premium-input"
          placeholder="Lucide icon name"
        />
        <input
          type="number"
          min="0"
          value={value.sort_order}
          onChange={(event) => onChange('sort_order', event.target.value)}
          className="premium-input"
          placeholder="Sort order"
        />
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-black transition hover:bg-primaryDark disabled:opacity-60"
      >
        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
        <span>{editing ? 'Save category' : 'Add category'}</span>
      </button>
    </div>
  );
}

function ItemForm({ categories, value, onChange, onSubmit, submitting, editing }) {
  return (
    <div className="rounded-[2rem] border border-white/5 bg-surface p-5 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-textMuted">
          Menu item
        </p>
        <h2 className="mt-2">{editing ? 'Edit dish' : 'Add a new dish'}</h2>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <input
          value={value.name_en}
          onChange={(event) => onChange('name_en', event.target.value)}
          className="premium-input"
          placeholder="English name"
        />
        <input
          value={value.name_am}
          onChange={(event) => onChange('name_am', event.target.value)}
          className="premium-input"
          placeholder="የአማርኛ ስም"
        />
        <textarea
          value={value.description_en}
          onChange={(event) => onChange('description_en', event.target.value)}
          className="premium-input min-h-24"
          placeholder="English description"
        />
        <textarea
          value={value.description_am}
          onChange={(event) => onChange('description_am', event.target.value)}
          className="premium-input min-h-24"
          placeholder="የአማርኛ መግለጫ"
        />
        <input
          value={value.portion_note_en}
          onChange={(event) => onChange('portion_note_en', event.target.value)}
          className="premium-input"
          placeholder="Serving note (EN)"
        />
        <input
          value={value.portion_note_am}
          onChange={(event) => onChange('portion_note_am', event.target.value)}
          className="premium-input"
          placeholder="የማቅረቢያ ማስታወሻ"
        />
        <input
          type="number"
          min="1"
          step="0.01"
          value={value.price_etb}
          onChange={(event) => onChange('price_etb', event.target.value)}
          className="premium-input"
          placeholder="Price (ETB)"
        />
        <input
          type="number"
          min="1"
          value={value.prep_time}
          onChange={(event) => onChange('prep_time', event.target.value)}
          className="premium-input"
          placeholder="Prep time"
        />
        <input
          value={value.image_url}
          onChange={(event) => onChange('image_url', event.target.value)}
          className="premium-input lg:col-span-2"
          placeholder="Image URL"
        />
        <select
          value={value.categoryId}
          onChange={(event) => onChange('categoryId', event.target.value)}
          className="premium-input"
        >
          <option value="">Select category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name_en || category.name}
            </option>
          ))}
        </select>
        <select
          value={value.spiciness}
          onChange={(event) => onChange('spiciness', event.target.value)}
          className="premium-input"
        >
          <option value="0">Spiciness 0 - Mild</option>
          <option value="1">Spiciness 1</option>
          <option value="2">Spiciness 2</option>
          <option value="3">Spiciness 3 - Hot</option>
        </select>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-sm text-textMuted">
        {[
          ['is_available', 'Available now'],
          ['is_fasting', 'Fasting friendly'],
          ['is_veg', 'Vegetarian'],
          ['featured', 'Featured'],
        ].map(([key, label]) => (
          <label key={key} className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={value[key]}
              onChange={(event) => onChange(key, event.target.checked)}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-black transition hover:bg-primaryDark disabled:opacity-60"
      >
        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
        <span>{editing ? 'Save dish' : 'Add dish'}</span>
      </button>
    </div>
  );
}

export default function MenuManager() {
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [itemForm, setItemForm] = useState(emptyItemForm);

  const loadMenu = async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [menuResponse, categoryResponse] = await Promise.all([
        api.get('/menu/admin'),
        api.get('/menu/categories'),
      ]);

      const nextCategories = Array.isArray(categoryResponse.data) ? categoryResponse.data : [];
      setMenu(Array.isArray(menuResponse.data) ? menuResponse.data : []);
      setCategories(nextCategories);
      setItemForm((current) => ({
        ...current,
        categoryId: current.categoryId || String(nextCategories[0]?.id || ''),
      }));
      setError('');
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'Failed to load menu data.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  const updateCategoryForm = (key, value) =>
    setCategoryForm((current) => ({
      ...current,
      [key]: value,
    }));

  const updateItemForm = (key, value) =>
    setItemForm((current) => ({
      ...current,
      [key]: value,
    }));

  const resetCategoryForm = () => {
    setEditingCategoryId(null);
    setCategoryForm(emptyCategoryForm);
  };

  const resetItemForm = () => {
    setEditingItemId(null);
    setItemForm({
      ...emptyItemForm,
      categoryId: String(categories[0]?.id || ''),
    });
  };

  const handleSaveCategory = async () => {
    setSaving(true);

    try {
      const payload = {
        ...categoryForm,
        sort_order: Number(categoryForm.sort_order || 0),
      };

      if (editingCategoryId) {
        await api.patch(`/menu/categories/${editingCategoryId}`, payload);
      } else {
        await api.post('/menu/categories', payload);
      }

      resetCategoryForm();
      await loadMenu({ silent: true });
    } catch (saveError) {
      setError(getErrorMessage(saveError, 'Failed to save category.'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveItem = async () => {
    setSaving(true);

    try {
      const payload = {
        ...itemForm,
        price_etb: Number(itemForm.price_etb),
        prep_time: Number(itemForm.prep_time),
        categoryId: Number(itemForm.categoryId),
        spiciness: Number(itemForm.spiciness),
      };

      if (editingItemId) {
        await api.patch(`/menu/${editingItemId}`, payload);
      } else {
        await api.post('/menu/items', payload);
      }

      resetItemForm();
      await loadMenu({ silent: true });
    } catch (saveError) {
      setError(getErrorMessage(saveError, 'Failed to save dish.'));
    } finally {
      setSaving(false);
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategoryId(category.id);
    setCategoryForm({
      name_en: category.name_en || '',
      name_am: category.name_am || '',
      description_en: category.description_en || '',
      description_am: category.description_am || '',
      icon: category.icon || 'Utensils',
      sort_order: String(category.sort_order ?? 0),
    });
  };

  const handleEditItem = (item) => {
    setEditingItemId(item.id);
    setItemForm({
      name_en: item.name_en || '',
      name_am: item.name_am || '',
      description_en: item.description_en || '',
      description_am: item.description_am || '',
      portion_note_en: item.portion_note_en || '',
      portion_note_am: item.portion_note_am || '',
      price_etb: String(item.price_etb ?? item.price ?? ''),
      prep_time: String(item.prep_time ?? 15),
      image_url: item.image_url || '',
      categoryId: String(item.categoryId || ''),
      is_available: Boolean(item.is_available),
      is_fasting: Boolean(item.is_fasting),
      is_veg: Boolean(item.is_veg),
      featured: Boolean(item.featured),
      spiciness: String(item.spiciness ?? 0),
    });
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Delete this category? It must be empty first.')) return;

    try {
      await api.delete(`/menu/categories/${categoryId}`);
      if (editingCategoryId === categoryId) {
        resetCategoryForm();
      }
      await loadMenu({ silent: true });
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, 'Failed to delete category.'));
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Delete this dish?')) return;

    try {
      await api.delete(`/menu/${itemId}`);
      if (editingItemId === itemId) {
        resetItemForm();
      }
      await loadMenu({ silent: true });
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, 'Failed to delete item.'));
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      await api.patch(`/menu/${item.id}`, {
        is_available: !item.is_available,
      });
      await loadMenu({ silent: true });
    } catch (toggleError) {
      setError(getErrorMessage(toggleError, 'Failed to update availability.'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-[2rem] border border-white/5 bg-surface p-12 text-textMuted">
        <Loader2 className="animate-spin" />
        <span>Loading menu manager...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2>Menu management</h2>
          <p className="mt-1 text-sm text-textMuted">
            Manage bilingual categories, featured dishes, fasting flags, and live availability.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadMenu({ silent: true })}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-textMuted transition hover:text-textMain"
        >
          {refreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          <span>Refresh</span>
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <CategoryForm
          value={categoryForm}
          onChange={updateCategoryForm}
          onSubmit={handleSaveCategory}
          submitting={saving}
          editing={Boolean(editingCategoryId)}
        />

        <ItemForm
          categories={categories}
          value={itemForm}
          onChange={updateItemForm}
          onSubmit={handleSaveItem}
          submitting={saving}
          editing={Boolean(editingItemId)}
        />
      </div>

      <section className="rounded-[2rem] border border-white/5 bg-surface p-5 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-textMuted">
              Categories
            </p>
            <h2 className="mt-2">Current category list</h2>
          </div>
          {editingCategoryId ? (
            <button
              type="button"
              onClick={resetCategoryForm}
              className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-textMain transition hover:bg-white/5"
            >
              Cancel edit
            </button>
          ) : null}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <article key={category.id} className="rounded-[1.5rem] border border-white/10 bg-surfaceSoft p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{category.name_en || category.name}</p>
                  <p className="mt-1 text-sm text-textMuted">{category.name_am}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditCategory(category)}
                    className="rounded-xl border border-white/10 p-2 text-textMuted transition hover:text-textMain"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(category.id)}
                    className="rounded-xl border border-white/10 p-2 text-textMuted transition hover:text-red-300"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="mt-3 text-sm text-textMuted">{category.description_en || 'No description yet.'}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="space-y-5">
        {menu.map((category) => (
          <section
            key={category.id}
            className="rounded-[2rem] border border-white/5 bg-surface p-5 shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-textMuted">
                  {category.name_am}
                </p>
                <h2 className="mt-2">{category.name_en || category.name}</h2>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-textMuted">
                {(category.menuItems || []).length} dishes
              </span>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {(category.menuItems || []).map((item) => (
                <article
                  key={item.id}
                  className="flex gap-4 rounded-[1.5rem] border border-white/10 bg-surfaceSoft p-4"
                >
                  <SmartImage
                    src={item.image_url}
                    alt={item.name_en || item.name}
                    width={240}
                    sizes="120px"
                    className="h-28 w-28 rounded-2xl object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{item.name_en || item.name}</p>
                        <p className="mt-1 text-sm text-textMuted">{item.name_am}</p>
                      </div>
                      <p className="text-sm font-semibold text-primary">
                        {formatCurrency(item.price_etb ?? item.price)}
                      </p>
                    </div>

                    <p className="mt-3 text-sm text-textMuted line-clamp-3">
                      {item.description_en || item.description}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-textMuted">
                      <span className="rounded-full border border-white/10 px-3 py-1">
                        {item.prep_time} mins
                      </span>
                      <span className="rounded-full border border-white/10 px-3 py-1">
                        Spice {item.spiciness}
                      </span>
                      {item.is_fasting ? (
                        <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary">
                          Fasting
                        </span>
                      ) : null}
                      {item.is_veg ? (
                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-200">
                          Veg
                        </span>
                      ) : null}
                      {item.featured ? (
                        <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-sky-200">
                          Featured
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditItem(item)}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-textMain transition hover:bg-white/5"
                      >
                        <Edit3 size={14} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleAvailability(item)}
                        className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-textMain transition hover:bg-white/5"
                      >
                        {item.is_available ? 'Set unavailable' : 'Set available'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-500/15"
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
