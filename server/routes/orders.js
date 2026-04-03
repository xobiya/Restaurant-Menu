const express = require('express');
const prisma = require('../prismaClient');
const verifyJWT = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

const ORDER_STATUSES = ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'];
const VALID_TRANSITIONS = {
  Pending: ['Preparing', 'Cancelled'],
  Preparing: ['Ready', 'Cancelled'],
  Ready: ['Completed'],
  Completed: [],
  Cancelled: [],
};

const PAYMENT_METHOD_ALIASES = {
  cash: 'Cash',
  chapa: 'Chapa',
  telebirr: 'Telebirr',
  'm-pesa': 'Chapa',
  mpesa: 'Chapa',
  'cbe birr': 'Chapa',
  card: 'Chapa',
  hellocash: 'Chapa',
};

const PAYMENT_STATUSES = ['Unpaid', 'Pending', 'Paid', 'Failed'];

const normalizeText = (value) => {
  if (value === undefined || value === null) return undefined;
  const trimmed = String(value).trim();
  return trimmed || undefined;
};

const parseInteger = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isInteger(parsed) ? parsed : Number.NaN;
};

const parsePositiveIntegerFromMixedValue = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'number') {
    return Number.isInteger(value) && value > 0 ? value : Number.NaN;
  }

  const match = String(value).match(/\d+/);
  if (!match) return Number.NaN;
  const parsed = Number.parseInt(match[0], 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : Number.NaN;
};

const normalizeStatus = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'served') return 'Completed';
  return ORDER_STATUSES.find((status) => status.toLowerCase() === normalized) || null;
};

const normalizePaymentMethod = (value) => {
  const normalized = String(value || 'Cash').trim().toLowerCase();
  return PAYMENT_METHOD_ALIASES[normalized] || (normalized === 'cash' ? 'Cash' : null);
};

const calculateEstimatedTime = (orderItems = []) =>
  orderItems.reduce(
    (total, item) => total + (Number(item.menuItem?.prep_time) || 0) * Number(item.quantity || 0),
    0
  );

const serializeMenuItem = (item) => {
  if (!item) return null;

  return {
    id: item.id,
    name: item.name_en || item.name || item.name_am,
    name_en: item.name_en || item.name || item.name_am,
    name_am: item.name_am || item.name || item.name_en,
    description: item.description_en || item.description || item.description_am || '',
    description_en: item.description_en || item.description || item.description_am || '',
    description_am: item.description_am || item.description || item.description_en || '',
    price: Number(item.price),
    image_url: item.image_url,
    prep_time: item.prep_time,
    is_fasting: item.is_fasting,
    is_veg: item.is_veg,
    spiciness: item.spiciness,
  };
};

const serializeOrderItem = (item) => ({
  id: item.id,
  orderId: item.orderId,
  menuItemId: item.menuItemId,
  quantity: item.quantity,
  subtotal: Number(item.subtotal),
  menuItem: serializeMenuItem(item.menuItem),
});

const serializePayment = (payment) => {
  if (!payment) return null;

  return {
    id: payment.id,
    orderId: payment.orderId,
    provider: payment.provider,
    requested_provider: payment.requested_provider || payment.provider,
    tx_ref: payment.tx_ref,
    amount: Number(payment.amount),
    currency: payment.currency,
    status: payment.status,
    checkout_url: payment.checkout_url,
    gateway_reference: payment.gateway_reference,
    raw_payload: payment.raw_payload,
    created_at: payment.created_at,
    updated_at: payment.updated_at,
  };
};

const serializeOrder = (order) => ({
  id: order.id,
  order_number: order.order_number || order.id,
  orderNumber: order.order_number || order.id,
  customer_name: order.customer_name || 'Guest',
  customer_phone: order.customer_phone || null,
  table_number: order.table_number,
  table_label: order.table_label || String(order.table_number),
  table_display: order.table_label || `#${order.table_number}`,
  subtotal_amount: Number(order.subtotal_amount ?? order.total_amount),
  service_charge: Number(order.service_charge ?? 0),
  total_amount: Number(order.total_amount),
  total_etb: Number(order.total_amount),
  status: order.status,
  payment_method: order.payment_method || 'Cash',
  payment_status: order.payment_status,
  notes: order.notes || null,
  created_at: order.created_at,
  updated_at: order.updated_at,
  estimatedReadyTimeMinutes: calculateEstimatedTime(order.orderItems),
  orderItems: (order.orderItems || []).map(serializeOrderItem),
  payments: (order.payments || []).map(serializePayment),
  user: order.user
    ? {
        id: order.user.id,
        name: order.user.name,
        role: order.user.role,
        email: order.user.email,
        phone: order.user.phone,
      }
    : null,
});

const orderInclude = {
  orderItems: {
    include: {
      menuItem: true,
    },
  },
  payments: {
    orderBy: {
      created_at: 'desc',
    },
  },
  user: {
    select: {
      id: true,
      name: true,
      role: true,
      email: true,
      phone: true,
    },
  },
};

const emitOrderEvents = (io, type, order) => {
  if (!io) return;

  io.emit(type, order);
  io.emit('orderUpdated', order);
  io.emit(`orderStatusUpdate:${order.id}`, order);

  if (type === 'orderPlaced') {
    io.emit('newOrder', order);
  }

  if (type === 'statusUpdated') {
    io.emit('statusUpdated', order);
  }
};

const createOrderNumber = async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}`;
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `AA-${stamp}-${suffix}`;

    const existing = await prisma.order.findUnique({
      where: {
        order_number: orderNumber,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return orderNumber;
    }
  }

  return `AA-${Date.now()}`;
};

// GET /api/orders/summary
router.get('/summary', verifyJWT, requireRole('ADMIN'), async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todaysOrders = await prisma.order.findMany({
      where: {
        created_at: {
          gte: startOfDay,
        },
      },
      include: orderInclude,
      orderBy: {
        created_at: 'desc',
      },
    });

    const totalRevenue = todaysOrders.reduce((sum, order) => {
      const cashCompleted = order.payment_method === 'Cash' && order.status === 'Completed';
      const paid = order.payment_status === 'Paid';
      return paid || cashCompleted ? sum + Number(order.total_amount) : sum;
    }, 0);

    const itemMap = new Map();
    todaysOrders.forEach((order) => {
      (order.orderItems || []).forEach((item) => {
        const current = itemMap.get(item.menuItemId) || {
          id: item.menuItemId,
          name: item.menuItem?.name_en || item.menuItem?.name || `Item ${item.menuItemId}`,
          quantity: 0,
          revenue: 0,
        };

        current.quantity += Number(item.quantity);
        current.revenue += Number(item.subtotal);
        itemMap.set(item.menuItemId, current);
      });
    });

    const popularItems = [...itemMap.values()]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return res.json({
      totals: {
        todayOrders: todaysOrders.length,
        activeOrders: todaysOrders.filter((order) =>
          ['Pending', 'Preparing', 'Ready'].includes(order.status)
        ).length,
        completedOrders: todaysOrders.filter((order) => order.status === 'Completed').length,
        revenue_etb: Number(totalRevenue.toFixed(2)),
        averageTicket_etb: todaysOrders.length
          ? Number((totalRevenue / todaysOrders.length).toFixed(2))
          : 0,
      },
      popularItems,
      latestOrders: todaysOrders.slice(0, 5).map(serializeOrder),
    });
  } catch (error) {
    console.error('Failed to fetch order summary:', error);
    return res.status(500).json({ error: 'Failed to fetch order summary' });
  }
});

// GET /api/orders
router.get('/', verifyJWT, requireRole('ADMIN', 'KITCHEN'), async (req, res) => {
  try {
    const status = normalizeStatus(req.query.status);
    const where = status
      ? {
          status,
        }
      : {};

    const orders = await prisma.order.findMany({
      where,
      orderBy: {
        created_at: 'desc',
      },
      include: orderInclude,
    });

    return res.json(orders.map(serializeOrder));
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/my
router.get('/my', async (req, res) => {
  const phone = normalizeText(req.query.phone);

  if (!phone) {
    return res.json([]);
  }

  try {
    const orders = await prisma.order.findMany({
      where: {
        customer_phone: phone,
      },
      orderBy: {
        created_at: 'desc',
      },
      include: orderInclude,
      take: 20,
    });

    return res.json(orders.map(serializeOrder));
  } catch (error) {
    console.error('Failed to fetch customer orders:', error);
    return res.status(500).json({ error: 'Failed to fetch customer orders' });
  }
});

// POST /api/orders
router.post('/', async (req, res) => {
  const customerName = normalizeText(req.body.customer_name || req.body.customerName) || 'Guest';
  const customerPhone = normalizeText(req.body.customer_phone || req.body.customerPhone);
  const tableLabel =
    normalizeText(req.body.table_label || req.body.tableLabel) ||
    normalizeText(req.body.table_number || req.body.tableNumber);
  const tableNumber = parsePositiveIntegerFromMixedValue(
    req.body.table_number ?? req.body.tableNumber ?? req.body.table
  );
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  const notes = normalizeText(req.body.notes);
  const paymentMethod = normalizePaymentMethod(req.body.payment_method || req.body.paymentMethod || 'Cash');

  if (!Number.isInteger(tableNumber) || tableNumber < 1) {
    return res.status(400).json({ error: 'table_number must include a positive table or seat number' });
  }

  if (!items.length) {
    return res.status(400).json({ error: 'At least one menu item is required' });
  }

  if (!paymentMethod) {
    return res.status(400).json({ error: 'Unsupported payment method' });
  }

  for (const item of items) {
    const menuItemId = parseInteger(item.menuItemId ?? item.itemId ?? item.id);
    const quantity = parseInteger(item.quantity);

    if (!Number.isInteger(menuItemId) || menuItemId < 1) {
      return res.status(400).json({ error: 'Invalid menu item in order' });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ error: 'Item quantity must be a positive integer' });
    }
  }

  try {
    await prisma.table.upsert({
      where: {
        number: tableNumber,
      },
      update: {
        label: tableLabel || `Table ${tableNumber}`,
      },
      create: {
        number: tableNumber,
        label: tableLabel || `Table ${tableNumber}`,
      },
    });

    const menuItemIds = items.map((item) => parseInteger(item.menuItemId ?? item.itemId ?? item.id));
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: {
          in: menuItemIds,
        },
      },
    });

    let subtotalAmount = 0;
    const orderItemsData = [];

    for (const rawItem of items) {
      const menuItemId = parseInteger(rawItem.menuItemId ?? rawItem.itemId ?? rawItem.id);
      const quantity = parseInteger(rawItem.quantity);
      const dbItem = menuItems.find((item) => item.id === menuItemId);

      if (!dbItem) {
        return res.status(404).json({ error: `Menu item ${menuItemId} not found` });
      }

      if (!dbItem.is_available) {
        return res.status(400).json({ error: `Menu item ${dbItem.name_en || dbItem.name} is not available` });
      }

      const unitPrice = Number(dbItem.price);
      const itemSubtotal = Number((unitPrice * quantity).toFixed(2));
      subtotalAmount += itemSubtotal;

      orderItemsData.push({
        menuItemId,
        quantity,
        subtotal: itemSubtotal,
      });
    }

    subtotalAmount = Number(subtotalAmount.toFixed(2));
    const serviceCharge = 0;
    const totalAmount = Number((subtotalAmount + serviceCharge).toFixed(2));
    const orderNumber = await createOrderNumber();

    const newOrder = await prisma.order.create({
      data: {
        order_number: orderNumber,
        customer_name: customerName,
        customer_phone: customerPhone || null,
        table_number: tableNumber,
        table_label: tableLabel || String(tableNumber),
        subtotal_amount: subtotalAmount,
        service_charge: serviceCharge,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'Cash' ? 'Unpaid' : 'Pending',
        notes: notes || null,
        userId: req.user?.id && !String(req.user.id).startsWith('legacy-admin-') ? req.user.id : null,
        orderItems: {
          create: orderItemsData,
        },
      },
      include: orderInclude,
    });

    const responseOrder = serializeOrder(newOrder);
    emitOrderEvents(req.io, 'orderPlaced', responseOrder);

    return res.status(201).json(responseOrder);
  } catch (error) {
    console.error('Failed to create order:', error);
    return res.status(500).json({ error: 'Failed to create order' });
  }
});

// GET /api/orders/:id
router.get('/:id', async (req, res) => {
  const identifier = String(req.params.id || '').trim();

  try {
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          {
            id: identifier,
          },
          {
            order_number: identifier,
          },
        ],
      },
      include: orderInclude,
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.json(serializeOrder(order));
  } catch (error) {
    console.error('Failed to fetch order:', error);
    return res.status(500).json({ error: 'Failed to fetch order status' });
  }
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', verifyJWT, requireRole('ADMIN', 'KITCHEN'), async (req, res) => {
  const identifier = String(req.params.id || '').trim();
  const status = normalizeStatus(req.body.status);

  if (!status) {
    return res.status(400).json({ error: `Invalid status. Allowed: ${ORDER_STATUSES.join(', ')}` });
  }

  try {
    const existing = await prisma.order.findFirst({
      where: {
        OR: [{ id: identifier }, { order_number: identifier }],
      },
    });

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
      where: {
        id: existing.id,
      },
      data: {
        status,
      },
      include: orderInclude,
    });

    const responseOrder = serializeOrder(updatedOrder);
    emitOrderEvents(req.io, 'statusUpdated', responseOrder);

    return res.json(responseOrder);
  } catch (error) {
    console.error('Failed to update order status:', error);
    return res.status(500).json({ error: 'Failed to update order status' });
  }
});

// PATCH /api/orders/:id/payment-status
router.patch('/:id/payment-status', verifyJWT, requireRole('ADMIN'), async (req, res) => {
  const identifier = String(req.params.id || '').trim();
  const nextPaymentStatus = PAYMENT_STATUSES.find(
    (status) => status.toLowerCase() === String(req.body.payment_status || req.body.paymentStatus || '').trim().toLowerCase()
  );

  if (!nextPaymentStatus) {
    return res.status(400).json({
      error: `payment_status must be one of: ${PAYMENT_STATUSES.join(', ')}`,
    });
  }

  try {
    const existing = await prisma.order.findFirst({
      where: {
        OR: [{ id: identifier }, { order_number: identifier }],
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updatedOrder = await prisma.order.update({
      where: {
        id: existing.id,
      },
      data: {
        payment_status: nextPaymentStatus,
      },
      include: orderInclude,
    });

    const responseOrder = serializeOrder(updatedOrder);
    emitOrderEvents(req.io, 'statusUpdated', responseOrder);

    return res.json(responseOrder);
  } catch (error) {
    console.error('Failed to update order payment status:', error);
    return res.status(500).json({ error: 'Failed to update order payment status' });
  }
});

module.exports = router;
