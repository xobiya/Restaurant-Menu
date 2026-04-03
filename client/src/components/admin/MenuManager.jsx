import { Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import SmartImage from '../common/SmartImage';
import api from '../../lib/api';

const emptyItemForm = {
  name: '',
  description: '',
  price: '',
  prep_time: '15',
  image_url: '',
  categoryId: '',
  is_available: true,
};

const getErrorMessage = (error, fallback) => error?.response?.data?.error || fallback;

export default function MenuManager() {
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyItemForm);
  const [editForm, setEditForm] = useState(emptyItemForm);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('Utensils');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState('');

  const loadMenu = async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [menuResponse, categoriesResponse] = await Promise.all([
        api.get('/menu/admin'),
        api.get('/menu/categories'),
      ]);

      const fetchedCategories = Array.isArray(categoriesResponse.data)
        ? categoriesResponse.data
        : [];

      setMenu(Array.isArray(menuResponse.data) ? menuResponse.data : []);
      setCategories(fetchedCategories);
      setForm((current) => ({
        ...current,
        categoryId: current.categoryId || String(fetchedCategories[0]?.id || ''),
      }));
      setError('');
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'Failed to load the menu manager.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    setSaving(true);

    try {
      await api.post('/menu/categories', {
        name: newCategoryName.trim(),
        icon: newCategoryIcon.trim() || 'Utensils',
      });
      setNewCategoryName('');
      setNewCategoryIcon('Utensils');
      await loadMenu({ silent: true });
    } catch (saveError) {
      setError(getErrorMessage(saveError, 'Failed to create category.'));
    } finally {
      setSaving(false);
    }
  };

  const handleCreateItem = async () => {
    setSaving(true);

    try {
      await api.post('/menu', {
        ...form,
        price: Number(form.price),
        prep_time: Number(form.prep_time),
        categoryId: Number(form.categoryId),
      });

      setForm({
        ...emptyItemForm,
        categoryId: String(categories[0]?.id || ''),
      });
      setShowCreateForm(false);
      await loadMenu({ silent: true });
    } catch (saveError) {
      setError(getErrorMessage(saveError, 'Failed to create menu item.'));
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (item) => {
    setEditingId(item.id);
    setEditForm({
      name: item.name,
      description: item.description,
      price: String(item.price),
      prep_time: String(item.prep_time),
      image_url: item.image_url,
      categoryId: String(item.categoryId),
      is_available: Boolean(item.is_available),
    });
  };

  const handleSaveEdit = async () => {
    setSaving(true);

    try {
      await api.patch(`/menu/${editingId}`, {
        ...editForm,
        price: Number(editForm.price),
        prep_time: Number(editForm.prep_time),
        categoryId: Number(editForm.categoryId),
      });
      setEditingId(null);
      await loadMenu({ silent: true });
    } catch (saveError) {
      setError(getErrorMessage(saveError, 'Failed to update menu item.'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      await api.patch(`/menu/${item.id}`, {
        is_available: !item.is_available,
      });
      await loadMenu({ silent: true });
    } catch (toggleError) {
      setError(getErrorMessage(toggleError, 'Failed to update item availability.'));
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Delete this item?')) return;

    try {
      await api.delete(`/menu/${itemId}`);
      await loadMenu({ silent: true });
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, 'Failed to delete item.'));
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2>Menu manager</h2>
          <p className="mt-1 text-sm text-textMuted">
            Create categories, publish new dishes, and keep availability accurate.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowCreateForm((current) => !current)}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-black transition hover:bg-primaryDark"
          >
            <Plus size={16} />
            <span>{showCreateForm ? 'Close form' : 'New item'}</span>
          </button>

          <button
            type="button"
            onClick={() => loadMenu({ silent: true })}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-textMuted transition hover:text-textMain"
          >
            {refreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <section className="rounded-[2rem] border border-white/5 bg-surface p-6">
        <div className="grid gap-3 lg:grid-cols-[1fr_0.6fr_0.3fr]">
          <input
            value={newCategoryName}
            onChange={(event) => setNewCategoryName(event.target.value)}
            placeholder="New category name"
            className="premium-input"
          />
          <input
            value={newCategoryIcon}
            onChange={(event) => setNewCategoryIcon(event.target.value)}
            placeholder="Lucide icon name"
            className="premium-input"
          />
          <button
            type="button"
            onClick={handleCreateCategory}
            disabled={saving}
            className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-textMain transition hover:bg-white/5 disabled:opacity-60"
          >
            Add category
          </button>
        </div>
      </section>

      {showCreateForm ? (
        <section className="rounded-[2rem] border border-white/5 bg-surface p-6">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Dish name"
              className="premium-input"
            />
            <input
              value={form.price}
              onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
              placeholder="Price"
              type="number"
              className="premium-input"
            />
            <input
              value={form.image_url}
              onChange={(event) =>
                setForm((current) => ({ ...current, image_url: event.target.value }))
              }
              placeholder="Image URL"
              className="premium-input md:col-span-2"
            />
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="Description"
              rows={3}
              className="premium-input md:col-span-2"
            />
            <input
              value={form.prep_time}
              onChange={(event) =>
                setForm((current) => ({ ...current, prep_time: event.target.value }))
              }
              placeholder="Prep time"
              type="number"
              className="premium-input"
            />
            <select
              value={form.categoryId}
              onChange={(event) =>
                setForm((current) => ({ ...current, categoryId: event.target.value }))
              }
              className="premium-input"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <label className="inline-flex items-center gap-2 text-sm text-textMuted md:col-span-2">
              <input
                type="checkbox"
                checked={form.is_available}
                onChange={(event) =>
                  setForm((current) => ({ ...current, is_available: event.target.checked }))
                }
              />
              <span>Available on the live menu</span>
            </label>
          </div>

          <button
            type="button"
            onClick={handleCreateItem}
            disabled={saving}
            className="mt-4 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-black transition hover:bg-primaryDark disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Create item'}
          </button>
        </section>
      ) : null}

      <div className="space-y-8">
        {menu.map((category) => (
          <section key={category.id} className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-textMuted">
                  Category
                </p>
                <h3 className="mt-1 text-xl font-bold">{category.name}</h3>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-textMuted">
                {category.menuItems.length} items
              </span>
            </div>

            {category.menuItems.length === 0 ? (
              <div className="rounded-[2rem] border border-white/5 bg-surface p-6 text-sm text-textMuted">
                No items in this category yet.
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {category.menuItems.map((item) => {
                  const isEditing = editingId === item.id;

                  return (
                    <article
                      key={item.id}
                      className="rounded-[2rem] border border-white/5 bg-surface p-5 shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
                    >
                      <div className="flex gap-4">
                        <SmartImage
                          src={item.image_url}
                          alt={item.name}
                          width={240}
                          sizes="96px"
                          className="h-24 w-24 rounded-2xl object-cover"
                        />

                        <div className="min-w-0 flex-1">
                          {isEditing ? (
                            <div className="space-y-2">
                              <input
                                value={editForm.name}
                                onChange={(event) =>
                                  setEditForm((current) => ({ ...current, name: event.target.value }))
                                }
                                className="premium-input"
                              />
                              <textarea
                                value={editForm.description}
                                onChange={(event) =>
                                  setEditForm((current) => ({
                                    ...current,
                                    description: event.target.value,
                                  }))
                                }
                                rows={3}
                                className="premium-input"
                              />
                              <div className="grid gap-2 sm:grid-cols-2">
                                <input
                                  value={editForm.price}
                                  onChange={(event) =>
                                    setEditForm((current) => ({
                                      ...current,
                                      price: event.target.value,
                                    }))
                                  }
                                  type="number"
                                  className="premium-input"
                                />
                                <input
                                  value={editForm.prep_time}
                                  onChange={(event) =>
                                    setEditForm((current) => ({
                                      ...current,
                                      prep_time: event.target.value,
                                    }))
                                  }
                                  type="number"
                                  className="premium-input"
                                />
                              </div>
                              <input
                                value={editForm.image_url}
                                onChange={(event) =>
                                  setEditForm((current) => ({
                                    ...current,
                                    image_url: event.target.value,
                                  }))
                                }
                                className="premium-input"
                              />
                              <select
                                value={editForm.categoryId}
                                onChange={(event) =>
                                  setEditForm((current) => ({
                                    ...current,
                                    categoryId: event.target.value,
                                  }))
                                }
                                className="premium-input"
                              >
                                {categories.map((menuCategory) => (
                                  <option key={menuCategory.id} value={menuCategory.id}>
                                    {menuCategory.name}
                                  </option>
                                ))}
                              </select>
                              <label className="inline-flex items-center gap-2 text-sm text-textMuted">
                                <input
                                  type="checkbox"
                                  checked={editForm.is_available}
                                  onChange={(event) =>
                                    setEditForm((current) => ({
                                      ...current,
                                      is_available: event.target.checked,
                                    }))
                                  }
                                />
                                <span>Available</span>
                              </label>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={handleSaveEdit}
                                  disabled={saving}
                                  className="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-black transition hover:bg-primaryDark disabled:opacity-60"
                                >
                                  Save changes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-textMuted transition hover:text-textMain"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h3 className="text-lg font-bold">{item.name}</h3>
                                  <p className="mt-1 text-sm text-textMuted">{item.description}</p>
                                </div>
                                <span
                                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                    item.is_available
                                      ? 'border-green-500/20 bg-green-500/10 text-green-200'
                                      : 'border-red-500/20 bg-red-500/10 text-red-200'
                                  }`}
                                >
                                  {item.is_available ? 'Available' : 'Hidden'}
                                </span>
                              </div>

                              <div className="mt-4 grid gap-2 text-sm text-textMuted sm:grid-cols-2">
                                <p>ETB {Number(item.price).toFixed(2)}</p>
                                <p>{item.prep_time} min prep</p>
                              </div>

                              <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => startEditing(item)}
                                  className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-textMain transition hover:bg-white/5"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleAvailability(item)}
                                  className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-textMain transition hover:bg-white/5"
                                >
                                  {item.is_available ? 'Hide item' : 'Show item'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(item.id)}
                                  className="inline-flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/15"
                                >
                                  <Trash2 size={16} />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
