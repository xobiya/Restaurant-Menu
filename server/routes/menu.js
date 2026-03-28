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
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/menu/items - Create item
router.post('/items', async (req, res) => {
  const { name, description, price, image_url, categoryId } = req.body;
  try {
    const newItem = await prisma.menuItem.create({
      data: { name, description, price: parseFloat(price), image_url, categoryId: parseInt(categoryId) }
    });
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// PATCH /api/menu/items/:id - Update item
router.patch('/items/:id', async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  
  if (data.price) data.price = parseFloat(data.price);
  if (data.categoryId) data.categoryId = parseInt(data.categoryId);

  try {
    const updated = await prisma.menuItem.update({
      where: { id: parseInt(id) },
      data
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// DELETE /api/menu/items/:id - Delete item
router.delete('/items/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.menuItem.delete({ where: { id: parseInt(id) } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

module.exports = router;
