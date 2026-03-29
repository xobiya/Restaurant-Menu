require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('../prismaClient');

async function createAdmin() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123'; // default for local setup

  console.log(`Creating admin: ${username}...`);

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const admin = await prisma.admin.upsert({
      where: { username },
      update: { password_hash: hashedPassword },
      create: {
        username,
        password_hash: hashedPassword,
      },
    });

    console.log(`Admin created successfully! ID: ${admin.id}`);
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log('IMPORTANT: Change this password after first login.');
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
