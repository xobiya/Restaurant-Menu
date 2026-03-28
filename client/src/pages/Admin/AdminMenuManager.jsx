import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';

export default function AdminMenuManager() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    // Mock data for menu management
    const mockItems = [
      { id: 1, name: 'Wagyu Burger', category: 'Main', price: 550, is_available: true },
      { id: 2, name: 'Truffle Fries', category: 'Sides', price: 180, is_available: false },
      { id: 3, name: 'Iced Latte', category: 'Drinks', price: 150, is_available: true },
    ];
    setItems(mockItems);
  }, []);

  const toggleAvailability = (id) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, is_available: !item.is_available } : item
    ));
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center bg-white/5 p-6 rounded-2xl border border-white/5">
        <div>
          <h2 className="text-2xl font-bold">Menu Manager</h2>
          <p className="text-textMuted text-sm">Add/Remove or update menu availability</p>
        </div>
        <button className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-all shadow-lg shadow-primary/25">
          <Plus size={18} />
          <span className="font-semibold text-sm">New Item</span>
        </button>
      </div>

      <div className="glass-panel overflow-hidden border border-white/5 rounded-2xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-textMuted uppercase text-[10px] font-bold tracking-widest border-b border-white/10">
            <tr>
              <th className="px-6 py-4">Item Name</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Price (ETB)</th>
              <th className="px-6 py-4">Available</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-white/5 transition-all">
                <td className="px-6 py-4 font-bold flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-xs">🍔</div>
                    <span>{item.name}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-white/10 px-2 py-1 rounded text-[10px] font-bold uppercase">{item.category}</span>
                </td>
                <td className="px-6 py-4 font-mono font-semibold">{item.price}</td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => toggleAvailability(item.id)}
                    className={`flex items-center space-x-2 px-2 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                        item.is_available ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                    }`}
                  >
                    {item.is_available ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    <span>{item.is_available ? 'Active' : 'Unavailable'}</span>
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-3">
                        <button className="text-textMuted hover:text-white transition-colors">
                            <Edit2 size={16} />
                        </button>
                        <button className="text-red-500/50 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
