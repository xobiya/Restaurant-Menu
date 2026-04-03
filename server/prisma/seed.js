require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('../prismaClient');

const categories = [
  {
    slug: 'fasting',
    name_en: 'Fasting Specials',
    name_am: 'የጾም ምግቦች',
    description_en: 'Plant-based favorites for fasting days, lent, and lighter plates.',
    description_am: 'ለጾም ቀናት፣ ለዐቢይ ጾም እና ለቀላል ምግብ የተዘጋጁ ታዋቂ አማራጮች።',
    icon: 'Leaf',
    sort_order: 1,
  },
  {
    slug: 'wats',
    name_en: 'Signature Wats',
    name_am: 'የቤቱ ወጦች',
    description_en: 'Slow-cooked Ethiopian stews served with fresh injera.',
    description_am: 'ከትኩስ እንጀራ ጋር የሚቀርቡ ቀስ ብለው የተበሉ ወጦች።',
    icon: 'Soup',
    sort_order: 2,
  },
  {
    slug: 'tibs',
    name_en: 'Tibs & Meat',
    name_am: 'ቲብስ እና ስጋ',
    description_en: 'Sizzling meats, pan-seared plates, and hearty classics.',
    description_am: 'በሙቀት የሚቀርቡ ቲብሶች፣ የተጠበሱ ሥጋዎች እና የሚያረኩ ምግቦች።',
    icon: 'Beef',
    sort_order: 3,
  },
  {
    slug: 'sides',
    name_en: 'Injera & Sides',
    name_am: 'እንጀራ እና አጎኖች',
    description_en: 'Extra injera, salads, and shareable side dishes.',
    description_am: 'ተጨማሪ እንጀራ፣ ሰላጣዎች እና ለመካፈል የሚመቹ አጎኖች።',
    icon: 'Utensils',
    sort_order: 4,
  },
  {
    slug: 'drinks',
    name_en: 'Coffee & Drinks',
    name_am: 'ቡና እና መጠጦች',
    description_en: 'Buna, juices, tej, and refreshing drinks.',
    description_am: 'ቡና፣ ጭማቂ፣ ጠጅ እና ሌሎች የሚያሳርፉ መጠጦች።',
    icon: 'Coffee',
    sort_order: 5,
  },
];

const menuItems = [
  {
    categorySlug: 'fasting',
    name_en: 'Shiro',
    name_am: 'ሽሮ',
    description_en: 'Creamy chickpea stew cooked with garlic, onion, and berbere.',
    description_am: 'በነጭ ሽንኩርት፣ በሽንኩርት እና በበርበሬ የተቀቀለ ሽሮ ወጥ።',
    portion_note_en: 'Served with fresh injera.',
    portion_note_am: 'ከትኩስ እንጀራ ጋር ይቀርባል።',
    price: 180,
    prep_time: 12,
    image_url: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80',
    is_fasting: true,
    is_veg: true,
    spiciness: 1,
    featured: true,
  },
  {
    categorySlug: 'fasting',
    name_en: 'Beyaynetu',
    name_am: 'በያይነቱ',
    description_en: 'A colorful fasting platter with lentils, greens, shiro, and vegetables.',
    description_am: 'ምስር፣ ጎመን፣ ሽሮ እና አትክልቶችን የሚያካትት የጾም በያይነቱ።',
    portion_note_en: 'Great for sharing.',
    portion_note_am: 'ለመካፈል ተስማሚ ነው።',
    price: 320,
    prep_time: 16,
    image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80',
    is_fasting: true,
    is_veg: true,
    spiciness: 1,
    featured: true,
  },
  {
    categorySlug: 'fasting',
    name_en: 'Misir Wat',
    name_am: 'ምስር ወጥ',
    description_en: 'Red lentils simmered in berbere sauce for a deep, rich flavor.',
    description_am: 'በበርበሬ የተቀቀለ ቀይ ምስር ለጠንካራ ጣዕም።',
    portion_note_en: 'Best with extra injera.',
    portion_note_am: 'ከተጨማሪ እንጀራ ጋር ይጣፍጣል።',
    price: 170,
    prep_time: 14,
    image_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80',
    is_fasting: true,
    is_veg: true,
    spiciness: 2,
  },
  {
    categorySlug: 'wats',
    name_en: 'Doro Wat',
    name_am: 'ዶሮ ወጥ',
    description_en: 'Ethiopia’s classic chicken stew slow-cooked with onions, berbere, and niter kibbeh.',
    description_am: 'የኢትዮጵያ ታዋቂ የዶሮ ወጥ ከሽንኩርት፣ ከበርበሬ እና ከቅቤ ጋር በቀስታ የተዘጋጀ።',
    portion_note_en: 'Served with egg and injera.',
    portion_note_am: 'ከእንቁላል እና እንጀራ ጋር ይቀርባል።',
    price: 360,
    prep_time: 28,
    image_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80',
    is_fasting: false,
    is_veg: false,
    spiciness: 3,
    featured: true,
  },
  {
    categorySlug: 'wats',
    name_en: 'Key Wat',
    name_am: 'ቀይ ወጥ',
    description_en: 'Tender beef cubes braised in a deep red berbere sauce.',
    description_am: 'በጥቅም የተቀቀለ የበሬ ሥጋ በጥልቅ ቀይ ወጥ ቅመም።',
    portion_note_en: 'A hearty single-serving plate.',
    portion_note_am: 'ለአንድ ሰው በቂ እና አርኪ ምግብ።',
    price: 340,
    prep_time: 24,
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80',
    is_fasting: false,
    is_veg: false,
    spiciness: 3,
  },
  {
    categorySlug: 'wats',
    name_en: 'Alicha Wat',
    name_am: 'አልጫ ወጥ',
    description_en: 'A turmeric-forward mild stew for guests who want less heat.',
    description_am: 'ቀለል ያለ ቅመም የሚፈልጉ እንግዶች ለሚመች በቱርሜሪክ የተመረተ ለስላሳ ወጥ።',
    portion_note_en: 'Comforting and family-friendly.',
    portion_note_am: 'ለቤተሰብ ተስማሚ እና ለስላሳ ምግብ።',
    price: 310,
    prep_time: 20,
    image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80',
    is_fasting: false,
    is_veg: false,
    spiciness: 0,
  },
  {
    categorySlug: 'tibs',
    name_en: 'Special Tibs',
    name_am: 'ስፔሻል ቲብስ',
    description_en: 'Sizzling beef tibs with onion, pepper, rosemary, and spiced butter.',
    description_am: 'በሽንኩርት፣ በቃሪያ፣ በሮዝሜሪ እና በቅቤ የተዘጋጀ ሞቃት ስፔሻል ቲብስ።',
    portion_note_en: 'Arrives on a hot pan.',
    portion_note_am: 'በሙቀት ሳህን ላይ ይቀርባል።',
    price: 390,
    prep_time: 18,
    image_url: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&q=80',
    is_fasting: false,
    is_veg: false,
    spiciness: 2,
    featured: true,
  },
  {
    categorySlug: 'tibs',
    name_en: 'Kitfo',
    name_am: 'ክትፎ',
    description_en: 'Finely minced beef seasoned with mitmita and niter kibbeh.',
    description_am: 'በሚትሚታ እና በንጥር ቅቤ የተቀመመ የተፈጨ ሥጋ።',
    portion_note_en: 'Ask for raw, medium, or well done.',
    portion_note_am: 'ጥሬ፣ መካከለኛ ወይም በሙሉ የበሰለ ማቅረብ ይቻላል።',
    price: 420,
    prep_time: 15,
    image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80',
    is_fasting: false,
    is_veg: false,
    spiciness: 3,
  },
  {
    categorySlug: 'sides',
    name_en: 'Extra Injera Basket',
    name_am: 'ተጨማሪ እንጀራ',
    description_en: 'Fresh soft injera for sharing or larger orders.',
    description_am: 'ለመካፈል ወይም ለትልቅ ትዕዛዞች ተጨማሪ ትኩስ እንጀራ።',
    portion_note_en: 'Enough for 2 to 3 guests.',
    portion_note_am: 'ለ2 እስከ 3 እንግዶች ይበቃል።',
    price: 60,
    prep_time: 5,
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80',
    is_fasting: true,
    is_veg: true,
    spiciness: 0,
  },
  {
    categorySlug: 'sides',
    name_en: 'Timatim Salad',
    name_am: 'ቲማቲም ሰላጣ',
    description_en: 'Tomato, onion, jalapeno, and lemon salad for a bright side.',
    description_am: 'ቲማቲም፣ ሽንኩርት፣ ቃሪያ እና ሎሚ ያለበት ቀለል ያለ ሰላጣ።',
    portion_note_en: 'Fresh cold side dish.',
    portion_note_am: 'ቀዝቃዛ እና አዲስ አጎን።',
    price: 110,
    prep_time: 6,
    image_url: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&q=80',
    is_fasting: true,
    is_veg: true,
    spiciness: 1,
  },
  {
    categorySlug: 'drinks',
    name_en: 'Buna Ceremony Coffee',
    name_am: 'የቡና ሥነ ሥርዓት',
    description_en: 'Traditional Ethiopian coffee prepared slowly and served hot.',
    description_am: 'ባህላዊ የኢትዮጵያ ቡና በቀስታ የተዘጋጀ እና ትኩስ የሚቀርብ።',
    portion_note_en: 'Ideal for two small cups.',
    portion_note_am: 'ለሁለት ትንሽ ኩባያዎች ይበቃል።',
    price: 140,
    prep_time: 10,
    image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80',
    is_fasting: true,
    is_veg: true,
    spiciness: 0,
    featured: true,
  },
  {
    categorySlug: 'drinks',
    name_en: 'Fresh Mango Juice',
    name_am: 'አዲስ የማንጎ ጭማቂ',
    description_en: 'Freshly blended mango juice served chilled.',
    description_am: 'አዲስ የተዘጋጀ ቀዝቃዛ የማንጎ ጭማቂ።',
    portion_note_en: 'Served cold.',
    portion_note_am: 'በብርድ ይቀርባል።',
    price: 120,
    prep_time: 5,
    image_url: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?auto=format&fit=crop&q=80',
    is_fasting: true,
    is_veg: true,
    spiciness: 0,
  },
];

const staffAccounts = [
  {
    name: 'Admin User',
    email: process.env.ADMIN_EMAIL || 'admin@restaurant.local',
    phone: process.env.ADMIN_PHONE || '0911000000',
    password: process.env.ADMIN_PASSWORD || 'admin123',
    role: 'ADMIN',
    username: process.env.ADMIN_USERNAME || 'admin',
  },
  {
    name: 'Kitchen Staff',
    email: process.env.KITCHEN_EMAIL || 'kitchen@restaurant.local',
    phone: process.env.KITCHEN_PHONE || '0911000001',
    password: process.env.KITCHEN_PASSWORD || 'kitchen123',
    role: 'KITCHEN',
    username: process.env.KITCHEN_USERNAME || 'kitchen',
  },
];

async function upsertStaffAccounts() {
  for (const account of staffAccounts) {
    const password_hash = await bcrypt.hash(account.password, 10);

    await prisma.user.upsert({
      where: {
        email: account.email,
      },
      update: {
        name: account.name,
        phone: account.phone,
        password_hash,
        role: account.role,
      },
      create: {
        name: account.name,
        email: account.email,
        phone: account.phone,
        password_hash,
        role: account.role,
      },
    });

    if (account.role === 'ADMIN') {
      await prisma.admin.upsert({
        where: {
          username: account.username,
        },
        update: {
          password_hash,
        },
        create: {
          username: account.username,
          password_hash,
        },
      });
    }
  }
}

async function upsertCategories() {
  const categoryMap = new Map();

  for (const category of categories) {
    const record = await prisma.category.upsert({
      where: {
        slug: category.slug,
      },
      update: {
        name: category.name_en,
        name_en: category.name_en,
        name_am: category.name_am,
        description_en: category.description_en,
        description_am: category.description_am,
        icon: category.icon,
        sort_order: category.sort_order,
      },
      create: {
        slug: category.slug,
        name: category.name_en,
        name_en: category.name_en,
        name_am: category.name_am,
        description_en: category.description_en,
        description_am: category.description_am,
        icon: category.icon,
        sort_order: category.sort_order,
      },
    });

    categoryMap.set(category.slug, record.id);
  }

  return categoryMap;
}

async function upsertMenuItems(categoryMap) {
  for (const item of menuItems) {
    const categoryId = categoryMap.get(item.categorySlug);
    if (!categoryId) {
      throw new Error(`Missing category for slug: ${item.categorySlug}`);
    }

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
      portion_note_en: item.portion_note_en,
      portion_note_am: item.portion_note_am,
      price: item.price,
      prep_time: item.prep_time,
      image_url: item.image_url,
      is_available: true,
      is_fasting: item.is_fasting,
      is_veg: item.is_veg,
      spiciness: item.spiciness,
      featured: Boolean(item.featured),
    };

    if (existing) {
      await prisma.menuItem.update({
        where: {
          id: existing.id,
        },
        data,
      });
    } else {
      await prisma.menuItem.create({
        data,
      });
    }
  }
}

async function upsertTables() {
  for (let tableNumber = 1; tableNumber <= 20; tableNumber += 1) {
    await prisma.table.upsert({
      where: {
        number: tableNumber,
      },
      update: {
        label: `Table ${tableNumber}`,
        is_active: true,
      },
      create: {
        number: tableNumber,
        label: `Table ${tableNumber}`,
        is_active: true,
      },
    });
  }
}

async function main() {
  console.log('Seeding bilingual Ethiopian restaurant data into MySQL...');

  await upsertStaffAccounts();
  const categoryMap = await upsertCategories();
  await upsertMenuItems(categoryMap);
  await upsertTables();

  console.log('Seed complete.');
  console.log(`Admin login: ${staffAccounts[0].email} / ${staffAccounts[0].password}`);
  console.log(`Kitchen login: ${staffAccounts[1].email} / ${staffAccounts[1].password}`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
