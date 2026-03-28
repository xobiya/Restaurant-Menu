import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, Check, X, Search, Filter } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

export default function AdminMenuManager() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', price: '', is_available: true });

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/menu`);
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (itemId, currentStatus) => {
    try {
      await axios.patch(`${API_BASE_URL}/menu/items/${itemId}`, { is_available: !currentStatus });
      fetchMenu(); // Refresh
    } catch (error) {
      console.error('Failed to update availability:', error);
    }
  };

  const deleteItem = async (itemId) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/menu/items/${itemId}`);
      fetchMenu(); // Refresh
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditForm({ name: item.name, price: item.price, is_available: item.is_available });
  };

  const saveEdit = async (itemId) => {
    try {
      await axios.patch(`${API_BASE_URL}/menu/items/${itemId}`, editForm);
      setEditingId(null);
      fetchMenu();
    } catch (error) {
      console.error('Failed to save edit:', error);
    }
  };

  if (loading) return <div className="p-8 text-center text-textMuted font-mono">Syncing Menu Data...</div>;

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Menu Manager</h2>
        <button className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-all shadow-lg shadow-primary/20">
          <Plus size={18} />
          <span className="text-sm font-semibold">New Item</span>
        </button>
      </div>

      <div className="space-y-8">
        {categories.map(category => (
          <div key={category.id} className="space-y-4">
             <div className="flex items-center space-x-3 text-textMuted text-sm font-bold uppercase tracking-wider">
                 <Filter size={14} />
                 <span>{category.name}</span>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {category.menuItems.map(item => (
                 <div key={item.id} className="glass-panel p-4 rounded-2xl border border-white/5 group hover:border-primary/30 transition-all flex items-start space-x-4">
                   <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                   </div>

                   <div className="flex-1 min-w-0">
                      {editingId === item.id ? (
                        <div className="space-y-2">
                           <input 
                             value={editForm.name} 
                             onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                             className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs w-full text-white"
                           />
                           <input 
                             type="number"
                             value={editForm.price} 
                             onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                             className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs w-full text-white"
                           />
                           <div className="flex space-x-2 mt-2">
                              <button onClick={() => saveEdit(item.id)} className="text-green-400 p-1 hover:bg-green-400/10 rounded"><Check size={16} /></button>
                              <button onClick={() => setEditingId(null)} className="text-red-400 p-1 hover:bg-red-400/10 rounded"><X size={16} /></button>
                           </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start">
                             <h4 className="font-bold text-white truncate text-sm">{item.name}</h4>
                             <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => startEdit(item)} className="p-1 hover:text-primary transition-colors"><Edit2 size={14} /></button>
                                <button onClick={() => deleteItem(item.id)} className="p-1 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                             </div>
                          </div>
                          <p className="text-xs text-textMuted mt-0.5">ETB {item.price}</p>
                          <div className="mt-3 flex items-center justify-between">
                             <span className={`text-[10px] font-bold uppercase transition-colors ${item.is_available ? 'text-green-400' : 'text-red-400'}`}>
                                {item.is_available ? 'In Stock' : 'Out of Stock'}
                             </span>
                             <button 
                                onClick={() => toggleAvailability(item.id, item.is_available)}
                                className={`w-8 h-4 rounded-full relative transition-colors ${item.is_available ? 'bg-primary' : 'bg-white/10'}`}
                             >
                                <div className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${item.is_available ? 'right-0.5' : 'left-0.5'}`} />
                             </button>
                          </div>
                        </>
                      )}
                   </div>
                 </div>
               ))}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
