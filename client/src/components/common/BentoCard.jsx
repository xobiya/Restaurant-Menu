import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';

export default function BentoCard({ item, isLarge }) {
  const addItem = useCartStore((state) => state.addItem);

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02 }}
      className={`glass-panel rounded-bento overflow-hidden relative group flex flex-col justify-between ${
        isLarge ? 'col-span-2 row-span-2 min-h-[250px]' : 'col-span-1 min-h-[160px]'
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none" />
      {item.image_url ? (
        <img
          src={item.image_url}
          alt={item.name}
          className="absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-500 group-hover:scale-110"
        />
      ) : (
        <div className="absolute inset-0 bg-primary/20 z-0" />
      )}

      {isLarge && (
        <div className="absolute top-4 left-4 z-20 bg-primary text-white text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm shadow-lg">
          Daily Special
        </div>
      )}

      <div className="z-20 p-4 mt-auto w-full flex flex-col justify-end h-full">
        <h3 className="font-semibold text-white drop-shadow-md text-lg truncate">
          {item.name}
        </h3>
        <div className="flex justify-between items-center mt-2 w-full">
          <p className="text-white/90 font-medium">ETB {item.price}</p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => addItem(item)}
            className="bg-primary/90 hover:bg-primary text-white p-2 rounded-full shadow-lg backdrop-blur-sm transition-colors cursor-pointer touch-manipulation z-30"
            aria-label={`Add ${item.name} to cart`}
          >
            <Plus size={isLarge ? 20 : 16} strokeWidth={1.5} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
