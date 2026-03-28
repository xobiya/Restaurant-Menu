import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import BentoCard from '../../components/common/BentoCard';
import { Search } from 'lucide-react';

export default function MenuView() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    // ... data fetching as before ...
    const mockData = [
      { id: 1, name: 'Daily Specials', menuItems: [ { id: 101, name: 'Wagyu Burger Combo', price: 550, image_url: '...' } ] },
      { id: 2, name: 'Beverages', menuItems: [ { id: 102, name: 'Iced Latte', price: 150, image_url: '...' }, { id: 103, name: 'Mango Juice', price: 120, image_url: '...' } ] }
    ];
    setCategories(mockData);
    setLoading(false);
  }, []);

  const filteredCategories = categories.map(cat => ({
    ...cat,
    menuItems: cat.menuItems.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (activeCategory === 'All' || cat.name === activeCategory)
    )
  })).filter(cat => cat.menuItems.length > 0);

  return (
    <motion.div className="pt-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Menu</h1>
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

      {/* Category Filter Pills */}
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
           {[...Array(5)].map((_, i) => <div key={i} className="..." />)}
        </div>
      ) : (
        <div className="pb-24">
          {filteredCategories.length > 0 ? filteredCategories.map((cat) => (
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
          )) : (
            <div className="py-20 text-center text-textMuted">No items found matching "{searchQuery}"</div>
          )}
        </div>
      )}
    </motion.div>
  );
}
