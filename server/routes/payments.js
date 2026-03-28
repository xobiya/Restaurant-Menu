const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const crypto = require('crypto');
const axios = require('axios');

// POST /api/payments/initiate
// Calls Chapa/Telebirr to start a transaction
router.post('/initiate', async (req, res) => {
  const { orderId, amount, customerInfo } = req.body;

  try {
    // In a real Chapa integration:
    // const chapaResponse = await axios.post('https://api.chapa.co/v1/transaction/initialize', {
    //   amount,
    //   currency: 'ETB',
    //   email: customerInfo.email,
    //   first_name: customerInfo.name,
    //   tx_ref: `order_${orderId}`,
    //   callback_url: `${process.env.BASE_URL}/api/payments/webhook`,
    //   return_url: `${process.env.FRONTEND_URL}/track/${orderId}`,
    // }, {
    //   headers: { Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}` }
    // });
    
    // Mocking the payment URL for now
    const mockPaymentUrl = `https://checkout.chapa.co/checkout/order_${orderId}`;
    
    res.json({ checkoutUrl: mockPaymentUrl });
  } catch (error) {
    console.error('Payment initiation failed:', error);
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
});

// POST /api/payments/webhook
// Securely handles payment status updates
router.post('/webhook', async (req, res) => {
  // Signature Verification (Chapa Example)
  const secret = process.env.CHAPA_SECRET_KEY;
  const hash = crypto.createHmac('sha256', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  // To be enabled in production:
  // if (hash !== req.headers['x-chapa-signature']) {
  //   return res.status(401).json({ error: 'Invalid signature' });
  // }

  const { tx_ref, status } = req.body;
  const orderId = tx_ref.split('_')[1];

  if (status === 'success') {
    try {
      await prisma.order.update({
        where: { id: orderId },
        data: { 
            payment_status: 'Paid',
            status: 'Preparing' // Automatically start preparing upon payment
        }
      });
      res.status(200).send('Webhook Received');
    } catch (error) {
      console.error('Database update failed:', error);
      res.status(500).send('Internal Server Error');
    }
  } else {
    res.status(200).send('Payment Pending/Failed');
  }
});

module.exports = router;
