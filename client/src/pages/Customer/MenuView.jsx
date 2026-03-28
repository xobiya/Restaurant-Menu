import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import BentoCard from '../../components/common/BentoCard';
import { Search } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

export default function MenuView() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/menu`);
        setCategories(response.data);
      } catch (error) {
        console.error('Failed to fetch menu:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  const filteredCategories = categories.map(cat => ({
    ...cat,
    menuItems: cat.menuItems.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (activeCategory === 'All' || cat.name === activeCategory)
    )
  })).filter(cat => cat.menuItems.length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="pt-6 px-4"
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Menu</h1>
          <p className="text-textMuted mt-1 text-sm">Table {localStorage.getItem('table_number') || '1'}</p>
        </div>
        <div className="relative group">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
          <input 
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-surface rounded-full border border-white/10 text-sm focus:outline-none focus:border-primary w-[140px] focus:w-[200px] transition-all"
          />
        </div>
      </div>

      <div className="flex space-x-2 overflow-x-auto pb-4 no-scrollbar mb-4">
        <button 
          onClick={() => setActiveCategory('All')}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
            activeCategory === 'All' ? 'bg-primary text-white border-transparent' : 'bg-surface text-textMuted border-white/5'
          }`}
        >
          All
        </button>
        {categories.map(cat => (
          <button 
            key={cat.id}
            onClick={() => setActiveCategory(cat.name)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
              activeCategory === cat.name ? 'bg-primary text-white border-transparent' : 'bg-surface text-textMuted border-white/5'
            }`}
          >
            {cat.name}
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
        <div className="pb-24">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((cat) => (
              <div key={cat.id} className="mb-8">
                <h2 className="text-xl font-semibold mb-4 opacity-90">{cat.name}</h2>
                <div className="bento-grid">
                  {cat.menuItems.map((item, index) => (
                    <BentoCard 
                       key={item.id} 
                       item={item} 
                       isLarge={cat.name === 'Daily Specials' && index === 0} 
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center text-textMuted">
              No items found matching "{searchQuery}"
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
