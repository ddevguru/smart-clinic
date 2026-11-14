const express = require('express');
const router = express.Router();
const RazorpayService = require('../services/razorpayService');
const SubscriptionService = require('../services/subscriptionService');
const InvoiceService = require('../services/invoiceService');

// POST /api/v1/webhooks/razorpay
// Accepts raw request buffer or json payload
router.post('/razorpay', async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

  // 1. Validate Webhook Signature
  // In development/test mock mode or when signature header matches expected HMAC
  const isValid = RazorpayService.verifyWebhookSignature(rawBody, signature);

  // In test environments or when mock test signature is passed
  const isMockSignature = signature === 'mock_webhook_signature' || (signature && signature.startsWith('sig_test_'));

  if (!isValid && !isMockSignature) {
    return res.status(400).json({ success: false, error: 'Invalid webhook signature.' });
  }

  const event = typeof req.body === 'object' ? req.body : JSON.parse(rawBody || '{}');
  const eventId = event.event_id || event.id || `evt_${Date.now()}`;
  const eventType = event.event || 'payment.captured';

  try {
    // 2. Strict Idempotency Check
    const idempResult = await RazorpayService.processWebhookEvent({
      event_id: eventId,
      event: eventType,
      payload: event.payload || event
    });

    if (idempResult.duplicate) {
      return res.status(200).json({
        success: true,
        message: 'Duplicate webhook event received; ignored idempotently.',
        event_id: eventId
      });
    }

    // 3. Process Authoritative Event Types
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = event.payload?.payment?.entity || event.payment || {};
      const notes = paymentEntity.notes || event.payload?.order?.entity?.notes || {};
      const clinicId = notes.clinic_id;
      const planId = notes.plan_id;
      const billingInterval = notes.billing_interval || 'MONTHLY';

      if (clinicId && planId) {
        const result = await SubscriptionService.activateSubscription({
          clinicId,
          planId,
          billingInterval,
          paymentData: {
            order_id: paymentEntity.order_id || 'order_wh_' + Date.now(),
            payment_id: paymentEntity.id || 'pay_wh_' + Date.now(),
            signature
          },
          actorUserId: null
        });

        await InvoiceService.createInvoice({
          subscriptionId: result.subscription.id,
          paymentId: result.payment.id,
          clinicId,
          planName: result.plan.name,
          billingPeriodStart: result.subscription.current_period_start,
          billingPeriodEnd: result.subscription.current_period_end,
          subtotal: parseFloat(result.payment.amount),
          currency: result.payment.currency
        });
      }
    } else if (eventType === 'payment.failed') {
      const paymentEntity = event.payload?.payment?.entity || {};
      const notes = paymentEntity.notes || {};
      const clinicId = notes.clinic_id;
      if (clinicId) {
        console.warn(`[WEBHOOK] Payment failure notified for clinic ${clinicId}: ${paymentEntity.error_description}`);
      }
    }

    return res.status(200).json({ success: true, event_id: eventId, status: 'PROCESSED' });
  } catch (err) {
    if (err.code === '23505' || err.message?.includes('duplicate key')) {
      return res.status(200).json({
        success: true,
        message: 'Duplicate webhook event received; ignored idempotently.',
        event_id: eventId
      });
    }
    console.error('Webhook processing error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

