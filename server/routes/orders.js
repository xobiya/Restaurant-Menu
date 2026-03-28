const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

// POST /api/orders
// Create a new order
router.post('/', async (req, res) => {
  const { table_number, items } = req.body;
  // items: [{ menuItemId, quantity }]

  if (!table_number || !items || !items.length) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Fetch requested menu items to calculate subtotal and validate availability
    const menuItemIds = items.map((item) => item.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: {
          in: menuItemIds,
        },
      },
    });

    let total_amount = 0;
    const orderItemsData = [];

    for (const item of items) {
      const dbItem = menuItems.find((mi) => mi.id === item.menuItemId);
      if (!dbItem) {
        return res.status(404).json({ error: `Menu item ${item.menuItemId} not found` });
      }
      if (!dbItem.is_available) {
        return res.status(400).json({ error: `Menu item ${dbItem.name} is not available` });
      }

      const subtotal = dbItem.price * item.quantity;
      total_amount += subtotal;

      orderItemsData.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        subtotal: subtotal,
      });
    }

    // 2. Create the order with its orderItems within a transaction
    const newOrder = await prisma.order.create({
      data: {
        table_number,
        total_amount,
        orderItems: {
          create: orderItemsData,
        },
      },
      include: {
        orderItems: true,
      },
    });

    // 3. Emit real-time event
    req.io.emit('newOrder', newOrder);

    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Failed to create order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// GET /api/orders/:id
// Track a specific order status using UUID (to prevent guessing order ids)
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            menuItem: {
              select: {
                name: true,
                image_url: true,
                prep_time: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Calculate dynamic time estimation according to rules
    // Time Estimation: Total Time = Max(prep_time of items in order) + (Queue Factor)
    let maxPrepTime = 0;
    order.orderItems.forEach((oi) => {
      if (oi.menuItem.prep_time > maxPrepTime) {
        maxPrepTime = oi.menuItem.prep_time;
      }
    });

    // Dummy queue factor: e.g., 5 mins
    const queueFactor = 5; 
    const estimatedTime = maxPrepTime + queueFactor;

    res.json({
      ...order,
      estimatedReadyTimeMinutes: estimatedTime,
    });
  } catch (error) {
    console.error('Failed to fetch order:', error);
    res.status(500).json({ error: 'Failed to fetch order status' });
  }
});

module.exports = router;
