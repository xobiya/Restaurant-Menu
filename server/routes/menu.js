const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

// GET /api/menu
// Fetch all available items grouped by category
router.get('/', async (req, res) => {
  try {
    const categoriesWithItems = await prisma.category.findMany({
      include: {
        menuItems: {
          where: {
            is_available: true,
          },
        },
      },
    });

    res.json(categoriesWithItems);
  } catch (error) {
    console.error('Failed to fetch menu:', error);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

// GET /api/menu/categories
// Fetch just the categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;
