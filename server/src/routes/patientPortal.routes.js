const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const QueueIntelligenceService = require('../services/queueIntelligence');
const TrafficIntelligenceService = require('../services/trafficIntelligence');

router.use(authenticateToken);

// Helper to check patient authorization
async function getAuthorizedPatientIds(userId, userPhone) {
  const res = await query('SELECT id FROM patients WHERE user_id = $1 OR phone_number = $2', [userId, userPhone]);
  return res.rows.map(r => r.id);
}

// GET /api/v1/patient/appointments
router.get('/appointments', async (req, res) => {
  try {
    const patientIds = await getAuthorizedPatientIds(req.user.id, req.user.phone_number);
    if (patientIds.length === 0) {
      return res.status(200).json({ success: true, data: { appointments: [] } });
    }

    const appts = await query(`
      SELECT a.*,
             c.name as clinic_name, c.address as clinic_address, c.phone as clinic_phone,
             cb.name as branch_name, cb.latitude as branch_latitude, cb.longitude as branch_longitude,
             u.full_name as doctor_name, dp.specialty,
             qe.id as queue_entry_id, qe.token_number, qe.queue_status
      FROM appointments a
      JOIN clinics c ON a.clinic_id = c.id
      JOIN doctor_profiles dp ON a.doctor_id = dp.id
      JOIN users u ON dp.user_id = u.id
      LEFT JOIN clinic_branches cb ON a.branch_id = cb.id
      LEFT JOIN queue_entries qe ON a.id = qe.appointment_id
      WHERE a.patient_id = ANY($1)
      ORDER BY a.appointment_date DESC, a.appointment_time ASC
    `, [patientIds]);

    return res.status(200).json({ success: true, data: { appointments: appts.rows } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch patient appointments.' } });
  }
});

// GET /api/v1/patient/prescriptions
router.get('/prescriptions', async (req, res) => {
  try {
    const patientIds = await getAuthorizedPatientIds(req.user.id, req.user.phone_number);
    if (patientIds.length === 0) {
      return res.status(200).json({ success: true, data: { prescriptions: [] } });
    }

    const rxRes = await query(`
      SELECT p.*, c.name as clinic_name, u.full_name as doctor_name
      FROM prescriptions p
      JOIN clinics c ON p.clinic_id = c.id
      JOIN doctor_profiles dp ON p.doctor_id = dp.id
      JOIN users u ON dp.user_id = u.id
      WHERE p.patient_id = ANY($1)
      ORDER BY p.created_at DESC
    `, [patientIds]);

    return res.status(200).json({
      success: true,
      data: { prescriptions: rxRes.rows }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/v1/patient/queue-ticket
router.get('/queue-ticket', async (req, res) => {
  try {
    const patientIds = await getAuthorizedPatientIds(req.user.id, req.user.phone_number);
    if (patientIds.length === 0) {
      return res.status(200).json({ success: true, data: null });
    }

    const activeEntry = await query(`
      SELECT qe.*, a.id as appointment_id,
             c.id as clinic_id, c.name as clinic_name, c.address as clinic_address,
             cb.id as branch_id, cb.name as branch_name, cb.latitude as branch_latitude, cb.longitude as branch_longitude,
             dp.id as doctor_id, dp.specialty, dp.qualification, dp.consultation_fee,
             u.full_name as doctor_name
      FROM queue_entries qe
      JOIN appointments a ON qe.appointment_id = a.id
      JOIN clinics c ON qe.clinic_id = c.id
      JOIN clinic_branches cb ON a.branch_id = cb.id
      JOIN doctor_profiles dp ON a.doctor_id = dp.id
      JOIN users u ON dp.user_id = u.id
      WHERE qe.patient_id = ANY($1)
        AND qe.queue_status IN ('WAITING', 'CALLED', 'IN_CONSULTATION')
      ORDER BY qe.created_at DESC
      LIMIT 1
    `, [patientIds]);

    if (activeEntry.rows.length === 0) {
      return res.status(200).json({ success: true, data: null });
    }

    const row = activeEntry.rows[0];
    const estimate = await QueueIntelligenceService.calculateEntryEstimate(row.id, row.clinic_id);

    return res.status(200).json({
      success: true,
      data: {
        id: row.id,
        appointment_id: row.appointment_id,
        token_number: row.token_number,
        token_sequence: row.token_sequence,
        queue_status: row.queue_status,
        booking_source: row.booking_source || 'ONLINE',
        patients_ahead: estimate.patients_ahead,
        estimated_wait_minutes: estimate.estimated_wait_minutes,
        expected_turn_at: estimate.expected_turn_at,
        confidence: estimate.confidence,
        doctor_delayed: estimate.doctor_delayed,
        is_paused: row.is_paused || false,
        pause_reason: row.pause_reason,
        joined_at: row.joined_at,
        called_at: row.called_at,
        doctor: {
          id: row.doctor_id,
          doctor_name: row.doctor_name,
          specialty: row.specialty,
          qualification: row.qualification,
          consultation_fee: parseFloat(row.consultation_fee || 0)
        },
        clinic: {
          id: row.clinic_id,
          name: row.clinic_name,
          address: row.clinic_address
        },
        branch: {
          id: row.branch_id,
          name: row.branch_name,
          latitude: parseFloat(row.branch_latitude || 0),
          longitude: parseFloat(row.branch_longitude || 0)
        }
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/v1/patient/queue-status/:appointment_id
router.get('/queue-status/:appointment_id', async (req, res) => {
  const { appointment_id } = req.params;
  try {
    const queueEntry = await query(`
      SELECT qe.id, qe.clinic_id
      FROM queue_entries qe
      WHERE qe.appointment_id = $1
    `, [appointment_id]);

    if (queueEntry.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'No live queue entry for this appointment.' } });
    }

    const entryId = queueEntry.rows[0].id;
    const clinicId = queueEntry.rows[0].clinic_id;

    // Use Smart Queue Intelligence engine for dynamic calculation
    const estimate = await QueueIntelligenceService.calculateEntryEstimate(entryId, clinicId);

    return res.status(200).json({
      success: true,
      data: {
        ...estimate,
        appointment_id
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/v1/patient/traffic/departure-recommendation/:appointment_id
// Main Phase 7 feature: Traffic-aware departure recommendation combining queue turn + Google Maps traffic + buffer
router.get('/traffic/departure-recommendation/:appointment_id', async (req, res) => {
  const { appointment_id } = req.params;
  const { origin_lat, origin_lng, origin_address, arrival_buffer_minutes = 10 } = req.query;

  try {
    // 1. Fetch appointment details
    const apptRes = await query(`
      SELECT a.*, p.id as patient_id, p.full_name as patient_name,
             cb.id as branch_id, cb.latitude as branch_lat, cb.longitude as branch_lng,
             qe.id as queue_entry_id, qe.token_number
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      LEFT JOIN clinic_branches cb ON a.branch_id = cb.id
      LEFT JOIN queue_entries qe ON a.id = qe.appointment_id
      WHERE a.id = $1
    `, [appointment_id]);

    if (apptRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Appointment not found.' } });
    }

    const appt = apptRes.rows[0];

    // 2. Compute or retrieve expected turn time using Queue Intelligence
    let expectedTurnAt = null;
    let queueConfidence = 'HIGH';
    let patientsAhead = 0;
    let estimatedWaitMinutes = 0;
    let queueStatus = 'WAITING';

    if (appt.queue_entry_id) {
      const qEst = await QueueIntelligenceService.calculateEntryEstimate(appt.queue_entry_id, appt.clinic_id);
      expectedTurnAt = qEst.expected_turn_at;
      queueConfidence = qEst.estimation_confidence;
      patientsAhead = qEst.patients_ahead;
      estimatedWaitMinutes = qEst.estimated_waiting_minutes;
      queueStatus = qEst.queue_status;
    } else {
      // If not yet joined queue session, calculate from slot appointment time
      const apptDateTimeStr = `${new Date(appt.appointment_date).toISOString().split('T')[0]}T${appt.appointment_time || '10:00'}:00`;
      expectedTurnAt = new Date(apptDateTimeStr).toISOString();
      queueConfidence = 'MEDIUM';
      estimatedWaitMinutes = 0;
    }

    // 3. Compute Traffic-Aware Departure Recommendation
    const recommendation = await TrafficIntelligenceService.calculateDepartureRecommendation({
      patientId: appt.patient_id,
      appointmentId: appt.id,
      queueEntryId: appt.queue_entry_id,
      clinicId: appt.clinic_id,
      branchId: appt.branch_id,
      originLat: origin_lat,
      originLng: origin_lng,
      originAddress: origin_address,
      expectedTurnAt,
      arrivalBufferMinutes: parseInt(arrival_buffer_minutes, 10),
      queueConfidence
    });

    return res.status(200).json({
      success: true,
      data: {
        appointment_id: appt.id,
        token_number: appt.token_number || null,
        queue_status: queueStatus,
        patients_ahead: patientsAhead,
        estimated_waiting_minutes: estimatedWaitMinutes,
        ...recommendation
      }
    });
  } catch (err) {
    console.error('Departure recommendation error:', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/v1/patient/traffic/update-origin
router.post('/traffic/update-origin', async (req, res) => {
  const { appointment_id, origin_lat, origin_lng, origin_address, arrival_buffer_minutes } = req.body;
  if (!appointment_id || origin_lat === undefined || origin_lng === undefined) {
    return res.status(400).json({ success: false, error: { message: 'appointment_id, origin_lat, and origin_lng are required.' } });
  }

  try {
    const apptRes = await query(`
      SELECT a.*, qe.id as queue_entry_id
      FROM appointments a
      LEFT JOIN queue_entries qe ON a.id = qe.appointment_id
      WHERE a.id = $1
    `, [appointment_id]);

    if (apptRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Appointment not found.' } });
    }
    const appt = apptRes.rows[0];

    let expectedTurnAt = null;
    let queueConfidence = 'HIGH';
    if (appt.queue_entry_id) {
      const qEst = await QueueIntelligenceService.calculateEntryEstimate(appt.queue_entry_id, appt.clinic_id);
      expectedTurnAt = qEst.expected_turn_at;
      queueConfidence = qEst.estimation_confidence;
    } else {
      const apptDateTimeStr = `${new Date(appt.appointment_date).toISOString().split('T')[0]}T${appt.appointment_time || '10:00'}:00`;
      expectedTurnAt = new Date(apptDateTimeStr).toISOString();
      queueConfidence = 'MEDIUM';
    }

    const recommendation = await TrafficIntelligenceService.calculateDepartureRecommendation({
      patientId: appt.patient_id,
      appointmentId: appt.id,
      queueEntryId: appt.queue_entry_id,
      clinicId: appt.clinic_id,
      branchId: appt.branch_id,
      originLat: origin_lat,
      originLng: origin_lng,
      originAddress: origin_address,
      expectedTurnAt,
      arrivalBufferMinutes: parseInt(arrival_buffer_minutes || 10, 10),
      queueConfidence
    });

    return res.status(200).json({
      success: true,
      data: recommendation
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/v1/patient/notifications/preferences
router.get('/notifications/preferences', async (req, res) => {
  try {
    const prefRes = await query('SELECT * FROM notification_preferences WHERE user_id = $1', [req.user.id]);
    if (prefRes.rows.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          user_id: req.user.id,
          appointment_reminders: true,
          queue_notifications: true,
          departure_recommendations: true,
          delay_alerts: true,
          push_enabled: true,
          sms_enabled: true,
          whatsapp_enabled: false
        }
      });
    }
    return res.status(200).json({ success: true, data: prefRes.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch notification preferences.' } });
  }
});

// PUT /api/v1/patient/notifications/preferences
router.put('/notifications/preferences', async (req, res) => {
  const {
    appointment_reminders,
    queue_notifications,
    departure_recommendations,
    delay_alerts,
    push_enabled,
    sms_enabled,
    whatsapp_enabled
  } = req.body;

  try {
    const updated = await query(`
      INSERT INTO notification_preferences (
        id, user_id, appointment_reminders, queue_notifications,
        departure_recommendations, delay_alerts, push_enabled, sms_enabled,
        whatsapp_enabled, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        appointment_reminders = COALESCE(EXCLUDED.appointment_reminders, notification_preferences.appointment_reminders),
        queue_notifications = COALESCE(EXCLUDED.queue_notifications, notification_preferences.queue_notifications),
        departure_recommendations = COALESCE(EXCLUDED.departure_recommendations, notification_preferences.departure_recommendations),
        delay_alerts = COALESCE(EXCLUDED.delay_alerts, notification_preferences.delay_alerts),
        push_enabled = COALESCE(EXCLUDED.push_enabled, notification_preferences.push_enabled),
        sms_enabled = COALESCE(EXCLUDED.sms_enabled, notification_preferences.sms_enabled),
        whatsapp_enabled = COALESCE(EXCLUDED.whatsapp_enabled, notification_preferences.whatsapp_enabled),
        updated_at = NOW()
      RETURNING *
    `, [
      req.user.id,
      appointment_reminders !== undefined ? appointment_reminders : true,
      queue_notifications !== undefined ? queue_notifications : true,
      departure_recommendations !== undefined ? departure_recommendations : true,
      delay_alerts !== undefined ? delay_alerts : true,
      push_enabled !== undefined ? push_enabled : true,
      sms_enabled !== undefined ? sms_enabled : true,
      whatsapp_enabled !== undefined ? whatsapp_enabled : false
    ]);

    return res.status(200).json({ success: true, data: updated.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: 'Failed to update preferences.' } });
  }
});

module.exports = router;
