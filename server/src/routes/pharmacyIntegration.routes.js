const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const pharmacyService = require('../services/pharmacyService');

/**
 * GET /api/v1/integrations/pharmacy/partners
 * List connected pharmacy networks
 */
router.get('/pharmacy/partners', async (req, res) => {
  try {
    const partners = await pharmacyService.getPartners();
    return res.status(200).json({
      success: true,
      data: { partners }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/**
 * POST /api/v1/integrations/pharmacy/availability
 * Check stock availability for prescribed drugs
 */
router.post('/pharmacy/availability', async (req, res) => {
  try {
    const { pharmacy_code, medications } = req.body;
    if (!pharmacy_code) {
      return res.status(400).json({ success: false, error: { message: 'pharmacy_code is required' } });
    }

    const check = await pharmacyService.checkAvailability(pharmacy_code, medications || []);
    return res.status(200).json({
      success: true,
      data: check
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: { message: err.message } });
  }
});

/**
 * POST /api/v1/integrations/pharmacy/orders
 * Dispatch prescription to partner pharmacy
 */
router.post('/pharmacy/orders', authenticateToken, async (req, res) => {
  try {
    const { prescription_id, pharmacy_code, delivery_type, delivery_address } = req.body;

    const order = await pharmacyService.dispatchPrescriptionOrder({
      prescriptionId: prescription_id,
      pharmacyCode: pharmacy_code,
      deliveryType: delivery_type,
      deliveryAddress: delivery_address
    });

    return res.status(201).json({
      success: true,
      message: 'Prescription successfully transmitted to pharmacy partner for fulfillment.',
      data: { order }
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: { message: err.message } });
  }
});

/**
 * GET /api/v1/integrations/pharmacy/orders
 * List dispatched pharmacy orders
 */
router.get('/pharmacy/orders', authenticateToken, async (req, res) => {
  try {
    const { patient_id, clinic_id, status } = req.query;
    const orders = await pharmacyService.getOrders({
      patientId: patient_id,
      clinicId: clinic_id,
      status
    });

    return res.status(200).json({
      success: true,
      data: { orders }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/**
 * PATCH /api/v1/integrations/pharmacy/orders/:order_reference/status
 * Update order tracking status
 */
router.patch('/pharmacy/orders/:order_reference/status', async (req, res) => {
  try {
    const { status, tracking_url } = req.body;
    const updated = await pharmacyService.updateOrderStatus(req.params.order_reference, status, tracking_url);

    return res.status(200).json({
      success: true,
      message: 'Pharmacy order status updated.',
      data: { order: updated }
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;

