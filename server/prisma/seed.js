require('dotenv').config();
const prisma = require('../prismaClient');

async function main() {
  console.log('Seeding database with Ethiopian restaurant data...');

  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();

  await prisma.category.createMany({
    data: [
      { name: 'Fasting Specials', icon: 'Leaf' },
      { name: 'Signature Wats', icon: 'Soup' },
      { name: 'Tibs & Meat', icon: 'Beef' },
      { name: 'Injera & Sides', icon: 'Utensils' },
      { name: 'Coffee & Drinks', icon: 'Coffee' },
    ],
  });

  const [fasting, wats, tibs, sides, drinks] = await Promise.all([
    prisma.category.findFirst({ where: { name: 'Fasting Specials' } }),
    prisma.category.findFirst({ where: { name: 'Signature Wats' } }),
    prisma.category.findFirst({ where: { name: 'Tibs & Meat' } }),
    prisma.category.findFirst({ where: { name: 'Injera & Sides' } }),
    prisma.category.findFirst({ where: { name: 'Coffee & Drinks' } }),
  ]);

  if (!fasting || !wats || !tibs || !sides || !drinks) {
    throw new Error('Failed to initialize categories');
  }

  await prisma.menuItem.createMany({
    data: [
      {
        name: 'Shiro Firfir',
        description: 'Seasoned chickpea stew folded into torn injera for a quick, comforting plate.',
        price: 180,
        image_url:
          'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80',
        prep_time: 12,
        categoryId: fasting.id,
      },
      {
        name: 'Beyaynetu Platter',
        description: 'A fasting platter with shiro, lentils, greens, and mixed vegetables on one tray.',
        price: 320,
        image_url:
          'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80',
        prep_time: 18,
        categoryId: fasting.id,
      },
      {
        name: 'Misir Wat',
        description: 'Red lentils simmered with berbere and onions into a rich fasting stew.',
        price: 170,
        image_url:
          'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80',
        prep_time: 14,
        categoryId: fasting.id,
      },
      {
        name: 'Doro Wat',
        description: 'Classic Ethiopian chicken stew with slow-cooked onions, niter kibbeh, and berbere.',
        price: 360,
        image_url:
          'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80',
        prep_time: 28,
        categoryId: wats.id,
      },
      {
        name: 'Key Wat',
        description: 'Tender beef cubes braised in a deep red berbere sauce.',
        price: 340,
        image_url:
          'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80',
        prep_time: 24,
        categoryId: wats.id,
      },
      {
        name: 'Alicha Wat',
        description: 'A milder turmeric-forward stew for guests who want less heat.',
        price: 310,
        image_url:
          'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80',
        prep_time: 22,
        categoryId: wats.id,
      },
      {
        name: 'Special Tibs',
        description: 'Pan-seared beef with onions, peppers, and rosemary in sizzling butter.',
        price: 390,
        image_url:
          'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&q=80',
        prep_time: 20,
        categoryId: tibs.id,
      },
      {
        name: 'Kitfo',
        description: 'Finely minced beef seasoned with mitmita and spiced butter.',
        price: 420,
        image_url:
          'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80',
        prep_time: 15,
        categoryId: tibs.id,
      },
      {
        name: 'Gomen Besiga',
        description: 'Collard greens simmered with small cuts of beef for a balanced plate.',
        price: 250,
        image_url:
          'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80',
        prep_time: 16,
        categoryId: tibs.id,
      },
      {
        name: 'Extra Injera Basket',
        description: 'Fresh injera basket for sharing or extending a larger table order.',
        price: 60,
        image_url:
          'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80',
        prep_time: 4,
        categoryId: sides.id,
      },
      {
        name: 'Timatim Salad',
        description: 'Tomato, onion, jalapeno, and lemon salad for a bright side.',
        price: 120,
        image_url:
          'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80',
        prep_time: 8,
        categoryId: sides.id,
      },
      {
        name: 'Buna Ceremony Coffee',
        description: 'Traditional Ethiopian coffee prepared slowly for a ceremonial finish.',
        price: 140,
        image_url:
          'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80',
        prep_time: 10,
        categoryId: drinks.id,
      },
      {
        name: 'Fresh Mango Juice',
        description: 'Fresh mango juice blended for a bright, sweet refresh.',
        price: 130,
        image_url:
          'https://images.unsplash.com/photo-1622597467836-f3e6704ea1d6?auto=format&fit=crop&q=80',
        prep_time: 5,
        categoryId: drinks.id,
      },
      {
        name: 'Tej',
        description: 'Traditional Ethiopian honey wine served cold.',
        price: 190,
        image_url:
          'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80',
        prep_time: 3,
        categoryId: drinks.id,
      },
    ],
  });

  await prisma.table.createMany({
    data: Array.from({ length: 20 }, (_, index) => ({
      number: index + 1,
      qr_code_url: null,
    })),
    skipDuplicates: true,
  });

  console.log('Seeding complete.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
