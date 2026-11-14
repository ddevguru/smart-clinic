const express = require('express');
const router = express.Router();
const { authenticateToken, requireRoles } = require('../middleware/auth');
const aiClinicalService = require('../services/aiClinicalService');
const { query } = require('../config/db');

/**
 * Helper to resolve doctor profile ID from user ID
 */
async function getDoctorProfileId(userId) {
  const res = await query('SELECT id FROM doctor_profiles WHERE user_id = $1', [userId]);
  return res.rows.length > 0 ? res.rows[0].id : null;
}

/**
 * POST /api/v1/ai/soap/draft
 * Generate SOAP clinical draft from notes or speech transcript
 */
router.post('/soap/draft', authenticateToken, async (req, res) => {
  try {
    const { appointment_id, doctor_id, patient_id, raw_notes } = req.body;
    let docId = doctor_id;

    if (!docId && req.user) {
      docId = await getDoctorProfileId(req.user.id);
    }

    const draft = await aiClinicalService.generateSoapDraft({
      appointmentId: appointment_id,
      doctorProfileId: docId,
      patientId: patient_id,
      rawNotes: raw_notes
    });

    return res.status(201).json({
      success: true,
      message: 'AI SOAP draft generated successfully. Awaiting doctor clinical review and approval.',
      data: { draft }
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: { message: err.message } });
  }
});

/**
 * POST /api/v1/ai/soap/approve
 * Doctor approves and synchronizes SOAP draft into official clinical notes
 */
router.post('/soap/approve', authenticateToken, async (req, res) => {
  try {
    const { draft_id, edits } = req.body;
    if (!draft_id) {
      return res.status(400).json({ success: false, error: { message: 'draft_id is required' } });
    }

    const approvedDraft = await aiClinicalService.approveSoapDraft(draft_id, req.user.id, edits || {});

    return res.status(200).json({
      success: true,
      message: 'AI SOAP draft verified, approved, and synchronized to consultation notes by doctor.',
      data: { draft: approvedDraft }
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: { message: err.message } });
  }
});

/**
 * POST /api/v1/ai/lab/extract
 * OCR ingestion and structured extraction of lab report metrics
 */
router.post('/lab/extract', authenticateToken, async (req, res) => {
  try {
    const { clinic_id, patient_id, document_url, raw_ocr_text, file_name, source_lab } = req.body;

    const extraction = await aiClinicalService.extractLabReport({
      clinicId: clinic_id,
      patientId: patient_id,
      documentUrl: document_url,
      rawOcrText: raw_ocr_text,
      fileName: file_name,
      sourceLab: source_lab
    });

    return res.status(201).json({
      success: true,
      message: 'Lab report extracted and metrics classified. Awaiting doctor verification.',
      data: { extraction }
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: { message: err.message } });
  }
});

/**
 * POST /api/v1/ai/lab/verify
 * Doctor verifies and signs off on extracted laboratory values
 */
router.post('/lab/verify', authenticateToken, async (req, res) => {
  try {
    const { extraction_id, doctor_notes } = req.body;
    if (!extraction_id) {
      return res.status(400).json({ success: false, error: { message: 'extraction_id is required' } });
    }

    const verified = await aiClinicalService.verifyLabExtraction(extraction_id, req.user.id, doctor_notes);

    return res.status(200).json({
      success: true,
      message: 'Lab report extraction clinically verified by doctor.',
      data: { extraction: verified }
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: { message: err.message } });
  }
});

/**
 * POST /api/v1/ai/assistant/query
 * Intelligent Healthcare Assistant with Emergency Triage Protocol Guard
 */
router.post('/assistant/query', async (req, res) => {
  try {
    const { query: queryText, patient_id, role } = req.body;
    const response = await aiClinicalService.queryHealthAssistant({
      queryText,
      patientId: patient_id,
      role: role || 'PATIENT'
    });

    return res.status(200).json({
      success: true,
      data: response
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;

