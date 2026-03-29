require('dotenv').config();
const prisma = require('../prismaClient');

async function main() {
  console.log('Seeding database...');

  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();

  await prisma.category.createMany({
    data: [
      { name: 'Daily Specials', icon: 'Star' },
      { name: 'Beverages', icon: 'Coffee' },
      { name: 'Main Dishes', icon: 'UtensilsCrossed' },
      { name: 'Sides', icon: 'Utensils' },
    ],
  });

  const [dailySpecials, beverages, mains, sides] = await Promise.all([
    prisma.category.findFirst({ where: { name: 'Daily Specials' } }),
    prisma.category.findFirst({ where: { name: 'Beverages' } }),
    prisma.category.findFirst({ where: { name: 'Main Dishes' } }),
    prisma.category.findFirst({ where: { name: 'Sides' } }),
  ]);

  if (!dailySpecials || !beverages || !mains || !sides) {
    throw new Error('Failed to initialize categories');
  }

  await prisma.menuItem.createMany({
    data: [
      {
        name: 'Wagyu Burger Combo',
        description: 'Premium beef burger served with truffle fries and a soft drink.',
        price: 550,
        image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80',
        prep_time: 20,
        categoryId: dailySpecials.id,
      },
      {
        name: 'Chef Pasta Bowl',
        description: 'Fresh pasta with roasted tomato sauce, parmesan, and basil.',
        price: 420,
        image_url: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&q=80',
        prep_time: 18,
        categoryId: dailySpecials.id,
      },
      {
        name: 'Iced Latte',
        description: 'Double-shot espresso with chilled milk over ice.',
        price: 150,
        image_url: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&q=80',
        prep_time: 5,
        categoryId: beverages.id,
      },
      {
        name: 'Fresh Mango Juice',
        description: 'Freshly squeezed mangoes with no added sugar.',
        price: 120,
        image_url: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=80',
        prep_time: 5,
        categoryId: beverages.id,
      },
      {
        name: 'Grilled Chicken Plate',
        description: 'Tender grilled chicken served with herbed rice and salad.',
        price: 390,
        image_url: 'https://images.unsplash.com/photo-1598515213692-d7cc9367726f?auto=format&fit=crop&q=80',
        prep_time: 22,
        categoryId: mains.id,
      },
      {
        name: 'Veggie Rice Bowl',
        description: 'Seasoned rice with sauteed vegetables and house sauce.',
        price: 280,
        image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80',
        prep_time: 15,
        categoryId: mains.id,
      },
      {
        name: 'Truffle Fries',
        description: 'Crispy fries with truffle oil and parmesan.',
        price: 180,
        image_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80',
        prep_time: 10,
        categoryId: sides.id,
      },
      {
        name: 'Garden Salad',
        description: 'Mixed greens, cucumber, cherry tomato, and lemon dressing.',
        price: 160,
        image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80',
        prep_time: 8,
        categoryId: sides.id,
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
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
