const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const abdmService = require('../services/abdmService');

/**
 * GET /api/v1/abdm/verify-abha
 * Look up & verify an ABHA address
 */
router.get('/verify-abha', authenticateToken, async (req, res) => {
  try {
    const { abha_address } = req.query;
    if (!abha_address) {
      return res.status(400).json({ success: false, error: { message: 'abha_address query parameter is required' } });
    }

    const verification = await abdmService.verifyAbhaAddress(abha_address);

    return res.status(200).json({
      success: true,
      data: { verification }
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: { message: err.message } });
  }
});

/**
 * POST /api/v1/abdm/fhir/export
 * Generate ABDM compliant FHIR R4 JSON document bundle
 */
router.post('/fhir/export', authenticateToken, async (req, res) => {
  try {
    const { patient_id, appointment_id, clinic_id } = req.body;
    if (!patient_id) {
      return res.status(400).json({ success: false, error: { message: 'patient_id is required' } });
    }

    const fhirData = await abdmService.generateFhirBundle({
      patientId: patient_id,
      appointmentId: appointment_id,
      clinicId: clinic_id
    });

    return res.status(200).json({
      success: true,
      message: 'ABDM FHIR R4 document bundle generated successfully.',
      data: fhirData
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: { message: err.message } });
  }
});

/**
 * POST /api/v1/abdm/consents
 * Request and issue ABDM consent artefact
 */
router.post('/consents', authenticateToken, async (req, res) => {
  try {
    const { patient_id, clinic_id, abha_address, purpose, hi_types, date_from, date_to } = req.body;

    const consent = await abdmService.createConsent({
      patientId: patient_id,
      clinicId: clinic_id,
      abhaAddress: abha_address,
      purpose,
      hiTypes: hi_types,
      dateFrom: date_from,
      dateTo: date_to
    });

    return res.status(201).json({
      success: true,
      message: 'ABDM consent artefact created and registered.',
      data: { consent }
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: { message: err.message } });
  }
});

/**
 * POST /api/v1/abdm/consents/:artefact_id/revoke
 * Revoke an existing ABDM consent artefact
 */
router.post('/consents/:artefact_id/revoke', authenticateToken, async (req, res) => {
  try {
    const { patient_id } = req.body;
    const consent = await abdmService.revokeConsent(req.params.artefact_id, patient_id);

    return res.status(200).json({
      success: true,
      message: 'ABDM consent artefact revoked successfully.',
      data: { consent }
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;

