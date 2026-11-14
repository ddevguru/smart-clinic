const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { query } = require('../config/db');
const { authenticateToken, requireClinicTenant, requireRoles } = require('../middleware/auth');
const SubscriptionService = require('../services/subscriptionService');
const RazorpayService = require('../services/razorpayService');
const InvoiceService = require('../services/invoiceService');
const AnalyticsService = require('../services/analyticsService');

// Public route to view plans (or authenticated)
router.get('/plans', async (req, res) => {
  try {
    const plans = await SubscriptionService.getActivePlans();
    return res.status(200).json({ success: true, data: { plans } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// All following routes require authentication
router.use(authenticateToken);

// GET /api/v1/clinic/subscriptions/current
router.get('/current', requireClinicTenant, async (req, res) => {
  try {
    const details = await SubscriptionService.getClinicSubscription(req.clinicId);
    return res.status(200).json({ success: true, data: details });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/v1/clinic/subscriptions/start-trial
router.post('/start-trial', requireClinicTenant, requireRoles('CLINIC_OWNER'), async (req, res) => {
  try {
    const sub = await SubscriptionService.startFreeTrial(req.clinicId, req.user.id);
    return res.status(201).json({
      success: true,
      data: {
        message: '14-day free trial activated successfully!',
        subscription: sub
      }
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/v1/clinic/subscriptions/create-order
// Server-authoritative order creation: price is determined from DB, never trusted from client
router.post('/create-order', requireClinicTenant, requireRoles('CLINIC_OWNER'), async (req, res) => {
  const { plan_id, billing_interval = 'MONTHLY' } = req.body;
  if (!plan_id) {
    return res.status(400).json({ success: false, error: { message: 'plan_id is required.' } });
  }

  try {
    const plan = await SubscriptionService.getPlan(plan_id);
    if (!plan) {
      return res.status(404).json({ success: false, error: { message: 'Subscription plan not found.' } });
    }

    const interval = billing_interval.toUpperCase();
    const subtotal = interval === 'YEARLY' ? parseFloat(plan.yearly_price) : parseFloat(plan.monthly_price);
    const taxAmount = +(subtotal * 0.18).toFixed(2);
    const totalAmount = +(subtotal + taxAmount).toFixed(2);

    const order = await RazorpayService.createOrder({
      amount: totalAmount,
      currency: plan.currency || 'INR',
      receipt: `sub_${req.clinicId.slice(0, 8)}_${Date.now()}`,
      notes: {
        clinic_id: req.clinicId,
        plan_id: plan.id,
        plan_code: plan.code,
        billing_interval: interval,
        subtotal,
        tax_amount: taxAmount
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        order_id: order.id,
        amount: totalAmount,
        currency: order.currency,
        subtotal,
        tax_amount: taxAmount,
        plan: {
          id: plan.id,
          name: plan.name,
          code: plan.code,
          billing_interval: interval
        },
        key_id: RazorpayService.getKeyId()
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/v1/clinic/subscriptions/verify-payment
router.post('/verify-payment', requireClinicTenant, requireRoles('CLINIC_OWNER'), async (req, res) => {
  const { plan_id, billing_interval = 'MONTHLY', order_id, payment_id, signature } = req.body;

  if (!plan_id || !order_id || !payment_id) {
    return res.status(400).json({ success: false, error: { message: 'Missing required payment verification details.' } });
  }

  // 1. Authoritative Server-side Signature Verification
  const isValid = RazorpayService.verifyPaymentSignature({
    order_id,
    payment_id,
    signature: signature || ''
  });

  if (!isValid) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid payment signature. Subscription activation aborted.' }
    });
  }

  try {
    // 2. Activate Subscription
    const result = await SubscriptionService.activateSubscription({
      clinicId: req.clinicId,
      planId: plan_id,
      billingInterval: billing_interval,
      paymentData: { order_id, payment_id, signature },
      actorUserId: req.user.id
    });

    // 3. Generate Tax Invoice
    const invoice = await InvoiceService.createInvoice({
      subscriptionId: result.subscription.id,
      paymentId: result.payment.id,
      clinicId: req.clinicId,
      planName: result.plan.name,
      billingPeriodStart: result.subscription.current_period_start,
      billingPeriodEnd: result.subscription.current_period_end,
      subtotal: parseFloat(result.payment.amount),
      currency: result.payment.currency
    });

    return res.status(200).json({
      success: true,
      data: {
        message: 'Subscription payment verified and activated successfully!',
        subscription: result.subscription,
        payment: result.payment,
        invoice: {
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          total_amount: invoice.total_amount,
          status: invoice.status
        }
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/v1/clinic/subscriptions/cancel
router.post('/cancel', requireClinicTenant, requireRoles('CLINIC_OWNER'), async (req, res) => {
  const { cancel_at_period_end = true, reason } = req.body;
  try {
    const updated = await SubscriptionService.cancelSubscription({
      clinicId: req.clinicId,
      cancelAtPeriodEnd: cancel_at_period_end,
      reason,
      actorUserId: req.user.id
    });
    return res.status(200).json({
      success: true,
      data: {
        message: cancel_at_period_end
          ? 'Subscription will cancel automatically at the end of the current billing cycle.'
          : 'Subscription cancelled immediately.',
        subscription: updated
      }
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/v1/clinic/subscriptions/invoices
router.get('/invoices', requireClinicTenant, async (req, res) => {
  try {
    const invoices = await query(`
      SELECT * FROM subscription_invoices
      WHERE clinic_id = $1
      ORDER BY created_at DESC;
    `, [req.clinicId]);
    return res.status(200).json({ success: true, data: { invoices: invoices.rows } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/v1/clinic/subscriptions/invoices/:id/download
router.get('/invoices/:id/download', requireClinicTenant, async (req, res) => {
  const { id } = req.params;
  try {
    const invRes = await query('SELECT * FROM subscription_invoices WHERE id = $1 AND clinic_id = $2', [id, req.clinicId]);
    if (invRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Invoice not found or access denied.' } });
    }
    const invoice = invRes.rows[0];

    // Ensure PDF file exists on disk
    let filePath = invoice.pdf_file_path;
    if (!filePath || !fs.existsSync(filePath)) {
      filePath = await InvoiceService.generateInvoicePdf(invoice.id);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoice_number}.pdf"`);
    return res.sendFile(path.resolve(filePath));
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/v1/clinic/subscriptions/payments
router.get('/payments', requireClinicTenant, async (req, res) => {
  try {
    const payments = await query(`
      SELECT sp.*, cs.billing_interval
      FROM subscription_payments sp
      LEFT JOIN clinic_subscriptions cs ON sp.subscription_id = cs.id
      WHERE sp.clinic_id = $1
      ORDER BY sp.created_at DESC;
    `, [req.clinicId]);
    return res.status(200).json({ success: true, data: { payments: payments.rows } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/v1/clinic/subscriptions/billing-profile
router.get('/billing-profile', requireClinicTenant, async (req, res) => {
  try {
    const bp = await query('SELECT * FROM billing_profiles WHERE clinic_id = $1', [req.clinicId]);
    return res.status(200).json({ success: true, data: bp.rows[0] || null });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// PUT /api/v1/clinic/subscriptions/billing-profile
router.put('/billing-profile', requireClinicTenant, requireRoles('CLINIC_OWNER'), async (req, res) => {
  const {
    legal_business_name,
    gstin,
    pan,
    billing_address,
    city,
    state,
    postal_code,
    contact_email,
    contact_phone,
    place_of_supply
  } = req.body;

  try {
    const updated = await query(`
      INSERT INTO billing_profiles (
        id, clinic_id, legal_business_name, gstin, pan, billing_address,
        city, state, postal_code, contact_email, contact_phone, place_of_supply,
        updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()
      )
      ON CONFLICT (clinic_id) DO UPDATE SET
        legal_business_name = COALESCE(EXCLUDED.legal_business_name, billing_profiles.legal_business_name),
        gstin = COALESCE(EXCLUDED.gstin, billing_profiles.gstin),
        pan = COALESCE(EXCLUDED.pan, billing_profiles.pan),
        billing_address = COALESCE(EXCLUDED.billing_address, billing_profiles.billing_address),
        city = COALESCE(EXCLUDED.city, billing_profiles.city),
        state = COALESCE(EXCLUDED.state, billing_profiles.state),
        postal_code = COALESCE(EXCLUDED.postal_code, billing_profiles.postal_code),
        contact_email = COALESCE(EXCLUDED.contact_email, billing_profiles.contact_email),
        contact_phone = COALESCE(EXCLUDED.contact_phone, billing_profiles.contact_phone),
        place_of_supply = COALESCE(EXCLUDED.place_of_supply, billing_profiles.place_of_supply),
        updated_at = NOW()
      RETURNING *;
    `, [
      req.clinicId,
      legal_business_name || 'Clinic Legal Entity',
      gstin || null,
      pan || null,
      billing_address || 'Clinic Premises',
      city || 'Bengaluru',
      state || 'Karnataka',
      postal_code || '560001',
      contact_email || 'billing@clinic.in',
      contact_phone || '+919876543210',
      place_of_supply || 'Karnataka (29)'
    ]);

    return res.status(200).json({ success: true, data: updated.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/v1/clinic/subscriptions/analytics
// Clinic Operational Performance Analytics (Separate from SaaS fee reports)
router.get('/analytics', requireClinicTenant, async (req, res) => {
  try {
    const stats = await AnalyticsService.getClinicOperationalAnalytics(req.clinicId, req.query);
    return res.status(200).json({ success: true, data: stats });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;

