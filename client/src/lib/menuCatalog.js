const CATEGORY_METADATA = {
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

const ITEM_METADATA = {
  'Shiro Firfir': {
    name_am: 'ሽሮ ፍርፍር',
    name_en: 'Shiro Firfir',
    description_am: 'በቅመም የተቀላቀለ ሽሮ በተቆረጠ እንጀራ የሚቀርብ።',
    description_en: 'Seasoned chickpea stew folded into torn injera for a quick, comforting plate.',
    portionNote_am: 'በለስላሳ እንጀራ ይቀርባል።',
    portionNote_en: 'Served with soft injera.',
    spiciness: 'medium',
    isVeg: true,
    isFasting: true,
  },
  'Beyaynetu Platter': {
    name_am: 'በያይነቱ',
    name_en: 'Beyaynetu Platter',
    description_am: 'ሽሮ፣ ጎመን፣ ምስር እና ሌሎች የጾም አቀራረቦች በአንድ ገበታ።',
    description_en: 'A fasting platter with shiro, lentils, greens, and mixed vegetables on one tray.',
    portionNote_am: 'ለመካፈል ተስማሚ።',
    portionNote_en: 'Excellent for sharing.',
    spiciness: 'mild',
    isVeg: true,
    isFasting: true,
  },
  'Misir Wat': {
    name_am: 'ምስር ወጥ',
    name_en: 'Misir Wat',
    description_am: 'በበርበሬ የተቀቀለ ቀይ ምስር ወጥ።',
    description_en: 'Red lentils simmered with berbere and onions into a rich fasting stew.',
    portionNote_am: 'በእንጀራ ይቀርባል።',
    portionNote_en: 'Served with injera.',
    spiciness: 'hot',
    isVeg: true,
    isFasting: true,
  },
  'Doro Wat': {
    name_am: 'ዶሮ ወጥ',
    name_en: 'Doro Wat',
    description_am: 'የዶሮ ወጥ ከበርበሬ እና ከቅቤ ጋር በጥሩ ሁኔታ የተቀቀለ።',
    description_en: 'Classic Ethiopian chicken stew with slow-cooked onions, niter kibbeh, and berbere.',
    portionNote_am: 'ከእንቁላል እና እንጀራ ጋር።',
    portionNote_en: 'Served with boiled egg and fresh injera.',
    spiciness: 'hot',
    isVeg: false,
    isFasting: false,
  },
  'Key Wat': {
    name_am: 'ቀይ ወጥ',
    name_en: 'Key Wat',
    description_am: 'በበርበሬ የተቀቀለ የበሬ ሥጋ ወጥ።',
    description_en: 'Tender beef cubes braised in a deep red berbere sauce.',
    portionNote_am: 'ለአንድ ሰው እና ለመካፈል ይሆናል።',
    portionNote_en: 'Comforting and filling for one guest.',
    spiciness: 'hot',
    isVeg: false,
    isFasting: false,
  },
  'Alicha Wat': {
    name_am: 'አልጫ ወጥ',
    name_en: 'Alicha Wat',
    description_am: 'ቀለል ያለ ቅመም ያለው የዶሮ ወይም የሥጋ ወጥ።',
    description_en: 'A milder turmeric-forward stew for guests who want less heat.',
    portionNote_am: 'ለሕፃናት እና ለቀላል ቅመም ወዳጆች ተስማሚ።',
    portionNote_en: 'Great for guests who prefer mild spice.',
    spiciness: 'mild',
    isVeg: false,
    isFasting: false,
  },
  'Special Tibs': {
    name_am: 'ስፔሻል ቲብስ',
    name_en: 'Special Tibs',
    description_am: 'በቅቤ፣ በሽንኩርት እና በሮዝሜሪ የተጠበሰ ሥጋ።',
    description_en: 'Pan-seared beef with onions, peppers, and rosemary in sizzling butter.',
    portionNote_am: 'በሙቀት ሳህን ይቀርባል።',
    portionNote_en: 'Served on a hot skillet.',
    spiciness: 'medium',
    isVeg: false,
    isFasting: false,
  },
  'Kitfo': {
    name_am: 'ክትፎ',
    name_en: 'Kitfo',
    description_am: 'በሚትሚታ እና በቅቤ የተቀላቀለ ከተፈጨ ሥጋ የተዘጋጀ።',
    description_en: 'Finely minced beef seasoned with mitmita and spiced butter.',
    portionNote_am: 'ጥሬ፣ ለበሰ ወይም የበሰለ መምረጥ ይቻላል።',
    portionNote_en: 'Ask for raw, lightly cooked, or fully cooked.',
    spiciness: 'hot',
    isVeg: false,
    isFasting: false,
  },
  'Gomen Besiga': {
    name_am: 'ጎመን በስጋ',
    name_en: 'Gomen Besiga',
    description_am: 'በጎመን ውስጥ የተቀላቀለ ቀለል ያለ የሥጋ ምግብ።',
    description_en: 'Collard greens simmered with small cuts of beef for a balanced plate.',
    portionNote_am: 'ከእንጀራ ወይም ሩዝ ጋር ይቀርባል።',
    portionNote_en: 'Pairs well with injera or rice.',
    spiciness: 'mild',
    isVeg: false,
    isFasting: false,
  },
  'Extra Injera Basket': {
    name_am: 'ተጨማሪ እንጀራ',
    name_en: 'Extra Injera Basket',
    description_am: 'ተጨማሪ ትኩስ እንጀራ ለመካፈል ወይም ለትልቅ ምግብ።',
    description_en: 'Fresh injera basket for sharing or extending a larger table order.',
    portionNote_am: '2-3 ሰው ይበቃል።',
    portionNote_en: 'Enough for 2 to 3 guests.',
    spiciness: 'mild',
    isVeg: true,
    isFasting: true,
  },
  'Timatim Salad': {
    name_am: 'ቲማቲም ሰላጣ',
    name_en: 'Timatim Salad',
    description_am: 'ቲማቲም፣ ቀይ ሽንኩርት፣ ጃላፔኖ እና ሎሚ።',
    description_en: 'Tomato, onion, jalapeno, and lemon salad for a bright side.',
    portionNote_am: 'ቀዝቃዛ አጎን።',
    portionNote_en: 'A fresh cold side dish.',
    spiciness: 'mild',
    isVeg: true,
    isFasting: true,
  },
  'Buna Ceremony Coffee': {
    name_am: 'የቡና ሥነ ሥርዓት',
    name_en: 'Buna Ceremony Coffee',
    description_am: 'በባህላዊ ሁኔታ የተቀቀለ ቡና ከቀለል ያለ ጣፋጭ ጋር።',
    description_en: 'Traditional Ethiopian coffee prepared slowly for a ceremonial finish.',
    portionNote_am: 'ለሁለት ኩባያዎች ይበቃል።',
    portionNote_en: 'Ideal for two small cups.',
    spiciness: 'mild',
    isVeg: true,
    isFasting: true,
  },
  'Fresh Mango Juice': {
    name_am: 'አዲስ የማንጎ ጭማቂ',
    name_en: 'Fresh Mango Juice',
    description_am: 'በስኳር ያልተጨመረበት የማንጎ ጭማቂ።',
    description_en: 'Fresh mango juice blended for a bright, sweet refresh.',
    portionNote_am: 'በብርድ ይቀርባል።',
    portionNote_en: 'Served chilled.',
    spiciness: 'mild',
    isVeg: true,
    isFasting: true,
  },
  Tej: {
    name_am: 'ጠጅ',
    name_en: 'Tej',
    description_am: 'በማር የተዘጋጀ ባህላዊ መጠጥ።',
    description_en: 'Traditional Ethiopian honey wine served cold.',
    portionNote_am: 'ለአንድ ብርጭቆ ወይም ለመካፈል ይገኛል።',
    portionNote_en: 'Available as a glass or shared bottle.',
    spiciness: 'mild',
    isVeg: true,
    isFasting: true,
  },
};

const normalizedSpiciness = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'hot') return 'hot';
  if (normalized === 'medium') return 'medium';
  return 'mild';
};

export const getCategoryMetadata = (categoryName) => CATEGORY_METADATA[categoryName] || null;

export const getItemMetadata = (itemName) => ITEM_METADATA[itemName] || null;

export const enrichMenuCategories = (categories = []) =>
  categories.map((category) => ({
    ...category,
    metadata: getCategoryMetadata(category.name),
    menuItems: (category.menuItems || []).map((item) => {
      const metadata = getItemMetadata(item.name);

      return {
        ...item,
        metadata: {
          name_am: metadata?.name_am || item.name,
          name_en: metadata?.name_en || item.name,
          description_am: metadata?.description_am || item.description,
          description_en: metadata?.description_en || item.description,
          portionNote_am: metadata?.portionNote_am || '',
          portionNote_en: metadata?.portionNote_en || '',
          spiciness: normalizedSpiciness(metadata?.spiciness),
          isVeg: Boolean(metadata?.isVeg),
          isFasting: Boolean(metadata?.isFasting),
        },
      };
    }),
  }));
