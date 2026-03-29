require('dotenv').config();
const prisma = require('./prismaClient');

async function test() {
  try {
    console.log('Testing connection to:', process.env.DATABASE_URL);
    const count = await prisma.category.count();
    console.log('Connected! Current category count:', count);
  } catch (error) {
    console.error('Connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
