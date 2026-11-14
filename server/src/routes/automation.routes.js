const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticateToken, requireClinicTenant, requireRoles } = require('../middleware/auth');
const AutomationService = require('../services/automationService');

router.use(authenticateToken);

// GET /api/v1/clinic/automation/settings
router.get('/settings', requireClinicTenant, async (req, res) => {
  const clinicId = req.clinicId;
  try {
    const sRes = await query('SELECT * FROM automation_settings WHERE clinic_id = $1', [clinicId]);
    if (sRes.rows.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          clinic_id: clinicId,
          reminders_enabled: true,
          reminder_intervals_hours: [24, 2, 0],
          queue_alerts_enabled: true,
          turn_approaching_threshold: 2,
          delay_alerts_enabled: true,
          delay_threshold_minutes: 15,
          traffic_departure_enabled: true,
          default_arrival_buffer_minutes: 10
        }
      });
    }
    return res.status(200).json({ success: true, data: sRes.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch automation settings.' } });
  }
});

// PUT /api/v1/clinic/automation/settings
router.put('/settings', requireClinicTenant, requireRoles('CLINIC_OWNER'), async (req, res) => {
  const clinicId = req.clinicId;
  const {
    reminders_enabled,
    reminder_intervals_hours,
    queue_alerts_enabled,
    turn_approaching_threshold,
    delay_alerts_enabled,
    delay_threshold_minutes,
    traffic_departure_enabled,
    default_arrival_buffer_minutes
  } = req.body;

  try {
    const updated = await query(`
      INSERT INTO automation_settings (
        id, clinic_id, reminders_enabled, reminder_intervals_hours,
        queue_alerts_enabled, turn_approaching_threshold, delay_alerts_enabled,
        delay_threshold_minutes, traffic_departure_enabled, default_arrival_buffer_minutes,
        updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()
      )
      ON CONFLICT (clinic_id) DO UPDATE SET
        reminders_enabled = COALESCE(EXCLUDED.reminders_enabled, automation_settings.reminders_enabled),
        reminder_intervals_hours = COALESCE(EXCLUDED.reminder_intervals_hours, automation_settings.reminder_intervals_hours),
        queue_alerts_enabled = COALESCE(EXCLUDED.queue_alerts_enabled, automation_settings.queue_alerts_enabled),
        turn_approaching_threshold = COALESCE(EXCLUDED.turn_approaching_threshold, automation_settings.turn_approaching_threshold),
        delay_alerts_enabled = COALESCE(EXCLUDED.delay_alerts_enabled, automation_settings.delay_alerts_enabled),
        delay_threshold_minutes = COALESCE(EXCLUDED.delay_threshold_minutes, automation_settings.delay_threshold_minutes),
        traffic_departure_enabled = COALESCE(EXCLUDED.traffic_departure_enabled, automation_settings.traffic_departure_enabled),
        default_arrival_buffer_minutes = COALESCE(EXCLUDED.default_arrival_buffer_minutes, automation_settings.default_arrival_buffer_minutes),
        updated_at = NOW()
      RETURNING *
    `, [
      clinicId,
      reminders_enabled !== undefined ? reminders_enabled : true,
      reminder_intervals_hours || [24, 2, 0],
      queue_alerts_enabled !== undefined ? queue_alerts_enabled : true,
      turn_approaching_threshold || 2,
      delay_alerts_enabled !== undefined ? delay_alerts_enabled : true,
      delay_threshold_minutes || 15,
      traffic_departure_enabled !== undefined ? traffic_departure_enabled : true,
      default_arrival_buffer_minutes || 10
    ]);

    return res.status(200).json({ success: true, data: updated.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: 'Failed to update automation settings.' } });
  }
});

// GET /api/v1/clinic/automation/logs
router.get('/logs', requireClinicTenant, async (req, res) => {
  const clinicId = req.clinicId;
  const { limit = 50 } = req.query;

  try {
    const logs = await query(`
      SELECT l.*, u.full_name as recipient_name, a.appointment_time
      FROM automation_job_logs l
      LEFT JOIN users u ON l.recipient_user_id = u.id
      LEFT JOIN appointments a ON l.appointment_id = a.id
      WHERE l.clinic_id = $1
      ORDER BY l.created_at DESC
      LIMIT $2
    `, [clinicId, parseInt(limit, 10)]);

    return res.status(200).json({ success: true, data: logs.rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch automation logs.' } });
  }
});

// POST /api/v1/clinic/automation/trigger-reminders
router.post('/trigger-reminders', requireClinicTenant, async (req, res) => {
  try {
    const io = req.app.get('io');
    const results = await AutomationService.processUpcomingAppointmentReminders(io);
    return res.status(200).json({
      success: true,
      data: {
        message: 'Appointment reminder scan executed.',
        processed_count: results.length,
        dispatches: results
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/v1/clinic/queue/delays or /api/v1/clinic/automation/delays
router.get('/delays', requireClinicTenant, async (req, res) => {
  const clinicId = req.clinicId;
  const { doctor_id } = req.query;
  try {
    let q = `
      SELECT d.*, u.full_name as doctor_name, b.name as branch_name
      FROM delay_event_logs d
      LEFT JOIN doctor_profiles dp ON d.doctor_id = dp.id
      LEFT JOIN users u ON dp.user_id = u.id
      LEFT JOIN clinic_branches b ON d.branch_id = b.id
      WHERE d.clinic_id = $1
    `;
    const params = [clinicId];
    if (doctor_id) {
      params.push(doctor_id);
      q += ` AND d.doctor_id = $2`;
    }
    q += ` ORDER BY d.created_at DESC LIMIT 20`;
    const result = await query(q, params);
    return res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch delay logs.' } });
  }
});

// POST /api/v1/clinic/queue/delay-alert
router.post('/delay-alert', requireClinicTenant, async (req, res) => {
  const { doctor_id, delay_minutes, reason, branch_id } = req.body;
  if (!doctor_id || !delay_minutes) {
    return res.status(400).json({ success: false, error: { message: 'doctor_id and delay_minutes are required.' } });
  }

  try {
    const io = req.app.get('io');
    const result = await AutomationService.recordDoctorDelay({
      clinicId: req.clinicId,
      branchId: branch_id || null,
      doctorId: doctor_id,
      delayMinutes: parseInt(delay_minutes, 10),
      reason,
      recordedByUserId: req.user.id,
      io
    });

    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;
