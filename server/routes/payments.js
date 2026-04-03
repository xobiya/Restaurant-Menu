const crypto = require('crypto');
const express = require('express');
const prisma = require('../prismaClient');
const verifyJWT = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

const SUCCESS_STATUSES = new Set(['success', 'succeeded', 'paid', 'completed']);
const FAILED_STATUSES = new Set(['failed', 'cancelled', 'canceled', 'error']);
const PENDING_STATUSES = new Set(['pending', 'processing', 'initiated']);
const DIGITAL_PROVIDERS = ['Chapa', 'Telebirr'];

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

const normalizeProvider = (provider) => {
  const normalized = String(provider || '').trim().toLowerCase();
  if (normalized === 'chapa') return 'Chapa';
  if (normalized === 'telebirr') return 'Telebirr';
  if (['m-pesa', 'mpesa', 'cbe birr', 'card', 'hellocash'].includes(normalized)) return 'Chapa';
  return null;
};

const normalizeGatewayStatus = (status) => {
  const normalized = String(status || '').trim().toLowerCase();
  if (SUCCESS_STATUSES.has(normalized)) return 'Paid';
  if (FAILED_STATUSES.has(normalized)) return 'Failed';
  if (PENDING_STATUSES.has(normalized)) return 'Pending';
  return null;
};

const createTxRef = (orderId, provider) =>
  `${provider.toLowerCase()}_${orderId}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

const serializePayment = (payment) => ({
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
  order: payment.order
    ? {
        id: payment.order.id,
        order_number: payment.order.order_number || payment.order.id,
        table_number: payment.order.table_number,
        table_label: payment.order.table_label || String(payment.order.table_number),
        total_amount: Number(payment.order.total_amount),
        status: payment.order.status,
        payment_status: payment.order.payment_status,
        payment_method: payment.order.payment_method || 'Cash',
      }
    : null,
});

const serializeOrder = (order) => ({
  id: order.id,
  order_number: order.order_number || order.id,
  customer_name: order.customer_name || 'Guest',
  customer_phone: order.customer_phone || null,
  table_number: order.table_number,
  table_label: order.table_label || String(order.table_number),
  subtotal_amount: Number(order.subtotal_amount ?? order.total_amount),
  service_charge: Number(order.service_charge ?? 0),
  total_amount: Number(order.total_amount),
  status: order.status,
  payment_method: order.payment_method || 'Cash',
  payment_status: order.payment_status,
  created_at: order.created_at,
  updated_at: order.updated_at,
  orderItems: (order.orderItems || []).map((item) => ({
    id: item.id,
    orderId: item.orderId,
    menuItemId: item.menuItemId,
    quantity: item.quantity,
    subtotal: Number(item.subtotal),
    menuItem: item.menuItem
      ? {
          id: item.menuItem.id,
          name: item.menuItem.name_en || item.menuItem.name || item.menuItem.name_am,
          name_en: item.menuItem.name_en || item.menuItem.name || item.menuItem.name_am,
          name_am: item.menuItem.name_am || item.menuItem.name || item.menuItem.name_en,
          price: Number(item.menuItem.price),
          image_url: item.menuItem.image_url,
          prep_time: item.menuItem.prep_time,
        }
      : null,
  })),
  payments: (order.payments || []).map((payment) => serializePayment(payment)),
});

const syncOrderWithPayment = async (payment, io) => {
  const order = await prisma.order.findUnique({
    where: {
      id: payment.orderId,
    },
  });

  if (!order) return;

  const shouldMoveToPreparing = payment.status === 'Paid' && order.status === 'Pending';
  const mappedOrderPaymentStatus =
    payment.status === 'Paid'
      ? 'Paid'
      : payment.status === 'Failed'
        ? 'Failed'
        : 'Pending';

  const updatedOrder = await prisma.order.update({
    where: {
      id: order.id,
    },
    data: {
      payment_status: mappedOrderPaymentStatus,
      ...(shouldMoveToPreparing ? { status: 'Preparing' } : {}),
    },
    include: {
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
    },
  });

  if (!io) return;

  const responseOrder = serializeOrder(updatedOrder);
  io.emit(`orderStatusUpdate:${order.id}`, responseOrder);
  io.emit('orderUpdated', responseOrder);
  io.emit('statusUpdated', responseOrder);
  io.emit('paymentUpdated', {
    orderId: order.id,
    paymentId: payment.id,
    paymentStatus: payment.status,
    orderPaymentStatus: updatedOrder.payment_status,
  });
};

const initializePayment = async (req, res, forcedProvider) => {
  const { orderId, provider, customerInfo = {} } = req.body;
  const requestedProvider = String(provider || forcedProvider || '').trim();
  const normalizedProvider = forcedProvider || normalizeProvider(requestedProvider);

  if (!orderId) {
    return res.status(400).json({ error: 'orderId is required' });
  }

  if (!normalizedProvider || !DIGITAL_PROVIDERS.includes(normalizedProvider)) {
    return res
      .status(400)
      .json({ error: `provider must be one of: ${DIGITAL_PROVIDERS.join(', ')}` });
  }

  try {
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      select: {
        id: true,
        total_amount: true,
        payment_status: true,
        payment_method: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.payment_status === 'Paid') {
      return res.status(400).json({ error: 'Order is already paid' });
    }

    const txRef = createTxRef(order.id, normalizedProvider);
    const checkoutUrl = `${frontendUrl}/payment/${encodeURIComponent(txRef)}`;

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: normalizedProvider,
        requested_provider: requestedProvider || normalizedProvider,
        tx_ref: txRef,
        amount: Number(order.total_amount),
        currency: 'ETB',
        status: 'Pending',
        checkout_url: checkoutUrl,
        raw_payload: {
          type: 'initialize',
          provider: normalizedProvider,
          requested_provider: requestedProvider || normalizedProvider,
          customer: customerInfo,
          mode:
            normalizedProvider === 'Chapa'
              ? process.env.CHAPA_SECRET_KEY
                ? 'configured'
                : 'mock'
              : process.env.TELEBIRR_KEY
                ? 'configured'
                : 'mock',
        },
      },
    });

    await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        payment_method: requestedProvider || normalizedProvider,
        payment_status: 'Pending',
      },
    });

    return res.json({
      paymentId: payment.id,
      tx_ref: payment.tx_ref,
      provider: payment.provider,
      requestedProvider: payment.requested_provider,
      amount: Number(payment.amount),
      currency: payment.currency,
      checkoutUrl: payment.checkout_url,
      mode:
        normalizedProvider === 'Chapa'
          ? process.env.CHAPA_SECRET_KEY
            ? 'configured'
            : 'mock'
          : process.env.TELEBIRR_KEY
            ? 'configured'
            : 'mock',
    });
  } catch (error) {
    console.error('Payment initialization failed:', error);
    return res.status(500).json({ error: 'Failed to initialize payment' });
  }
};

const processWebhook = async (req, res, forcedProvider) => {
  const { tx_ref, status, provider, gateway_reference } = req.body;

  if (!tx_ref || !status) {
    return res.status(400).json({ error: 'Missing tx_ref or status' });
  }

  const normalizedStatus = normalizeGatewayStatus(status);
  if (!normalizedStatus) {
    return res.status(400).json({ error: 'Unrecognized payment status' });
  }

  try {
    const payment = await prisma.payment.findUnique({
      where: {
        tx_ref,
      },
    });

    if (!payment) {
      return res.status(404).json({ error: 'Unknown transaction reference' });
    }

    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers['x-payment-signature'];
      const hash = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (signature !== hash) {
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
    }

    const updatedPayment = await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: normalizedStatus,
        gateway_reference: gateway_reference || payment.gateway_reference,
        raw_payload: {
          ...(payment.raw_payload || {}),
          type: 'webhook',
          provider: forcedProvider || provider || payment.provider,
          received_status: status,
          payload: req.body,
        },
      },
    });

    await syncOrderWithPayment(updatedPayment, req.io);
    return res.status(200).send('Webhook processed');
  } catch (error) {
    console.error('Payment webhook failed:', error);
    return res.status(500).send('Internal Server Error');
  }
};

// POST /api/payments/initiate
router.post('/initiate', async (req, res) => initializePayment(req, res));

// POST /api/payments/chapa/initialize
router.post('/chapa/initialize', async (req, res) => initializePayment(req, res, 'Chapa'));

// POST /api/payments/telebirr/initialize
router.post('/telebirr/initialize', async (req, res) => initializePayment(req, res, 'Telebirr'));

// POST /api/payments/mock/complete
router.post('/mock/complete', async (req, res) => {
  const { tx_ref, status, gateway_reference } = req.body;

  if (!tx_ref || !status) {
    return res.status(400).json({ error: 'tx_ref and status are required' });
  }

  const normalizedStatus = normalizeGatewayStatus(status);
  if (!normalizedStatus) {
    return res.status(400).json({ error: 'Invalid payment status for simulation' });
  }

  try {
    const payment = await prisma.payment.findUnique({
      where: {
        tx_ref,
      },
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment transaction not found' });
    }

    const updatedPayment = await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: normalizedStatus,
        gateway_reference: gateway_reference || payment.gateway_reference,
        raw_payload: {
          ...(payment.raw_payload || {}),
          type: 'mock-complete',
          received_status: status,
        },
      },
    });

    await syncOrderWithPayment(updatedPayment, req.io);

    return res.json({
      message: 'Payment simulation processed',
      payment: serializePayment(updatedPayment),
    });
  } catch (error) {
    console.error('Payment simulation failed:', error);
    return res.status(500).json({ error: 'Failed to complete mock payment' });
  }
});

// POST /api/payments/webhook
router.post('/webhook', async (req, res) => processWebhook(req, res));

// POST /api/payments/chapa/webhook
router.post('/chapa/webhook', async (req, res) => processWebhook(req, res, 'Chapa'));

// POST /api/payments/telebirr/webhook
router.post('/telebirr/webhook', async (req, res) => processWebhook(req, res, 'Telebirr'));

// GET /api/payments
router.get('/', verifyJWT, requireRole('ADMIN'), async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: {
        created_at: 'desc',
      },
      include: {
        order: {
          select: {
            id: true,
            order_number: true,
            table_number: true,
            table_label: true,
            status: true,
            payment_status: true,
            payment_method: true,
            total_amount: true,
          },
        },
      },
    });

    return res.json(payments.map(serializePayment));
  } catch (error) {
    console.error('Failed to fetch payments:', error);
    return res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// GET /api/payments/tx/:txRef
router.get('/tx/:txRef', async (req, res) => {
  const txRef = req.params.txRef;

  try {
    const payment = await prisma.payment.findUnique({
      where: {
        tx_ref: txRef,
      },
      include: {
        order: {
          select: {
            id: true,
            order_number: true,
            table_number: true,
            table_label: true,
            total_amount: true,
            status: true,
            payment_status: true,
            payment_method: true,
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment transaction not found' });
    }

    return res.json(serializePayment(payment));
  } catch (error) {
    console.error('Failed to fetch payment transaction:', error);
    return res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

module.exports = router;
