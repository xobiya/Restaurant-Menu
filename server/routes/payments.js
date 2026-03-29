const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const crypto = require('crypto');
const verifyJWT = require('../middleware/authMiddleware');

const PAYMENT_PROVIDERS = ['Chapa', 'Telebirr'];
const SUCCESS_STATUSES = new Set(['success', 'succeeded', 'paid', 'completed']);
const FAILED_STATUSES = new Set(['failed', 'cancelled', 'canceled', 'error']);
const PENDING_STATUSES = new Set(['pending', 'processing', 'initiated']);

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

const normalizeProvider = (provider) => {
  const normalized = String(provider || '').trim().toLowerCase();
  if (normalized === 'chapa') return 'Chapa';
  if (normalized === 'telebirr') return 'Telebirr';
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

const syncOrderWithPayment = async (payment, io) => {
  const order = await prisma.order.findUnique({
    where: { id: payment.orderId },
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
    where: { id: order.id },
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
        orderBy: { created_at: 'desc' },
      },
    },
  });

  if (io) {
    io.emit(`orderStatusUpdate:${order.id}`, updatedOrder);
    io.emit('orderUpdated', updatedOrder);
    io.emit('paymentUpdated', {
      orderId: order.id,
      paymentId: payment.id,
      paymentStatus: payment.status,
      orderPaymentStatus: updatedOrder.payment_status,
    });
  }
};

// POST /api/payments/initiate
// Calls Chapa/Telebirr to start a transaction
router.post('/initiate', async (req, res) => {
  const { orderId, provider, customerInfo = {} } = req.body;
  const normalizedProvider = normalizeProvider(provider || 'Chapa');

  if (!orderId) {
    return res.status(400).json({ error: 'orderId is required' });
  }
  if (!normalizedProvider) {
    return res.status(400).json({ error: `provider must be one of: ${PAYMENT_PROVIDERS.join(', ')}` });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        total_amount: true,
        payment_status: true,
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
        tx_ref: txRef,
        amount: Number(order.total_amount),
        currency: 'ETB',
        status: 'Pending',
        checkout_url: checkoutUrl,
        raw_payload: {
          type: 'initiate',
          provider: normalizedProvider,
          customer: customerInfo,
        },
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { payment_status: 'Pending' },
    });

    res.json({
      paymentId: payment.id,
      tx_ref: payment.tx_ref,
      provider: payment.provider,
      amount: payment.amount,
      currency: payment.currency,
      checkoutUrl: payment.checkout_url,
      mode: 'mock',
    });
  } catch (error) {
    console.error('Payment initiation failed:', error);
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
});

// POST /api/payments/mock/complete
// Local dev helper to simulate payment success/failure without gateway credentials.
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
    const payment = await prisma.payment.findUnique({ where: { tx_ref } });
    if (!payment) {
      return res.status(404).json({ error: 'Payment transaction not found' });
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
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

    res.json({
      message: 'Payment simulation processed',
      payment: updatedPayment,
    });
  } catch (error) {
    console.error('Payment simulation failed:', error);
    res.status(500).json({ error: 'Failed to complete mock payment' });
  }
});

// POST /api/payments/webhook
// Securely handles payment status updates
router.post('/webhook', async (req, res) => {
  const { tx_ref, status, provider, gateway_reference } = req.body;

  if (!tx_ref || !status) {
    return res.status(400).json({ error: 'Missing tx_ref or status' });
  }

  const normalizedStatus = normalizeGatewayStatus(status);
  if (!normalizedStatus) {
    return res.status(400).json({ error: 'Unrecognized payment status' });
  }

  try {
    const payment = await prisma.payment.findUnique({ where: { tx_ref } });
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
      where: { id: payment.id },
      data: {
        status: normalizedStatus,
        gateway_reference: gateway_reference || payment.gateway_reference,
        raw_payload: {
          ...(payment.raw_payload || {}),
          type: 'webhook',
          provider: provider || payment.provider,
          received_status: status,
          payload: req.body,
        },
      },
    });

    await syncOrderWithPayment(updatedPayment, req.io);
    res.status(200).send('Webhook processed');
  } catch (error) {
    console.error('Payment webhook failed:', error);
    res.status(500).send('Internal Server Error');
  }
});

// GET /api/payments
// Admin payment monitoring
router.get('/', verifyJWT, async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            table_number: true,
            status: true,
            payment_status: true,
            total_amount: true,
            created_at: true,
          },
        },
      },
    });
    res.json(payments);
  } catch (error) {
    console.error('Failed to fetch payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// GET /api/payments/tx/:txRef
// Lookup transaction by reference for customer payment page.
router.get('/tx/:txRef', async (req, res) => {
  const txRef = req.params.txRef;

  try {
    const payment = await prisma.payment.findUnique({
      where: { tx_ref: txRef },
      include: {
        order: {
          select: {
            id: true,
            table_number: true,
            total_amount: true,
            status: true,
            payment_status: true,
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment transaction not found' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Failed to fetch payment transaction:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

module.exports = router;
