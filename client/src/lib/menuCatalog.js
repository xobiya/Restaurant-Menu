const FALLBACK_CATEGORY_METADATA = {
  'Fasting Specials': {
    name_en: 'Fasting Specials',
    name_am: 'የጾም ምግቦች',
    description_en: 'Plant-based dishes for fasting days and lighter meals.',
    description_am: 'ለጾም ቀናት እና ለቀላል ምግብ የተስማሙ የእፅዋት ምግቦች።',
  },
  'Signature Wats': {
    name_en: 'Signature Wats',
    name_am: 'የቤቱ ወጦች',
    description_en: 'Slow-cooked stews served with fresh injera.',
    description_am: 'ከትኩስ እንጀራ ጋር የሚቀርቡ ቀስ ብለው የተበሉ ወጦች።',
  },
  'Tibs & Meat': {
    name_en: 'Tibs & Meat',
    name_am: 'ቲብስ እና ስጋ',
    description_en: 'Hot skillets, grilled meats, and hearty plates.',
    description_am: 'በሙቀት የሚቀርቡ ቲብሶች እና አስፈላጊ የስጋ ምግቦች።',
  },
  'Injera & Sides': {
    name_en: 'Injera & Sides',
    name_am: 'እንጀራ እና አጎኖች',
    description_en: 'Extra injera, salads, and shareable accompaniments.',
    description_am: 'ተጨማሪ እንጀራ፣ ሰላጣ እና አብሮ የሚቀርቡ አጎኖች።',
  },
  'Coffee & Drinks': {
    name_en: 'Coffee & Drinks',
    name_am: 'ቡና እና መጠጦች',
    description_en: 'Buna, fresh juice, and traditional drinks.',
    description_am: 'ቡና፣ አዲስ ጭማቂ እና ባህላዊ መጠጦች።',
  },
};

const fallbackSpiciness = (value) => {
  const number = Number(value);
  if (number >= 3) return 'hot';
  if (number >= 1) return 'medium';
  return 'mild';
};

const getCategoryMetadata = (category) =>
  FALLBACK_CATEGORY_METADATA[category.name] || {
    name_en: category.name_en || category.name || '',
    name_am: category.name_am || category.name || '',
    description_en: category.description_en || '',
    description_am: category.description_am || '',
  };

export const enrichMenuCategories = (categories = []) =>
  categories.map((category) => {
    const categoryMetadata = getCategoryMetadata(category);

    return {
      ...category,
      metadata: {
        name_en: category.name_en || categoryMetadata.name_en || category.name,
        name_am: category.name_am || categoryMetadata.name_am || category.name,
        description_en: category.description_en || categoryMetadata.description_en || '',
        description_am: category.description_am || categoryMetadata.description_am || '',
      },
      menuItems: (category.menuItems || []).map((item) => ({
        ...item,
        metadata: {
          name_en: item.name_en || item.name || '',
          name_am: item.name_am || item.name || '',
          description_en: item.description_en || item.description || '',
          description_am: item.description_am || item.description || '',
          portionNote_en: item.portion_note_en || '',
          portionNote_am: item.portion_note_am || '',
          spiciness: fallbackSpiciness(item.spiciness),
          isVeg: Boolean(item.is_veg),
          isFasting: Boolean(item.is_fasting),
        },
      })),
    };
  });
