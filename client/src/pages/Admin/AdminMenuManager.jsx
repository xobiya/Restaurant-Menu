import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, Filter } from 'lucide-react';
import api from '../../lib/api';
import FastImage from '../../components/common/FastImage';

const emptyNewItem = {
  name: '',
  description: '',
  price: '',
  image_url: '',
  prep_time: 15,
  categoryId: '',
  is_available: true,
};

export default function AdminMenuManager() {
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyNewItem);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    price: '',
    prep_time: 15,
    image_url: '',
    categoryId: '',
    is_available: true,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMenu();
    fetchCategories();
  }, []);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const response = await api.get('/menu/admin');
      setCategories(response.data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch menu:', err);
      setError(err?.response?.data?.error || 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/menu/categories');
      setAllCategories(response.data);
      if (!createForm.categoryId && response.data.length > 0) {
        setCreateForm((prev) => ({ ...prev, categoryId: String(response.data[0].id) }));
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const toggleAvailability = async (itemId, currentStatus) => {
    try {
      await api.patch(`/menu/${itemId}`, { is_available: !currentStatus });
      fetchMenu();
    } catch (err) {
      console.error('Failed to update availability:', err);
      setError(err?.response?.data?.error || 'Failed to update availability');
    }
  };

  const deleteItem = async (itemId) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await api.delete(`/menu/${itemId}`);
      fetchMenu();
    } catch (err) {
      console.error('Failed to delete item:', err);
      setError(err?.response?.data?.error || 'Failed to delete item');
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditForm({
      name: item.name,
      description: item.description,
      price: item.price,
      prep_time: item.prep_time,
      image_url: item.image_url,
      categoryId: String(item.categoryId),
      is_available: item.is_available,
    });
  };

  const saveEdit = async (itemId) => {
    try {
      await api.patch(`/menu/${itemId}`, {
        ...editForm,
        price: Number(editForm.price),
        prep_time: Number(editForm.prep_time),
        categoryId: Number(editForm.categoryId),
      });
      setEditingId(null);
      fetchMenu();
    } catch (err) {
      console.error('Failed to save edit:', err);
      setError(err?.response?.data?.error || 'Failed to update item');
    }
  };

  const createItem = async () => {
    if (!createForm.name || !createForm.description || !createForm.price || !createForm.image_url || !createForm.categoryId) {
      setError('Fill all required fields for new item.');
      return;
    }

    setCreating(true);
    try {
      await api.post('/menu', {
        ...createForm,
        price: Number(createForm.price),
        prep_time: Number(createForm.prep_time),
        categoryId: Number(createForm.categoryId),
      });
      setCreateForm({
        ...emptyNewItem,
        categoryId: allCategories[0] ? String(allCategories[0].id) : '',
      });
      setShowCreate(false);
      setError('');
      fetchMenu();
    } catch (err) {
      console.error('Failed to create item:', err);
      setError(err?.response?.data?.error || 'Failed to create item');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-textMuted font-mono">Syncing Menu Data...</div>;

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Menu Manager</h2>
        <button
          onClick={() => setShowCreate((prev) => !prev)}
          className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-all shadow-lg shadow-primary/20"
        >
          <Plus size={18} />
          <span className="text-sm font-semibold">{showCreate ? 'Close Form' : 'New Item'}</span>
        </button>
      </div>

      {error && <div className="glass-panel rounded-xl p-3 text-sm text-red-400">{error}</div>}

      {showCreate && (
        <div className="glass-panel rounded-2xl p-4 border border-white/10 grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            placeholder="Name"
            value={createForm.name}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
            className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
          />
          <input
            placeholder="Price"
            type="number"
            value={createForm.price}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, price: e.target.value }))}
            className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
          />
          <input
            placeholder="Image URL"
            value={createForm.image_url}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, image_url: e.target.value }))}
            className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm md:col-span-2"
          />
          <textarea
            placeholder="Description"
            value={createForm.description}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
            className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm md:col-span-2"
            rows={2}
          />
          <input
            placeholder="Prep Time (minutes)"
            type="number"
            value={createForm.prep_time}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, prep_time: e.target.value }))}
            className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
          />
          <select
            value={createForm.categoryId}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, categoryId: e.target.value }))}
            className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
          >
            {allCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <label className="inline-flex items-center space-x-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={createForm.is_available}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, is_available: e.target.checked }))}
            />
            <span>Available</span>
          </label>
          <button
            onClick={createItem}
            disabled={creating}
            className="md:col-span-2 bg-primary hover:bg-primary/80 disabled:opacity-60 rounded-xl py-2 font-semibold"
          >
            {creating ? 'Creating...' : 'Create Item'}
          </button>
        </div>
      )}

      <div className="space-y-8">
        {categories.map((category) => (
          <div key={category.id} className="space-y-4">
            <div className="flex items-center space-x-3 text-textMuted text-sm font-bold uppercase tracking-wider">
              <Filter size={14} />
              <span>{category.name}</span>
            </div>

            {category.menuItems.length === 0 ? (
              <div className="text-sm text-textMuted px-1">No items in this category yet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.menuItems.map((item) => (
                  <div
                    key={item.id}
                    className="glass-panel p-4 rounded-2xl border border-white/5 group hover:border-primary/30 transition-all flex items-start space-x-4"
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
                      <FastImage src={item.image_url} alt={item.name} width={240} sizes="64px" className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-1 min-w-0">
                      {editingId === item.id ? (
                        <div className="space-y-2">
                          <input
                            value={editForm.name}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                            className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs w-full text-white"
                          />
                          <textarea
                            value={editForm.description}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                            className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs w-full text-white"
                            rows={2}
                          />
                          <input
                            type="number"
                            value={editForm.price}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, price: e.target.value }))}
                            className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs w-full text-white"
                          />
                          <input
                            type="number"
                            value={editForm.prep_time}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, prep_time: e.target.value }))}
                            className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs w-full text-white"
                          />
                          <input
                            value={editForm.image_url}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, image_url: e.target.value }))}
                            className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs w-full text-white"
                            placeholder="Image URL"
                          />
                          <select
                            value={editForm.categoryId}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                            className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs w-full text-white"
                          >
                            {allCategories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                          <label className="inline-flex items-center space-x-2 text-xs">
                            <input
                              type="checkbox"
                              checked={editForm.is_available}
                              onChange={(e) =>
                                setEditForm((prev) => ({ ...prev, is_available: e.target.checked }))
                              }
                            />
                            <span>Available</span>
                          </label>
                          <div className="flex space-x-2 mt-2">
                            <button
                              onClick={() => saveEdit(item.id)}
                              className="text-green-400 p-1 hover:bg-green-400/10 rounded"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-red-400 p-1 hover:bg-red-400/10 rounded"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-white truncate text-sm">{item.name}</h4>
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => startEdit(item)} className="p-1 hover:text-primary transition-colors">
                                <Edit2 size={14} />
                              </button>
                              <button onClick={() => deleteItem(item.id)} className="p-1 hover:text-red-400 transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-textMuted mt-0.5">ETB {item.price}</p>
                          <p className="text-xs text-textMuted mt-1 truncate">{item.description}</p>
                          <p className="text-[10px] uppercase tracking-wider text-textMuted mt-2">
                            Prep: {item.prep_time} min
                          </p>
                          <div className="mt-3 flex items-center justify-between">
                            <span
                              className={`text-[10px] font-bold uppercase transition-colors ${
                                item.is_available ? 'text-green-400' : 'text-red-400'
                              }`}
                            >
                              {item.is_available ? 'In Stock' : 'Out of Stock'}
                            </span>
                            <button
                              onClick={() => toggleAvailability(item.id, item.is_available)}
                              className={`w-8 h-4 rounded-full relative transition-colors ${
                                item.is_available ? 'bg-primary' : 'bg-white/10'
                              }`}
                            >
                              <div
                                className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${
                                  item.is_available ? 'right-0.5' : 'left-0.5'
                                }`}
                              />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
