const express = require('express');
const prisma = require('../prismaClient');
const verifyJWT = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

const normalizeText = (value) => {
  if (value === undefined || value === null) return undefined;
  const trimmed = String(value).trim();
  return trimmed || undefined;
};

const parseBoolean = (value) => {
  if (value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.trim().toLowerCase() === 'true';
  return Boolean(value);
};

const parseInteger = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isInteger(parsed) ? parsed : Number.NaN;
};

const parseDecimal = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const slugify = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || undefined;

const serializeItem = (item) => ({
  id: item.id,
  name: item.name_en || item.name || item.name_am,
  name_en: item.name_en || item.name || item.name_am,
  name_am: item.name_am || item.name || item.name_en,
  description: item.description_en || item.description || item.description_am || '',
  description_en: item.description_en || item.description || item.description_am || '',
  description_am: item.description_am || item.description || item.description_en || '',
  portion_note_en: item.portion_note_en || '',
  portion_note_am: item.portion_note_am || '',
  price: Number(item.price),
  price_etb: Number(item.price),
  image_url: item.image_url,
  prep_time: item.prep_time,
  is_available: item.is_available,
  is_fasting: item.is_fasting,
  is_veg: item.is_veg,
  spiciness: item.spiciness,
  featured: item.featured,
  categoryId: item.categoryId,
  created_at: item.created_at,
  updated_at: item.updated_at,
});

const serializeCategory = (category, includeItems = true) => ({
  id: category.id,
  slug: category.slug,
  name: category.name_en || category.name || category.name_am,
  name_en: category.name_en || category.name || category.name_am,
  name_am: category.name_am || category.name || category.name_en,
  description_en: category.description_en || '',
  description_am: category.description_am || '',
  icon: category.icon,
  sort_order: category.sort_order,
  created_at: category.created_at,
  updated_at: category.updated_at,
  ...(includeItems
    ? {
        menuItems: (category.menuItems || []).map(serializeItem),
      }
    : {}),
});

const menuInclude = (includeUnavailable = false) => ({
  where: {
    slug: {
      not: null,
    },
  },
  include: {
    menuItems: {
      where: includeUnavailable ? {} : { is_available: true },
      orderBy: [{ featured: 'desc' }, { name_en: 'asc' }, { name: 'asc' }],
    },
  },
  orderBy: [{ sort_order: 'asc' }, { name_en: 'asc' }, { name: 'asc' }],
});

const parseCategoryPayload = (payload = {}) => {
  const nameEn = normalizeText(payload.name_en || payload.nameEn || payload.name);
  const nameAm = normalizeText(payload.name_am || payload.nameAm);
  const name = nameEn || nameAm;

  return {
    name,
    name_en: nameEn,
    name_am: nameAm,
    description_en: normalizeText(payload.description_en || payload.descriptionEn || payload.description),
    description_am: normalizeText(payload.description_am || payload.descriptionAm),
    icon: normalizeText(payload.icon) || undefined,
    sort_order: parseInteger(payload.sort_order || payload.sortOrder),
    slug: normalizeText(payload.slug) || slugify(nameEn || nameAm || payload.name),
  };
};

const validateCategoryPayload = (payload, required = false) => {
  if (required && !payload.name) {
    return 'Category name is required';
  }

  if (payload.sort_order !== undefined && (!Number.isInteger(payload.sort_order) || payload.sort_order < 0)) {
    return 'sort_order must be an integer greater than or equal to 0';
  }

  return null;
};

const parseItemPayload = (payload = {}) => {
  const nameEn = normalizeText(payload.name_en || payload.nameEn || payload.name);
  const nameAm = normalizeText(payload.name_am || payload.nameAm);
  const descriptionEn = normalizeText(
    payload.description_en || payload.descriptionEn || payload.description
  );
  const descriptionAm = normalizeText(payload.description_am || payload.descriptionAm);
  const categoryId = parseInteger(payload.categoryId);

  return {
    name: nameEn || nameAm,
    name_en: nameEn,
    name_am: nameAm,
    description: descriptionEn || descriptionAm,
    description_en: descriptionEn,
    description_am: descriptionAm,
    portion_note_en: normalizeText(payload.portion_note_en || payload.portionNoteEn),
    portion_note_am: normalizeText(payload.portion_note_am || payload.portionNoteAm),
    price: parseDecimal(payload.price_etb ?? payload.price),
    image_url: normalizeText(payload.image_url || payload.imageUrl),
    prep_time: parseInteger(payload.prep_time || payload.prepTime),
    categoryId,
    is_available: parseBoolean(payload.is_available),
    is_fasting: parseBoolean(payload.is_fasting),
    is_veg: parseBoolean(payload.is_veg),
    featured: parseBoolean(payload.featured),
    spiciness: parseInteger(payload.spiciness),
  };
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
    return 'Prep time must be an integer greater than or equal to 1';
  }
  if (payload.categoryId !== undefined && (!Number.isInteger(payload.categoryId) || payload.categoryId < 1)) {
    return 'categoryId must be a positive integer';
  }
  if (payload.spiciness !== undefined && (!Number.isInteger(payload.spiciness) || payload.spiciness < 0 || payload.spiciness > 3)) {
    return 'spiciness must be an integer from 0 to 3';
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

// GET /api/menu
router.get('/', async (req, res) => {
  try {
    const categoriesWithItems = await prisma.category.findMany(menuInclude(false));
    return res.json(categoriesWithItems.map((category) => serializeCategory(category)));
  } catch (error) {
    console.error('Failed to fetch menu:', error);
    return res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

// GET /api/menu/admin
router.get('/admin', verifyJWT, requireRole('ADMIN'), async (req, res) => {
  try {
    const categoriesWithItems = await prisma.category.findMany(menuInclude(true));
    return res.json(categoriesWithItems.map((category) => serializeCategory(category)));
  } catch (error) {
    console.error('Failed to fetch admin menu:', error);
    return res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

// GET /api/menu/categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        slug: {
          not: null,
        },
      },
      orderBy: [{ sort_order: 'asc' }, { name_en: 'asc' }, { name: 'asc' }],
    });

    return res.json(categories.map((category) => serializeCategory(category, false)));
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/menu/categories
router.post('/categories', verifyJWT, requireRole('ADMIN'), async (req, res) => {
  const payload = parseCategoryPayload(req.body);
  const validationError = validateCategoryPayload(payload, true);

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const category = await prisma.category.create({
      data: {
        name: payload.name,
        name_en: payload.name_en || payload.name,
        name_am: payload.name_am || payload.name,
        description_en: payload.description_en || null,
        description_am: payload.description_am || null,
        icon: payload.icon || 'Utensils',
        sort_order: payload.sort_order ?? 0,
        slug: payload.slug || null,
      },
    });

    return res.status(201).json(serializeCategory(category, false));
  } catch (error) {
    console.error('Failed to create category:', error);
    return res.status(500).json({ error: 'Failed to create category' });
  }
});

// PATCH /api/menu/categories/:id
router.patch('/categories/:id', verifyJWT, requireRole('ADMIN'), async (req, res) => {
  const categoryId = parseInteger(req.params.id);
  if (!Number.isInteger(categoryId) || categoryId < 1) {
    return res.status(400).json({ error: 'Invalid category id' });
  }

  const payload = parseCategoryPayload(req.body);
  const validationError = validateCategoryPayload(payload);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const updateData = Object.fromEntries(
    Object.entries({
      name: payload.name,
      name_en: payload.name_en,
      name_am: payload.name_am,
      description_en: payload.description_en,
      description_am: payload.description_am,
      icon: payload.icon,
      sort_order: payload.sort_order,
      slug: payload.slug,
    }).filter(([, value]) => value !== undefined)
  );

  if (!Object.keys(updateData).length) {
    return res.status(400).json({ error: 'No fields provided for update' });
  }

  try {
    const updated = await prisma.category.update({
      where: { id: categoryId },
      data: updateData,
    });

    return res.json(serializeCategory(updated, false));
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Category not found' });
    }

    console.error('Failed to update category:', error);
    return res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/menu/categories/:id
router.delete('/categories/:id', verifyJWT, requireRole('ADMIN'), async (req, res) => {
  const categoryId = parseInteger(req.params.id);
  if (!Number.isInteger(categoryId) || categoryId < 1) {
    return res.status(400).json({ error: 'Invalid category id' });
  }

  try {
    const itemCount = await prisma.menuItem.count({
      where: {
        categoryId,
      },
    });

    if (itemCount > 0) {
      return res.status(400).json({
        error: 'Delete or move the items in this category before removing it.',
      });
    }

    await prisma.category.delete({
      where: {
        id: categoryId,
      },
    });

    return res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Category not found' });
    }

    console.error('Failed to delete category:', error);
    return res.status(500).json({ error: 'Failed to delete category' });
  }
});

const createItemHandler = async (req, res) => {
  const payload = parseItemPayload(req.body);
  const validationError = validateItemPayload(payload, true);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const category = await prisma.category.findUnique({
      where: {
        id: payload.categoryId,
      },
      select: {
        id: true,
      },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const newItem = await prisma.menuItem.create({
      data: {
        name: payload.name,
        name_en: payload.name_en || payload.name,
        name_am: payload.name_am || payload.name,
        description: payload.description,
        description_en: payload.description_en || payload.description,
        description_am: payload.description_am || payload.description,
        portion_note_en: payload.portion_note_en || null,
        portion_note_am: payload.portion_note_am || null,
        price: payload.price,
        image_url: payload.image_url,
        prep_time: payload.prep_time || 15,
        is_available: payload.is_available !== undefined ? payload.is_available : true,
        is_fasting: payload.is_fasting !== undefined ? payload.is_fasting : false,
        is_veg: payload.is_veg !== undefined ? payload.is_veg : false,
        featured: payload.featured !== undefined ? payload.featured : false,
        spiciness: payload.spiciness ?? 0,
        categoryId: payload.categoryId,
      },
    });

    return res.status(201).json(serializeItem(newItem));
  } catch (error) {
    console.error('Failed to create menu item:', error);
    return res.status(500).json({ error: 'Failed to create item' });
  }
};

router.post('/', verifyJWT, requireRole('ADMIN'), createItemHandler);
router.post('/items', verifyJWT, requireRole('ADMIN'), createItemHandler);

const updateItemHandler = async (req, res) => {
  const itemId = parseInteger(req.params.id);
  if (!Number.isInteger(itemId) || itemId < 1) {
    return res.status(400).json({ error: 'Invalid item id' });
  }

  const payload = parseItemPayload(req.body);
  const validationError = validateItemPayload(payload);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const data = Object.fromEntries(
    Object.entries({
      name: payload.name,
      name_en: payload.name_en,
      name_am: payload.name_am,
      description: payload.description,
      description_en: payload.description_en,
      description_am: payload.description_am,
      portion_note_en: payload.portion_note_en,
      portion_note_am: payload.portion_note_am,
      price: payload.price,
      image_url: payload.image_url,
      prep_time: payload.prep_time,
      categoryId: payload.categoryId,
      is_available: payload.is_available,
      is_fasting: payload.is_fasting,
      is_veg: payload.is_veg,
      featured: payload.featured,
      spiciness: payload.spiciness,
    }).filter(([, value]) => value !== undefined)
  );

  if (!Object.keys(data).length) {
    return res.status(400).json({ error: 'No fields provided for update' });
  }

  try {
    if (data.categoryId !== undefined) {
      const category = await prisma.category.findUnique({
        where: {
          id: data.categoryId,
        },
      });

      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
    }

    const updated = await prisma.menuItem.update({
      where: {
        id: itemId,
      },
      data,
    });

    return res.json(serializeItem(updated));
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    console.error('Failed to update menu item:', error);
    return res.status(500).json({ error: 'Failed to update item' });
  }
};

router.put('/:id', verifyJWT, requireRole('ADMIN'), updateItemHandler);
router.patch('/:id', verifyJWT, requireRole('ADMIN'), updateItemHandler);
router.patch('/items/:id', verifyJWT, requireRole('ADMIN'), updateItemHandler);

const deleteItemHandler = async (req, res) => {
  const itemId = parseInteger(req.params.id);
  if (!Number.isInteger(itemId) || itemId < 1) {
    return res.status(400).json({ error: 'Invalid item id' });
  }

  try {
    await prisma.menuItem.delete({
      where: {
        id: itemId,
      },
    });

    return res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    console.error('Failed to delete menu item:', error);
    return res.status(500).json({ error: 'Failed to delete item' });
  }
};

router.delete('/:id', verifyJWT, requireRole('ADMIN'), deleteItemHandler);
router.delete('/items/:id', verifyJWT, requireRole('ADMIN'), deleteItemHandler);

module.exports = router;
