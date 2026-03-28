require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Daily Specials',
        icon: 'Star',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Beverages',
        icon: 'Coffee',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Sides',
        icon: 'Utensils',
      },
    }),
  ]);

  // 2. Create Menu Items
  await prisma.menuItem.createMany({
    data: [
      {
        name: 'Wagyu Burger Combo',
        description: 'Premium beef with truffle fries and a drink.',
        price: 550,
        image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80',
        prep_time: 20,
        categoryId: categories[0].id,
      },
      {
        name: 'Iced Latte',
        description: 'Cold brew with oat milk.',
        price: 150,
        image_url: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&q=80',
        prep_time: 5,
        categoryId: categories[1].id,
      },
      {
        name: 'Fresh Mango Juice',
        description: 'Freshly squeezed mangoes.',
        price: 120,
        image_url: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=80',
        prep_time: 5,
        categoryId: categories[1].id,
      },
      {
        name: 'Truffle Fries',
        description: 'Crispy fries with truffle oil and parmesan.',
        price: 180,
        image_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80',
        prep_time: 10,
        categoryId: categories[2].id,
      },
    ],
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
