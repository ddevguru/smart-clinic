const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');
const { authenticateToken, requireClinicTenant } = require('../middleware/auth');

router.use(authenticateToken);
router.use(requireClinicTenant);

// GET /api/v1/clinic/patients
// Search by phone, name, or list recent patients for this clinic
router.get('/', async (req, res) => {
  const { phone_number, search, limit = 50 } = req.query;
  const clinicId = req.clinicId;

  try {
    let sql = 'SELECT * FROM patients WHERE clinic_id = $1 AND is_active = true';
    const params = [clinicId];

    if (phone_number) {
      params.push(`%${phone_number.trim()}%`);
      sql += ` AND phone_number LIKE $${params.length}`;
    } else if (search) {
      params.push(`%${search.trim().toLowerCase()}%`);
      sql += ` AND (LOWER(full_name) LIKE $${params.length} OR phone_number LIKE $${params.length} OR LOWER(email) LIKE $${params.length})`;
    }

    sql += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
    params.push(parseInt(limit, 10));

    const result = await query(sql, params);
    return res.status(200).json({
      success: true,
      data: {
        patients: result.rows,
        count: result.rows.length
      }
    });
  } catch (err) {
    console.error('Fetch patients error:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to search patients.' } });
  }
});

// GET /api/v1/clinic/patients/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const clinicId = req.clinicId;

  try {
    const patientRes = await query(
      'SELECT * FROM patients WHERE id = $1 AND clinic_id = $2',
      [id, clinicId]
    );

    if (patientRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'PATIENT_NOT_FOUND', message: 'Patient not found in this clinic.' }
      });
    }

    const patient = patientRes.rows[0];

    // Fetch past appointments
    const appts = await query(
      `SELECT a.id, a.appointment_date, a.appointment_time, a.status, a.consultation_fee,
              u.full_name as doctor_name, dp.specialty
       FROM appointments a
       JOIN doctor_profiles dp ON a.doctor_id = dp.id
       JOIN users u ON dp.user_id = u.id
       WHERE a.patient_id = $1 AND a.clinic_id = $2
       ORDER BY a.appointment_date DESC LIMIT 10`,
      [id, clinicId]
    );

    // Fetch prescriptions
    const prescriptions = await query(
      `SELECT pr.id, pr.prescription_number, pr.status, pr.finalized_at,
              u.full_name as doctor_name
       FROM prescriptions pr
       JOIN doctor_profiles dp ON pr.doctor_id = dp.id
       JOIN users u ON dp.user_id = u.id
       WHERE pr.patient_id = $1 AND pr.clinic_id = $2
       ORDER BY pr.created_at DESC LIMIT 10`,
      [id, clinicId]
    );

    return res.status(200).json({
      success: true,
      data: {
        patient,
        appointments: appts.rows,
        prescriptions: prescriptions.rows
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch patient details.' } });
  }
});

// POST /api/v1/clinic/patients
router.post('/', async (req, res) => {
  const clinicId = req.clinicId;
  const {
    full_name,
    phone_number,
    email,
    date_of_birth,
    gender,
    blood_group,
    address,
    city,
    emergency_contact_name,
    emergency_contact_phone,
    allergies,
    medical_history_summary
  } = req.body;

  if (!full_name || !phone_number) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'full_name and phone_number are required.' }
    });
  }

  try {
    // Check if patient already exists in this clinic with the same phone
    const existing = await query(
      'SELECT id, full_name, phone_number FROM patients WHERE clinic_id = $1 AND phone_number = $2',
      [clinicId, phone_number.trim()]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'PATIENT_EXISTS',
          message: 'A patient with this mobile number already exists in your clinic.',
          patient: existing.rows[0]
        }
      });
    }

    const id = uuidv4();
    const created = await query(
      `INSERT INTO patients (
        id, clinic_id, full_name, phone_number, email, date_of_birth, gender,
        blood_group, address, city, emergency_contact_name, emergency_contact_phone,
        allergies, medical_history_summary, registered_by_user_id, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, true, NOW(), NOW())
      RETURNING *`,
      [
        id, clinicId, full_name.trim(), phone_number.trim(), email || null,
        date_of_birth || null, gender || 'OTHER', blood_group || null,
        address || null, city || 'Bengaluru', emergency_contact_name || null,
        emergency_contact_phone || null, allergies || null, medical_history_summary || null,
        req.user.id
      ]
    );

    return res.status(201).json({
      success: true,
      data: {
        patient: created.rows[0]
      }
    });
  } catch (err) {
    console.error('Patient registration error:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to register patient.' } });
  }
});

// PATCH /api/v1/clinic/patients/:id
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const clinicId = req.clinicId;
  const {
    full_name,
    phone_number,
    email,
    date_of_birth,
    gender,
    blood_group,
    address,
    allergies,
    medical_history_summary
  } = req.body;

  try {
    const updated = await query(
      `UPDATE patients
       SET full_name = COALESCE($1, full_name),
           phone_number = COALESCE($2, phone_number),
           email = COALESCE($3, email),
           date_of_birth = COALESCE($4, date_of_birth),
           gender = COALESCE($5, gender),
           blood_group = COALESCE($6, blood_group),
           address = COALESCE($7, address),
           allergies = COALESCE($8, allergies),
           medical_history_summary = COALESCE($9, medical_history_summary),
           updated_at = NOW()
       WHERE id = $10 AND clinic_id = $11
       RETURNING *`,
      [full_name, phone_number, email, date_of_birth, gender, blood_group, address, allergies, medical_history_summary, id, clinicId]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Patient not found in this clinic.' } });
    }

    return res.status(200).json({ success: true, data: { patient: updated.rows[0] } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: 'Failed to update patient.' } });
  }
});

module.exports = router;

