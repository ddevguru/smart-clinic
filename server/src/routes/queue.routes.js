const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');
const { authenticateToken, requireClinicTenant } = require('../middleware/auth');
const QueueIntelligenceService = require('../services/queueIntelligence');
const AutomationService = require('../services/automationService');

router.use(authenticateToken);
router.use(requireClinicTenant);

// GET /api/v1/clinic/queue/live
router.get('/live', async (req, res) => {
  const clinicId = req.clinicId;
  const { doctor_id, branch_id } = req.query;

  try {
    let sql = `
      SELECT qe.*,
             p.full_name as patient_name, p.phone_number as patient_phone, p.gender, p.date_of_birth,
             u.full_name as doctor_name, dp.specialty,
             a.appointment_time, a.consultation_fee
      FROM queue_entries qe
      JOIN patients p ON qe.patient_id = p.id
      JOIN doctor_profiles dp ON qe.doctor_id = dp.id
      JOIN users u ON dp.user_id = u.id
      LEFT JOIN appointments a ON qe.appointment_id = a.id
      WHERE qe.clinic_id = $1 AND qe.queue_status IN ('WAITING', 'CALLED', 'IN_CONSULTATION', 'HOLD')
    `;
    const params = [clinicId];

    if (doctor_id) {
      params.push(doctor_id);
      sql += ` AND qe.doctor_id = $${params.length}`;
    }
    if (branch_id) {
      params.push(branch_id);
      sql += ` AND qe.branch_id = $${params.length}`;
    }

    sql += ' ORDER BY qe.priority_flag DESC, qe.token_sequence ASC';

    const result = await query(sql, params);
    return res.status(200).json({ success: true, data: { queue: result.rows } });
  } catch (err) {
    console.error('Fetch live queue error:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch live queue.' } });
  }
});

// POST /api/v1/clinic/queue/:id/call
// Doctor or receptionist calls patient into consultation room
router.post('/:id/call', async (req, res) => {
  const { id } = req.params;
  const clinicId = req.clinicId;

  try {
    const entryRes = await query(
      `UPDATE queue_entries
       SET queue_status = 'CALLED', called_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND clinic_id = $2 RETURNING *`,
      [id, clinicId]
    );

    if (entryRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Queue entry not found in this clinic.' } });
    }

    const updatedEntry = entryRes.rows[0];
    const io = req.app.get('io');

    try {
      await AutomationService.sendQueueNotification({
        queueEntryId: id,
        clinicId,
        eventType: 'TOKEN_CALLED',
        message: `Your token ${updatedEntry.token_number} has been called into OPD Consultation Room. Please proceed immediately.`,
        io
      });
      if (updatedEntry.queue_session_id) {
        await QueueIntelligenceService.refreshSessionEstimates(updatedEntry.queue_session_id, clinicId, io);
      }
    } catch (e) {
      console.warn('Call notification error:', e.message);
    }

    return res.status(200).json({ success: true, data: { entry: updatedEntry } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: 'Failed to call patient.' } });
  }
});

// POST /api/v1/clinic/queue/:id/start
// Doctor begins consultation
router.post('/:id/start', async (req, res) => {
  const { id } = req.params;
  const clinicId = req.clinicId;

  try {
    const entryRes = await query(
      `UPDATE queue_entries
       SET queue_status = 'IN_CONSULTATION', consultation_started_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND clinic_id = $2 RETURNING *`,
      [id, clinicId]
    );

    if (entryRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Queue entry not found in this clinic.' } });
    }

    const entry = entryRes.rows[0];

    if (entry.appointment_id) {
      await query(
        "UPDATE appointments SET status = 'IN_CONSULTATION', updated_at = NOW() WHERE id = $1",
        [entry.appointment_id]
      );
    }

    return res.status(200).json({ success: true, data: { entry } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: 'Failed to start consultation.' } });
  }
});

// POST /api/v1/clinic/queue/:id/complete
// Doctor finishes consultation
router.post('/:id/complete', async (req, res) => {
  const { id } = req.params;
  const clinicId = req.clinicId;

  try {
    const entryRes = await query(
      `UPDATE queue_entries
       SET queue_status = 'COMPLETED', completed_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND clinic_id = $2 RETURNING *`,
      [id, clinicId]
    );

    if (entryRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Queue entry not found in this clinic.' } });
    }

    const entry = entryRes.rows[0];

    if (entry.appointment_id) {
      await query(
        "UPDATE appointments SET status = 'COMPLETED', completed_at = NOW(), updated_at = NOW() WHERE id = $1",
        [entry.appointment_id]
      );
    }

    // Recalculate remaining queue estimates and notify approaching patients
    const io = req.app.get('io');
    if (entry.queue_session_id) {
      const estimates = await QueueIntelligenceService.refreshSessionEstimates(entry.queue_session_id, clinicId, io);
      // Check if next patient has <= 2 ahead
      for (const est of estimates) {
        if (est.patients_ahead <= 2 && est.queue_status === 'WAITING') {
          await AutomationService.sendQueueNotification({
            queueEntryId: est.queue_entry_id,
            clinicId,
            eventType: 'TURN_APPROACHING',
            message: `Your turn is approaching! Token ${est.token_number} is next in line. Please be seated in the waiting area.`,
            io
          });
        }
      }
    }

    return res.status(200).json({ success: true, data: { entry } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: 'Failed to complete consultation.' } });
  }
});

// POST /api/v1/clinic/queue/:id/hold
router.post('/:id/hold', async (req, res) => {
  const { id } = req.params;
  const clinicId = req.clinicId;

  try {
    const entryRes = await query(
      `UPDATE queue_entries
       SET queue_status = 'HOLD', updated_at = NOW()
       WHERE id = $1 AND clinic_id = $2 RETURNING *`,
      [id, clinicId]
    );
    if (entryRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Queue entry not found.' } });
    }

    const entry = entryRes.rows[0];
    const io = req.app.get('io');
    if (entry.queue_session_id) {
      await QueueIntelligenceService.refreshSessionEstimates(entry.queue_session_id, clinicId, io);
    }

    return res.status(200).json({ success: true, data: { entry } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: 'Failed to hold queue entry.' } });
  }
});

// POST /api/v1/clinic/queue/:id/priority
// Receptionist or Doctor flags patient as urgent priority (e.g., senior citizen, high fever)
router.post('/:id/priority', async (req, res) => {
  const { id } = req.params;
  const clinicId = req.clinicId;
  const { priority_flag, priority_reason } = req.body;

  try {
    const entryRes = await query(
      `UPDATE queue_entries
       SET priority_flag = $1, priority_reason = $2, priority_assigned_by_id = $3, updated_at = NOW()
       WHERE id = $4 AND clinic_id = $5 RETURNING *`,
      [priority_flag !== false, priority_reason || 'Urgent Medical Attention', req.user.id, id, clinicId]
    );

    if (entryRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Queue entry not found.' } });
    }

    const entry = entryRes.rows[0];
    const io = req.app.get('io');
    if (entry.queue_session_id) {
      await QueueIntelligenceService.refreshSessionEstimates(entry.queue_session_id, clinicId, io);
    }

    return res.status(200).json({ success: true, data: { entry } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: 'Failed to update priority.' } });
  }
});

module.exports = router;
