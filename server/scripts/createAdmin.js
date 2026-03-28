require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createAdmin() {
  const username = 'admin';
  const password = 'admin123'; // Default password

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
