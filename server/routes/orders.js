const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const verifyJWT = require('../middleware/authMiddleware');

const ORDER_STATUSES = ['Pending', 'Preparing', 'Ready', 'Completed'];
const VALID_TRANSITIONS = {
  Pending: ['Preparing'],
  Preparing: ['Ready'],
  Ready: ['Completed'],
  Completed: [],
};

const calculateEstimatedTime = (orderItems = []) =>
  orderItems.reduce(
    (total, item) => total + (item.menuItem?.prep_time || 0) * item.quantity,
    0
  );

// GET /api/orders
// Fetch all orders for admin dashboard
router.get('/', verifyJWT, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        orderItems: {
          include: {
            menuItem: true,
          },
        },
        payments: {
          orderBy: { created_at: 'desc' },
        },
      },
    });

    const withEta = orders.map((order) => ({
      ...order,
      estimatedReadyTimeMinutes: calculateEstimatedTime(order.orderItems),
    }));

    res.json(withEta);
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// POST /api/orders
router.post('/', async (req, res) => {
  const { table_number, items } = req.body;
  // items: [{ menuItemId, quantity }]

  if (!table_number || !items || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const parsedTableNumber = Number(table_number);
  if (!Number.isInteger(parsedTableNumber) || parsedTableNumber < 1) {
    return res.status(400).json({ error: 'table_number must be a positive integer' });
  }

  for (const item of items) {
    if (!Number.isInteger(Number(item.menuItemId)) || Number(item.menuItemId) < 1) {
      return res.status(400).json({ error: 'Invalid menuItemId in items' });
    }
    if (!Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1) {
      return res.status(400).json({ error: 'Item quantity must be an integer >= 1' });
    }
  }

  try {
    const table = await prisma.table.upsert({
      where: { number: parsedTableNumber },
      update: {},
      create: { number: parsedTableNumber },
    });

    if (!table.is_active) {
      return res.status(400).json({ error: 'This table is currently inactive' });
    }

    // 1. Fetch requested menu items to calculate subtotal and validate availability
    const menuItemIds = items.map((item) => Number(item.menuItemId));
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: {
          in: menuItemIds,
        },
      },
    });

    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of items) {
      const menuItemId = Number(item.menuItemId);
      const quantity = Number(item.quantity);
      const dbItem = menuItems.find((mi) => mi.id === menuItemId);
      if (!dbItem) {
        return res.status(404).json({ error: `Menu item ${menuItemId} not found` });
      }
      if (!dbItem.is_available) {
        return res.status(400).json({ error: `Menu item ${dbItem.name} is not available` });
      }

      const unitPrice = Number(dbItem.price);
      const subtotal = Number((unitPrice * quantity).toFixed(2));
      totalAmount += subtotal;

      orderItemsData.push({
        menuItemId,
        quantity,
        subtotal: subtotal,
      });
    }

    totalAmount = Number(totalAmount.toFixed(2));

    // 2. Create the order with its orderItems within a transaction
    const newOrder = await prisma.order.create({
      data: {
        table_number: parsedTableNumber,
        total_amount: totalAmount,
        orderItems: {
          create: orderItemsData,
        },
      },
      include: {
        orderItems: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    const responseOrder = {
      ...newOrder,
      estimatedReadyTimeMinutes: calculateEstimatedTime(newOrder.orderItems),
    };

    // 3. Emit real-time event
    req.io.emit('newOrder', responseOrder);

    res.status(201).json(responseOrder);
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
        payments: {
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            provider: true,
            status: true,
            tx_ref: true,
            checkout_url: true,
            created_at: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // SRS formula: Total Time = Σ (prep_time × quantity)
    const estimatedTime = calculateEstimatedTime(order.orderItems);

    res.json({
      ...order,
      estimatedReadyTimeMinutes: estimatedTime,
    });
  } catch (error) {
    console.error('Failed to fetch order:', error);
    res.status(500).json({ error: 'Failed to fetch order status' });
  }
});

// PATCH /api/orders/:id/status
// Update order status (Pending -> Preparing -> etc.)
router.patch('/:id/status', verifyJWT, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Allowed: ${ORDER_STATUSES.join(', ')}` });
  }

  try {
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (existing.status !== status) {
      const allowedNext = VALID_TRANSITIONS[existing.status] || [];
      if (!allowedNext.includes(status)) {
        return res.status(400).json({
          error: `Invalid transition from ${existing.status} to ${status}`,
        });
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        orderItems: {
          include: { menuItem: true },
        },
        payments: {
          orderBy: { created_at: 'desc' },
        },
      },
    });

    const responseOrder = {
      ...updatedOrder,
      estimatedReadyTimeMinutes: calculateEstimatedTime(updatedOrder.orderItems),
    };

    // Notify clients (customer's TrackView and other admins)
    req.io.emit(`orderStatusUpdate:${id}`, responseOrder);
    req.io.emit('orderUpdated', responseOrder);

    res.json(responseOrder);
  } catch (error) {
    console.error('Failed to update order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

module.exports = router;
