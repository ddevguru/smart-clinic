const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const recordSharingService = require('../services/recordSharingService');
const { query } = require('../config/db');

/**
 * Helper to resolve patient ID for authenticated user
 */
async function resolvePatientId(user) {
  const pRes = await query(`SELECT id FROM patients WHERE user_id = $1 OR phone_number = $2 LIMIT 1`, [user.id, user.phone_number]);
  return pRes.rows.length > 0 ? pRes.rows[0].id : null;
}

/**
 * POST /api/v1/records/share
 * Patient creates a time-limited signed sharing link
 */
router.post('/share', authenticateToken, async (req, res) => {
  try {
    let patientId = req.body.patient_id;
    if (!patientId && req.user) {
      patientId = await resolvePatientId(req.user);
    }
    if (!patientId) {
      return res.status(400).json({ success: false, error: { message: 'patient_id is required' } });
    }

    const { recipient_name, recipient_contact, shared_records, duration_hours } = req.body;

    const result = await recordSharingService.createShareLink({
      patientId,
      recipientName: recipient_name,
      recipientEmailOrPhone: recipient_contact,
      sharedRecords: shared_records,
      durationHours: duration_hours
    });

    return res.status(201).json({
      success: true,
      message: 'Secure, time-limited medical record sharing link created.',
      data: result
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: { message: err.message } });
  }
});

/**
 * GET /api/v1/records/shared/:token
 * Public view endpoint using signed token (Audit logged with IP & User Agent)
 */
router.get('/shared/:token', async (req, res) => {
  try {
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'External Browser';

    const records = await recordSharingService.accessSharedRecords(req.params.token, ipAddress, userAgent);

    return res.status(200).json({
      success: true,
      data: records
    });
  } catch (err) {
    return res.status(403).json({ success: false, error: { message: err.message } });
  }
});

/**
 * DELETE /api/v1/records/share/:share_id
 * Patient revokes an active sharing link immediately
 */
router.delete('/share/:share_id', authenticateToken, async (req, res) => {
  try {
    let patientId = req.body?.patient_id || req.query?.patient_id;
    if (!patientId && req.user) {
      patientId = await resolvePatientId(req.user);
    }

    const revoked = await recordSharingService.revokeShare(patientId, req.params.share_id);

    return res.status(200).json({
      success: true,
      message: 'Medical record sharing access revoked immediately.',
      data: { share: revoked }
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: { message: err.message } });
  }
});

/**
 * POST /api/v1/records/share/:share_id/revoke
 * Alternative POST endpoint for environments where DELETE does not carry body
 */
router.post('/share/:share_id/revoke', authenticateToken, async (req, res) => {
  try {
    let patientId = req.body?.patient_id || req.query?.patient_id;
    if (!patientId && req.user) {
      patientId = await resolvePatientId(req.user);
    }

    const revoked = await recordSharingService.revokeShare(patientId, req.params.share_id);

    return res.status(200).json({
      success: true,
      message: 'Medical record sharing access revoked immediately.',
      data: { share: revoked }
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: { message: err.message } });
  }
});

/**
 * GET /api/v1/records/shares/my
 * Patient views their active and past share links with access audit logs
 */
router.get('/shares/my', authenticateToken, async (req, res) => {
  try {
    let patientId = req.query.patient_id;
    if (!patientId && req.user) {
      patientId = await resolvePatientId(req.user);
    }
    if (!patientId) {
      return res.status(400).json({ success: false, error: { message: 'patient_id is required' } });
    }

    const shares = await recordSharingService.getPatientShares(patientId);

    return res.status(200).json({
      success: true,
      data: { shares }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;
