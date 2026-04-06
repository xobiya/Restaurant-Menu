require('dotenv').config();
const prisma = require('../prismaClient');

const categorySeeds = [
  { slug: 'fasting', name_en: 'Fasting Specials', name_am: 'የጾም ምግቦች', icon: 'Leaf', sort_order: 1 },
  { slug: 'wats', name_en: 'Signature Wats', name_am: 'የቤቱ ወጦች', icon: 'Soup', sort_order: 2 },
  { slug: 'tibs', name_en: 'Tibs & Meat', name_am: 'ቲብስ እና ስጋ', icon: 'Beef', sort_order: 3 },
  { slug: 'sides', name_en: 'Injera & Sides', name_am: 'እንጀራ እና አጎኖች', icon: 'Utensils', sort_order: 4 },
  { slug: 'drinks', name_en: 'Coffee & Drinks', name_am: 'ቡና እና መጠጦች', icon: 'Coffee', sort_order: 5 },
];

const foodImageSeedItems = [
  { categorySlug: 'fasting', name_en: 'Shiro Wat Bowl', name_am: 'የሽሮ ሳህን', description_en: 'Creamy chickpea stew with berbere and garlic.', description_am: 'በበርበሬ እና ነጭ ሽንኩርት የተቀመመ ለስላሳ የሽሮ ወጥ።', price: 180, prep_time: 12, image_url: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80', is_fasting: true, is_veg: true, spiciness: 1, featured: true },
  { categorySlug: 'fasting', name_en: 'Misir Wat', name_am: 'ምስር ወጥ', description_en: 'Red lentils simmered in aromatic spiced sauce.', description_am: 'በቅመም የተቀቀለ ቀይ ምስር ወጥ።', price: 170, prep_time: 14, image_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=80', is_fasting: true, is_veg: true, spiciness: 2, featured: false },
  { categorySlug: 'fasting', name_en: 'Gomen', name_am: 'ጎመን', description_en: 'Slow-cooked collard greens with onion and garlic.', description_am: 'በሽንኩርት እና ነጭ ሽንኩርት የተቀቀለ ጎመን።', price: 150, prep_time: 10, image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80', is_fasting: true, is_veg: true, spiciness: 0, featured: false },
  { categorySlug: 'fasting', name_en: 'Beyaynetu Platter', name_am: 'የበያይነቱ ሳህን', description_en: 'Mixed fasting platter with lentils, greens, and vegetables.', description_am: 'ምስር፣ ጎመን እና አትክልቶች ያሉበት የጾም በያይነቱ።', price: 320, prep_time: 16, image_url: 'https://images.unsplash.com/photo-1604908554027-1dd4f4b2f1c2?auto=format&fit=crop&w=1200&q=80', is_fasting: true, is_veg: true, spiciness: 1, featured: true },

  { categorySlug: 'wats', name_en: 'Doro Wat', name_am: 'ዶሮ ወጥ', description_en: 'Classic Ethiopian chicken stew with rich berbere base.', description_am: 'በበርበሬ የተቀመመ የኢትዮጵያ ታዋቂ የዶሮ ወጥ።', price: 360, prep_time: 28, image_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=1200&q=80', is_fasting: false, is_veg: false, spiciness: 3, featured: true },
  { categorySlug: 'wats', name_en: 'Key Wat', name_am: 'ቀይ ወጥ', description_en: 'Tender beef cubes in deep red berbere sauce.', description_am: 'በቀይ በርበሬ የተቀመመ ለስላሳ የበሬ ሥጋ።', price: 340, prep_time: 24, image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80', is_fasting: false, is_veg: false, spiciness: 3, featured: false },
  { categorySlug: 'wats', name_en: 'Alicha Wat', name_am: 'አልጫ ወጥ', description_en: 'Mild turmeric-forward stew with gentle warmth.', description_am: 'ቀለል ያለ ቱርሜሪክ ጣዕም ያለው ለስላሳ ወጥ።', price: 310, prep_time: 20, image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=80', is_fasting: false, is_veg: false, spiciness: 0, featured: false },
  { categorySlug: 'wats', name_en: 'Yebeg Wat', name_am: 'የበግ ወጥ', description_en: 'Lamb stew with warm Ethiopian spices.', description_am: 'በኢትዮጵያ ቅመሞች የተዘጋጀ የበግ ወጥ።', price: 380, prep_time: 26, image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80', is_fasting: false, is_veg: false, spiciness: 2, featured: true },

  { categorySlug: 'tibs', name_en: 'Special Tibs', name_am: 'ስፔሻል ቲብስ', description_en: 'Sizzling beef tibs with onion, pepper, and rosemary.', description_am: 'በሽንኩርትና ቃሪያ የተቀመመ ሞቃት ስፔሻል ቲብስ።', price: 390, prep_time: 18, image_url: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=1200&q=80', is_fasting: false, is_veg: false, spiciness: 2, featured: true },
  { categorySlug: 'tibs', name_en: 'Awaze Tibs', name_am: 'አዋዜ ቲብስ', description_en: 'Spicy awaze-marinated beef strips on hot pan.', description_am: 'በአዋዜ የተቀመመ ሞቃት የበሬ ቲብስ።', price: 410, prep_time: 19, image_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80', is_fasting: false, is_veg: false, spiciness: 3, featured: false },
  { categorySlug: 'tibs', name_en: 'Kitfo', name_am: 'ክትፎ', description_en: 'Minced beef with niter kibbeh and mitmita.', description_am: 'በንጥር ቅቤ እና ሚትሚታ የተቀመመ ክትፎ።', price: 420, prep_time: 15, image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80', is_fasting: false, is_veg: false, spiciness: 3, featured: false },
  { categorySlug: 'tibs', name_en: 'Dulet', name_am: 'ዱለት', description_en: 'Traditional minced tripe and liver with spices.', description_am: 'ባህላዊ የተፈጨ ጉበትና ጉርጉሮ በቅመም።', price: 350, prep_time: 17, image_url: 'https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=1200&q=80', is_fasting: false, is_veg: false, spiciness: 2, featured: false },

  { categorySlug: 'sides', name_en: 'Extra Injera Basket', name_am: 'ተጨማሪ እንጀራ', description_en: 'Fresh injera basket for sharing.', description_am: 'ለመካፈል የተዘጋጀ ትኩስ እንጀራ።', price: 60, prep_time: 5, image_url: 'https://images.unsplash.com/photo-1608039755401-742074f0548d?auto=format&fit=crop&w=1200&q=80', is_fasting: true, is_veg: true, spiciness: 0, featured: false },
  { categorySlug: 'sides', name_en: 'Timatim Salad', name_am: 'ቲማቲም ሰላጣ', description_en: 'Tomato, onion, jalapeño, and lemon salad.', description_am: 'ቲማቲም፣ ሽንኩርት እና ሎሚ ያለበት ሰላጣ።', price: 110, prep_time: 6, image_url: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80', is_fasting: true, is_veg: true, spiciness: 1, featured: false },
  { categorySlug: 'sides', name_en: 'Ayib with Mitmita', name_am: 'አይብ ከሚትሚታ ጋር', description_en: 'Ethiopian cottage cheese served with mild spice.', description_am: 'ቀለል ቅመም ጋር የሚቀርብ አይብ።', price: 95, prep_time: 4, image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1200&q=80', is_fasting: true, is_veg: true, spiciness: 1, featured: false },
  { categorySlug: 'sides', name_en: 'Tikil Gomen', name_am: 'ጥቅል ጎመን', description_en: 'Cabbage, carrot, and potato sautéed lightly.', description_am: 'ጎመን፣ ካሮት እና ድንች በቀለል የተጠበሱ።', price: 140, prep_time: 9, image_url: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=1200&q=80', is_fasting: true, is_veg: true, spiciness: 0, featured: false },

  { categorySlug: 'drinks', name_en: 'Buna Coffee', name_am: 'ቡና', description_en: 'Traditional Ethiopian coffee served hot.', description_am: 'ባህላዊ ትኩስ የኢትዮጵያ ቡና።', price: 140, prep_time: 10, image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80', is_fasting: true, is_veg: true, spiciness: 0, featured: true },
  { categorySlug: 'drinks', name_en: 'Mango Juice', name_am: 'የማንጎ ጭማቂ', description_en: 'Fresh mango juice served chilled.', description_am: 'ቀዝቃዛ የማንጎ ጭማቂ።', price: 120, prep_time: 5, image_url: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?auto=format&fit=crop&w=1200&q=80', is_fasting: true, is_veg: true, spiciness: 0, featured: false },
  { categorySlug: 'drinks', name_en: 'Tej Honey Wine', name_am: 'ጠጅ', description_en: 'Traditional Ethiopian honey wine.', description_am: 'ባህላዊ የማር ጠጅ።', price: 210, prep_time: 3, image_url: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=1200&q=80', is_fasting: false, is_veg: true, spiciness: 0, featured: false },
];

async function upsertCategories() {
  const map = new Map();

  for (const category of categorySeeds) {
    const record = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name_en,
        name_en: category.name_en,
        name_am: category.name_am,
        icon: category.icon,
        sort_order: category.sort_order,
      },
      create: {
        slug: category.slug,
        name: category.name_en,
        name_en: category.name_en,
        name_am: category.name_am,
        icon: category.icon,
        sort_order: category.sort_order,
      },
    });

    map.set(category.slug, record.id);
  }

  return map;
}

async function upsertFoodImages(categoryMap) {
  for (const item of foodImageSeedItems) {
    const categoryId = categoryMap.get(item.categorySlug);
    if (!categoryId) continue;

    const existing = await prisma.menuItem.findFirst({
      where: {
        categoryId,
        OR: [{ name_en: item.name_en }, { name: item.name_en }],
      },
    });

    const data = {
      categoryId,
      name: item.name_en,
      name_en: item.name_en,
      name_am: item.name_am,
      description: item.description_en,
      description_en: item.description_en,
      description_am: item.description_am,
      portion_note_en: item.portion_note_en || null,
      portion_note_am: item.portion_note_am || null,
      price: item.price,
      prep_time: item.prep_time,
      image_url: item.image_url,
      is_available: true,
      is_fasting: item.is_fasting,
      is_veg: item.is_veg,
      spiciness: item.spiciness,
      featured: item.featured,
    };

    if (existing) {
      await prisma.menuItem.update({ where: { id: existing.id }, data });
    } else {
      await prisma.menuItem.create({ data });
    }
  }
}

async function main() {
  console.log(`Seeding ${foodImageSeedItems.length} food items with images...`);
  const categories = await upsertCategories();
  await upsertFoodImages(categories);
  console.log('Food image seed completed.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
