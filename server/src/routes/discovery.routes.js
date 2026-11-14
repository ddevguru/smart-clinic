const express = require('express');
const router = express.Router();
const { query } = require('../config/db');

// GET /api/v1/discovery/clinics
router.get('/clinics', async (req, res) => {
  const { city, search } = req.query;
  try {
    let sql = "SELECT id, name, slug, clinic_type, phone, email, address, city, state, postal_code, established_year FROM clinics WHERE verification_status = 'VERIFIED' AND is_active = true";
    const params = [];

    if (city) {
      params.push(`%${city.toLowerCase()}%`);
      sql += ` AND LOWER(city) LIKE $${params.length}`;
    }
    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      sql += ` AND (LOWER(name) LIKE $${params.length} OR LOWER(city) LIKE $${params.length})`;
    }

    const result = await query(sql, params);
    return res.status(200).json({ success: true, data: { clinics: result.rows } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: 'Failed to discover clinics.' } });
  }
});

// GET /api/v1/discovery/clinics/:id
router.get('/clinics/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const clinicRes = await query('SELECT * FROM clinics WHERE id = $1', [id]);
    if (clinicRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Clinic not found.' } });
    }

    const branches = await query('SELECT * FROM clinic_branches WHERE clinic_id = $1 AND is_active = true', [id]);
    const doctors = await query(
      `SELECT dp.id, u.full_name, dp.specialty, dp.qualification, dp.consultation_fee, dp.experience_years
       FROM doctor_profiles dp
       JOIN users u ON dp.user_id = u.id
       WHERE dp.clinic_id = $1 AND dp.is_active = true AND dp.verification_status = 'VERIFIED'`,
      [id]
    );

    return res.status(200).json({
      success: true,
      data: {
        clinic: clinicRes.rows[0],
        branches: branches.rows,
        doctors: doctors.rows
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch clinic details.' } });
  }
});

// GET /api/v1/discovery/verify-rx/:token
// Public non-sensitive QR verification check
router.get('/verify-rx/:token', async (req, res) => {
  const { token } = req.params;
  try {
    const rxRes = await query(
      `SELECT pr.prescription_number, pr.status, pv.version_number, pv.finalized_at, pv.document_checksum,
              c.name as clinic_name, c.city as clinic_city,
              u.full_name as doctor_name, dp.specialty, dp.medical_registration_number,
              p.full_name as patient_name
       FROM prescription_versions pv
       JOIN prescriptions pr ON pv.prescription_id = pr.id
       JOIN clinics c ON pr.clinic_id = c.id
       JOIN doctor_profiles dp ON pr.doctor_id = dp.id
       JOIN users u ON dp.user_id = u.id
       JOIN patients p ON pr.patient_id = p.id
       WHERE pv.verification_token = $1`,
      [token]
    );

    if (rxRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Prescription record not found or invalid QR token.' }
      });
    }

    const rx = rxRes.rows[0];
    return res.status(200).json({
      success: true,
      data: {
        is_authentic: true,
        prescription_number: rx.prescription_number,
        version: rx.version_number,
        status: rx.status,
        finalized_at: rx.finalized_at,
        checksum: rx.document_checksum,
        doctor: {
          name: rx.doctor_name,
          specialty: rx.specialty,
          registration_number: rx.medical_registration_number
        },
        clinic: {
          name: rx.clinic_name,
          city: rx.clinic_city
        },
        patient_name_masked: rx.patient_name.slice(0, 2) + '***'
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: 'Failed to verify prescription.' } });
  }
});

module.exports = router;

