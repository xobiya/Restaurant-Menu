import { motion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import FastImage from './FastImage';
import { useLocale } from '../../lib/locale';

export default function BentoCard({
  item,
  isLarge,
  fastMode = false,
  selectedQuantity = 0,
  onIncrease,
  onDecrease,
}) {
  const { t, language } = useLocale();
  const addItem = useCartStore((state) => state.addItem);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`glass-panel rounded-bento overflow-hidden relative flex flex-col ${
        isLarge ? 'col-span-2 min-h-[250px]' : 'min-h-[210px]'
      }`}
    >
      {item.image_url ? (
        <FastImage
          src={item.image_url}
          alt={item.name}
          priority={isLarge}
          width={isLarge ? 1100 : 720}
          sizes={isLarge ? '(max-width: 768px) 100vw, 70vw' : '(max-width: 768px) 50vw, 33vw'}
          className="w-full h-28 object-cover"
        />
      ) : (
        <div className="w-full h-28 bg-surfaceSoft" />
      )}

      <div className="p-3.5 flex-1 flex flex-col">
        <h3 className="font-bold text-sm text-textMain mb-1 truncate">{item.name}</h3>
        <p className="text-xs text-textMuted mb-3 min-h-[32px]">{item.description}</p>

        <div className="mt-auto flex items-center justify-between">
          <p className="font-bold text-primary">ETB {item.price}</p>

          {fastMode ? (
            <div className="rounded-full border border-white/15 bg-surfaceSoft p-1 flex items-center gap-1">
              <button
                onClick={() => onDecrease?.(item)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10"
                aria-label={language === 'am' ? `${item.name} ቀንስ` : `Decrease ${item.name}`}
              >
                <Minus size={14} />
              </button>
              <span className="w-6 text-center text-sm font-bold">{selectedQuantity}</span>
              <button
                onClick={() => onIncrease?.(item)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 text-primary"
                aria-label={language === 'am' ? `${item.name} ጨምር` : `Increase ${item.name}`}
              >
                <Plus size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => addItem(item)}
              className="h-9 px-3 rounded-lg bg-primary text-black text-sm font-bold hover:bg-primaryDark transition-colors"
              aria-label={language === 'am' ? `${item.name} ወደ ትዕዛዝ ጨምር` : `Add ${item.name} to order`}
            >
              {t('add')}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
