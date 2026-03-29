const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const verifyJWT = require('../middleware/authMiddleware');

const parseItemPayload = (payload = {}) => {
  const mapped = {};

  if (payload.name !== undefined) mapped.name = String(payload.name).trim();
  if (payload.description !== undefined) mapped.description = String(payload.description).trim();
  if (payload.image_url !== undefined) mapped.image_url = String(payload.image_url).trim();
  if (payload.price !== undefined) mapped.price = Number(payload.price);
  if (payload.prep_time !== undefined) mapped.prep_time = Number(payload.prep_time);
  if (payload.categoryId !== undefined) mapped.categoryId = Number(payload.categoryId);
  if (payload.is_available !== undefined) {
    mapped.is_available =
      typeof payload.is_available === 'string'
        ? payload.is_available.toLowerCase() === 'true'
        : Boolean(payload.is_available);
  }

  return mapped;
};

const validateItemPayload = (payload, required = false) => {
  if (required) {
    const requiredFields = ['name', 'description', 'price', 'image_url', 'categoryId'];
    const missing = requiredFields.find((field) => payload[field] === undefined || payload[field] === '');
    if (missing) {
      return `Missing required field: ${missing}`;
    }
  }

  if (payload.price !== undefined && (!Number.isFinite(payload.price) || payload.price <= 0)) {
    return 'Price must be a positive number';
  }
  if (payload.prep_time !== undefined && (!Number.isInteger(payload.prep_time) || payload.prep_time < 1)) {
    return 'Prep time must be an integer >= 1';
  }
  if (payload.categoryId !== undefined && (!Number.isInteger(payload.categoryId) || payload.categoryId < 1)) {
    return 'categoryId must be a positive integer';
  }
  if (payload.name !== undefined && !payload.name) {
    return 'Name cannot be empty';
  }
  if (payload.description !== undefined && !payload.description) {
    return 'Description cannot be empty';
  }
  if (payload.image_url !== undefined && !payload.image_url) {
    return 'Image URL cannot be empty';
  }

  return null;
};

const menuInclude = (includeUnavailable = false) => ({
  include: {
    menuItems: {
      where: includeUnavailable ? {} : { is_available: true },
      orderBy: [{ is_available: 'desc' }, { name: 'asc' }],
    },
  },
  orderBy: { name: 'asc' },
});

// GET /api/menu
// Customer menu (available items only)
router.get('/', async (req, res) => {
  try {
    const categoriesWithItems = await prisma.category.findMany(menuInclude(false));
    res.json(categoriesWithItems);
  } catch (error) {
    console.error('Failed to fetch menu:', error);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

// GET /api/menu/admin
// Admin full menu (includes unavailable items)
router.get('/admin', verifyJWT, async (req, res) => {
  try {
    const categoriesWithItems = await prisma.category.findMany(menuInclude(true));
    res.json(categoriesWithItems);
  } catch (error) {
    console.error('Failed to fetch admin menu:', error);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

// GET /api/menu/categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    res.json(categories);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/menu/categories
router.post('/categories', verifyJWT, async (req, res) => {
  const { name, icon = 'Utensils' } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  try {
    const category = await prisma.category.create({
      data: {
        name: String(name).trim(),
        icon: String(icon).trim() || 'Utensils',
      },
    });
    res.status(201).json(category);
  } catch (error) {
    console.error('Failed to create category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

const createItemHandler = async (req, res) => {
  const payload = parseItemPayload(req.body);
  const validationError = validateItemPayload(payload, true);
  if (validationError) return res.status(400).json({ error: validationError });

  try {
    const category = await prisma.category.findUnique({
      where: { id: payload.categoryId },
      select: { id: true },
    });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const newItem = await prisma.menuItem.create({
      data: {
        name: payload.name,
        description: payload.description,
        price: payload.price,
        image_url: payload.image_url,
        prep_time: payload.prep_time || 15,
        is_available: payload.is_available !== undefined ? payload.is_available : true,
        categoryId: payload.categoryId,
      },
    });
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Failed to create menu item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
};

// SRS endpoint and backward-compatible endpoint
router.post('/', verifyJWT, createItemHandler);
router.post('/items', verifyJWT, createItemHandler);

const updateItemHandler = async (req, res) => {
  const itemId = Number(req.params.id);
  if (!Number.isInteger(itemId) || itemId < 1) {
    return res.status(400).json({ error: 'Invalid item id' });
  }

  const payload = parseItemPayload(req.body);
  const validationError = validateItemPayload(payload);
  if (validationError) return res.status(400).json({ error: validationError });
  if (Object.keys(payload).length === 0) {
    return res.status(400).json({ error: 'No fields provided for update' });
  }

  try {
    if (payload.categoryId !== undefined) {
      const category = await prisma.category.findUnique({ where: { id: payload.categoryId } });
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
    }

    const updated = await prisma.menuItem.update({
      where: { id: itemId },
      data: payload,
    });
    res.json(updated);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    console.error('Failed to update menu item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
};

// SRS endpoint and backward-compatible endpoints
router.put('/:id', verifyJWT, updateItemHandler);
router.patch('/:id', verifyJWT, updateItemHandler);
router.patch('/items/:id', verifyJWT, updateItemHandler);

const deleteItemHandler = async (req, res) => {
  const itemId = Number(req.params.id);
  if (!Number.isInteger(itemId) || itemId < 1) {
    return res.status(400).json({ error: 'Invalid item id' });
  }

  try {
    await prisma.menuItem.delete({ where: { id: itemId } });
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    console.error('Failed to delete menu item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
};

// SRS endpoint and backward-compatible endpoint
router.delete('/:id', verifyJWT, deleteItemHandler);
router.delete('/items/:id', verifyJWT, deleteItemHandler);

module.exports = router;
