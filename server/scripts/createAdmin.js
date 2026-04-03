require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('../prismaClient');

async function createAdmin() {
  const name = process.env.ADMIN_NAME || 'Admin User';
  const email = process.env.ADMIN_EMAIL || 'admin@restaurant.local';
  const phone = process.env.ADMIN_PHONE || '0911000000';
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  console.log(`Creating admin account for ${email}...`);

  try {
    const password_hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
      where: {
        email,
      },
      update: {
        name,
        phone,
        password_hash,
        role: 'ADMIN',
      },
      create: {
        name,
        email,
        phone,
        password_hash,
        role: 'ADMIN',
      },
    });

    await prisma.admin.upsert({
      where: {
        username,
      },
      update: {
        password_hash,
      },
      create: {
        username,
        password_hash,
      },
    });

    console.log(`Admin created successfully. User ID: ${user.id}`);
    console.log(`Email: ${email}`);
    console.log(`Legacy username: ${username}`);
    console.log(`Password: ${password}`);
    console.log('IMPORTANT: Change this password after first login.');
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
