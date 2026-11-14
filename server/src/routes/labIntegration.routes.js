const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const diagnosticLabService = require('../services/diagnosticLabService');

/**
 * GET /api/v1/integrations/labs
 * List diagnostic laboratories and test packages
 */
router.get('/labs', async (req, res) => {
  try {
    const labs = await diagnosticLabService.getLaboratories();
    return res.status(200).json({
      success: true,
      data: { laboratories: labs }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/**
 * GET /api/v1/integrations/labs/:code
 * Get details & catalog for a specific lab
 */
router.get('/labs/:code', async (req, res) => {
  try {
    const lab = await diagnosticLabService.getLabCatalog(req.params.code);
    return res.status(200).json({
      success: true,
      data: { laboratory: lab }
    });
  } catch (err) {
    return res.status(404).json({ success: false, error: { message: err.message } });
  }
});

/**
 * POST /api/v1/integrations/labs/orders
 * Order diagnostic lab tests
 */
router.post('/labs/orders', authenticateToken, async (req, res) => {
  try {
    const { clinic_id, patient_id, doctor_id, lab_code, test_codes, sample_collection_type, appointment_id } = req.body;

    const order = await diagnosticLabService.createLabOrder({
      clinicId: clinic_id,
      patientId: patient_id,
      doctorId: doctor_id,
      labCode: lab_code,
      testCodes: test_codes,
      sampleCollectionType: sample_collection_type,
      appointmentId: appointment_id
    });

    return res.status(201).json({
      success: true,
      message: 'Diagnostic laboratory order submitted successfully with sample barcode.',
      data: { order }
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: { message: err.message } });
  }
});

/**
 * GET /api/v1/integrations/labs/orders
 * List lab orders
 */
router.get('/labs/orders', authenticateToken, async (req, res) => {
  try {
    const { clinic_id, patient_id, status } = req.query;
    const orders = await diagnosticLabService.getOrders({
      clinicId: clinic_id,
      patientId: patient_id,
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
 * POST /api/v1/integrations/labs/webhook/:lab_code
 * Secure incoming webhook from laboratory with HMAC signature & idempotency
 */
router.post('/labs/webhook/:lab_code', async (req, res) => {
  try {
    const signature = req.headers['x-lab-signature'] || req.headers['x-hub-signature-256'] || req.headers['authorization'];
    const result = await diagnosticLabService.processWebhook(req.params.lab_code, signature, req.body);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;

