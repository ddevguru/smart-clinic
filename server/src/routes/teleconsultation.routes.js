const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const teleconsultationService = require('../services/teleconsultationService');
const { query } = require('../config/db');

/**
 * POST /api/v1/teleconsultation/rooms
 * Create or get a teleconsultation room
 */
router.post('/rooms', authenticateToken, async (req, res) => {
  try {
    const { appointment_id, clinic_id, doctor_id, patient_id } = req.body;

    if (!appointment_id) {
      return res.status(400).json({ success: false, error: { message: 'appointment_id is required' } });
    }

    // Resolve details from appointment if omitted
    const apptRes = await query('SELECT * FROM appointments WHERE id = $1', [appointment_id]);
    if (apptRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Appointment not found' } });
    }
    const appt = apptRes.rows[0];

    const room = await teleconsultationService.createRoom({
      appointmentId: appointment_id,
      clinicId: clinic_id || appt.clinic_id,
      doctorId: doctor_id || appt.doctor_id,
      patientId: patient_id || appt.patient_id
    });

    return res.status(201).json({
      success: true,
      message: 'Teleconsultation room created with secure tokens.',
      data: { room }
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: { message: err.message } });
  }
});

/**
 * GET /api/v1/teleconsultation/rooms/:room_code
 * Get room status, participant metadata & ICE configuration
 */
router.get('/rooms/:room_code', authenticateToken, async (req, res) => {
  try {
    const room = await teleconsultationService.getRoomByCode(req.params.room_code);
    return res.status(200).json({
      success: true,
      data: { room }
    });
  } catch (err) {
    return res.status(404).json({ success: false, error: { message: err.message } });
  }
});

/**
 * POST /api/v1/teleconsultation/rooms/:room_code/join
 * Join room as DOCTOR or PATIENT with cryptographic token
 */
router.post('/rooms/:room_code/join', authenticateToken, async (req, res) => {
  try {
    const { role, token } = req.body;
    if (!role || !token) {
      return res.status(400).json({ success: false, error: { message: 'Both role (DOCTOR|PATIENT) and token are required' } });
    }

    const room = await teleconsultationService.joinRoom(req.params.room_code, role.toUpperCase(), token);

    return res.status(200).json({
      success: true,
      message: `Participant joined room as ${role}`,
      data: { room }
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: { message: err.message } });
  }
});

/**
 * POST /api/v1/teleconsultation/rooms/:room_code/end
 * End video call session and calculate duration
 */
router.post('/rooms/:room_code/end', authenticateToken, async (req, res) => {
  try {
    const { notes } = req.body;
    const room = await teleconsultationService.endRoom(req.params.room_code, req.user.id, notes || '');

    return res.status(200).json({
      success: true,
      message: 'Teleconsultation call concluded successfully.',
      data: { room }
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;

