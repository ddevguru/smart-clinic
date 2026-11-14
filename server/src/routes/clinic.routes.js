const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');
const { authenticateToken, requireClinicTenant, requireRoles } = require('../middleware/auth');

// Apply tenant auth to all clinic routes
router.use(authenticateToken);
router.use(requireClinicTenant);

// GET /api/v1/clinic/dashboard/owner and /api/v1/clinic/dashboard/overview
router.get(['/dashboard/owner', '/dashboard/overview'], requireRoles('CLINIC_OWNER'), async (req, res) => {
  const clinicId = req.clinicId;
  const todayStr = new Date().toISOString().split('T')[0];

  try {
    const clinicRes = await query('SELECT * FROM clinics WHERE id = $1', [clinicId]);
    const branchCount = await query('SELECT COUNT(*) FROM clinic_branches WHERE clinic_id = $1 AND is_active = true', [clinicId]);
    const doctorCount = await query('SELECT COUNT(*) FROM doctor_profiles WHERE clinic_id = $1 AND is_active = true', [clinicId]);
    const patientCount = await query('SELECT COUNT(*) FROM patients WHERE clinic_id = $1 AND is_active = true', [clinicId]);
    
    const apptsToday = await query(
      'SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'COMPLETED\') as completed FROM appointments WHERE clinic_id = $1 AND appointment_date = $2',
      [clinicId, todayStr]
    );

    const revenueRes = await query(
      `SELECT COALESCE(SUM(amount), 0) as today_rev,
              COALESCE(SUM(amount) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)), 0) as mtd_rev
       FROM payment_records WHERE clinic_id = $1 AND payment_status = 'PAID'`,
      [clinicId]
    );

    const recentAppointments = await query(
      `SELECT a.id, a.appointment_time, a.status, a.consultation_fee,
              p.full_name as patient_name, p.phone_number as patient_phone,
              u.full_name as doctor_name, dp.specialty
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN doctor_profiles dp ON a.doctor_id = dp.id
       JOIN users u ON dp.user_id = u.id
       WHERE a.clinic_id = $1 AND a.appointment_date = $2
       ORDER BY a.created_at DESC LIMIT 5`,
      [clinicId, todayStr]
    );

    return res.status(200).json({
      success: true,
      data: {
        clinic: clinicRes.rows[0],
        metrics: {
          total_branches: parseInt(branchCount.rows[0].count, 10),
          total_doctors: parseInt(doctorCount.rows[0].count, 10),
          total_patients: parseInt(patientCount.rows[0].count, 10),
          today_appointments: parseInt(apptsToday.rows[0].total, 10),
          completed_today: parseInt(apptsToday.rows[0].completed, 10),
          today_revenue: parseFloat(revenueRes.rows[0].today_rev),
          mtd_revenue: parseFloat(revenueRes.rows[0].mtd_rev)
        },
        recent_appointments: recentAppointments.rows
      }
    });
  } catch (err) {
    console.error('Owner dashboard error:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to load owner dashboard.' } });
  }
});

// GET /api/v1/clinic/dashboard/receptionist
router.get('/dashboard/receptionist', requireRoles('RECEPTIONIST', 'CLINIC_OWNER'), async (req, res) => {
  const clinicId = req.clinicId;
  const todayStr = new Date().toISOString().split('T')[0];

  try {
    const todayAppointments = await query(
      `SELECT a.id, a.appointment_time, a.status, a.consultation_fee, a.appointment_source,
              p.id as patient_id, p.full_name as patient_name, p.phone_number as patient_phone, p.gender,
              u.full_name as doctor_name, dp.id as doctor_profile_id, dp.specialty,
              cb.name as branch_name,
              pr.payment_status, pr.receipt_number
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN doctor_profiles dp ON a.doctor_id = dp.id
       JOIN users u ON dp.user_id = u.id
       LEFT JOIN clinic_branches cb ON a.branch_id = cb.id
       LEFT JOIN payment_records pr ON a.id = pr.appointment_id
       WHERE a.clinic_id = $1 AND a.appointment_date = $2
       ORDER BY a.appointment_time ASC`,
      [clinicId, todayStr]
    );

    const liveQueue = await query(
      `SELECT qe.id, qe.token_number, qe.queue_status, qe.estimated_wait_minutes, qe.priority_flag, qe.joined_at,
              p.id as patient_id, p.full_name as patient_name, p.phone_number,
              u.full_name as doctor_name, dp.specialty
       FROM queue_entries qe
       JOIN patients p ON qe.patient_id = p.id
       JOIN doctor_profiles dp ON qe.doctor_id = dp.id
       JOIN users u ON dp.user_id = u.id
       WHERE qe.clinic_id = $1 AND qe.queue_status IN ('WAITING', 'CALLED', 'IN_CONSULTATION')
       ORDER BY qe.priority_flag DESC, qe.token_sequence ASC`,
      [clinicId]
    );

    const doctorsOnDuty = await query(
      `SELECT dp.id, u.full_name, dp.specialty, dp.consultation_fee, cb.name as branch_name,
              qs.is_active as session_active, qs.is_paused
       FROM doctor_profiles dp
       JOIN users u ON dp.user_id = u.id
       LEFT JOIN clinic_branches cb ON dp.primary_branch_id = cb.id
       LEFT JOIN queue_sessions qs ON qs.doctor_id = dp.id AND qs.session_date = $2 AND qs.is_active = true
       WHERE dp.clinic_id = $1 AND dp.is_active = true`,
      [clinicId, todayStr]
    );

    return res.status(200).json({
      success: true,
      data: {
        today_appointments: todayAppointments.rows,
        live_queue: liveQueue.rows,
        doctors_on_duty: doctorsOnDuty.rows,
        summary: {
          total_appointments: todayAppointments.rows.length,
          checked_in: todayAppointments.rows.filter(a => a.status === 'CHECKED_IN' || a.status === 'IN_CONSULTATION').length,
          completed: todayAppointments.rows.filter(a => a.status === 'COMPLETED').length,
          queue_waiting: liveQueue.rows.filter(q => q.queue_status === 'WAITING').length
        }
      }
    });
  } catch (err) {
    console.error('Receptionist dashboard error:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to load receptionist dashboard.' } });
  }
});

// GET /api/v1/clinic/dashboard/doctor
router.get('/dashboard/doctor', requireRoles('DOCTOR', 'CLINIC_OWNER'), async (req, res) => {
  const clinicId = req.clinicId;
  const todayStr = new Date().toISOString().split('T')[0];

  try {
    // Determine doctor profile id for requesting user or requested doctor_id
    let doctorProfileRes = await query(
      'SELECT * FROM doctor_profiles WHERE clinic_id = $1 AND user_id = $2',
      [clinicId, req.user.id]
    );

    // If owner or admin viewing doctor dashboard, allow doctor_id query param
    if (doctorProfileRes.rows.length === 0 && (req.userRole === 'CLINIC_OWNER' || req.userRole === 'SUPER_ADMIN')) {
      const doctorIdQuery = req.query.doctor_id;
      if (doctorIdQuery) {
        doctorProfileRes = await query('SELECT * FROM doctor_profiles WHERE clinic_id = $1 AND id = $2', [clinicId, doctorIdQuery]);
      } else {
        // Default to first doctor in clinic
        doctorProfileRes = await query('SELECT * FROM doctor_profiles WHERE clinic_id = $1 AND is_active = true LIMIT 1', [clinicId]);
      }
    }

    if (doctorProfileRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'DOCTOR_NOT_FOUND', message: 'No registered doctor profile found for your account in this clinic.' }
      });
    }

    const doctorProfile = doctorProfileRes.rows[0];

    const todayAppointments = await query(
      `SELECT a.id, a.appointment_time, a.duration_minutes, a.status, a.appointment_source, a.appointment_notes,
              p.id as patient_id, p.full_name as patient_name, p.phone_number, p.gender, p.blood_group, p.date_of_birth,
              p.allergies, p.medical_history_summary,
              cn.id as consultation_id, cn.symptoms, cn.diagnosis_summary, cn.treatment_plan
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       LEFT JOIN consultation_notes cn ON a.id = cn.appointment_id
       WHERE a.clinic_id = $1 AND a.doctor_id = $2 AND a.appointment_date = $3
       ORDER BY a.appointment_time ASC`,
      [clinicId, doctorProfile.id, todayStr]
    );

    const liveQueue = await query(
      `SELECT qe.id, qe.appointment_id, qe.token_number, qe.queue_status, qe.priority_flag, qe.priority_reason,
              qe.estimated_wait_minutes, qe.joined_at, qe.called_at, qe.consultation_started_at,
              p.id as patient_id, p.full_name as patient_name, p.phone_number, p.date_of_birth, p.gender, p.blood_group,
              p.allergies, p.medical_history_summary
       FROM queue_entries qe
       JOIN patients p ON qe.patient_id = p.id
       WHERE qe.clinic_id = $1 AND qe.doctor_id = $2 AND qe.queue_status IN ('WAITING', 'CALLED', 'IN_CONSULTATION')
       ORDER BY qe.priority_flag DESC, qe.token_sequence ASC`,
      [clinicId, doctorProfile.id]
    );

    const currentPatient = liveQueue.rows.find(q => q.queue_status === 'IN_CONSULTATION') || null;

    const queueSession = await query(
      'SELECT * FROM queue_sessions WHERE clinic_id = $1 AND doctor_id = $2 AND session_date = $3 AND is_active = true',
      [clinicId, doctorProfile.id, todayStr]
    );

    return res.status(200).json({
      success: true,
      data: {
        doctor_profile: doctorProfile,
        today_appointments: todayAppointments.rows,
        live_queue: liveQueue.rows,
        current_consultation: currentPatient,
        queue_session: queueSession.rows[0] || null,
        metrics: {
          assigned_today: todayAppointments.rows.length,
          waiting_count: liveQueue.rows.filter(q => q.queue_status === 'WAITING').length,
          completed_today: todayAppointments.rows.filter(a => a.status === 'COMPLETED').length
        }
      }
    });
  } catch (err) {
    console.error('Doctor dashboard error:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to load doctor workspace.' } });
  }
});

// GET /api/v1/clinic/branches
router.get('/branches', async (req, res) => {
  try {
    const branches = await query(
      'SELECT * FROM clinic_branches WHERE clinic_id = $1 ORDER BY is_main_branch DESC, created_at ASC',
      [req.clinicId]
    );
    return res.status(200).json({ success: true, data: { branches: branches.rows } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch branches.' } });
  }
});

// POST /api/v1/clinic/branches
router.post('/branches', requireRoles('CLINIC_OWNER'), async (req, res) => {
  const { name, phone, email, address, city, state, postal_code, is_main_branch } = req.body;
  if (!name || !city) {
    return res.status(400).json({ success: false, error: { message: 'Branch name and city are required.' } });
  }

  try {
    const id = uuidv4();
    const created = await query(
      `INSERT INTO clinic_branches (id, clinic_id, name, is_main_branch, phone, email, address, city, state, postal_code, operating_status, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'OPERATIONAL', true, NOW(), NOW()) RETURNING *`,
      [id, req.clinicId, name, !!is_main_branch, phone || null, email || null, address || null, city, state || 'Karnataka', postal_code || null]
    );
    return res.status(201).json({ success: true, data: { branch: created.rows[0] } });
  } catch (err) {
    console.error('Create branch error:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to create branch.' } });
  }
});

// PATCH /api/v1/clinic/branches/:id
router.patch('/branches/:id', requireRoles('CLINIC_OWNER'), async (req, res) => {
  const { id } = req.params;
  const { name, phone, email, address, city, operating_status, is_active } = req.body;

  try {
    const existing = await query('SELECT * FROM clinic_branches WHERE id = $1 AND clinic_id = $2', [id, req.clinicId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Branch not found in this clinic.' } });
    }

    const updated = await query(
      `UPDATE clinic_branches
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           email = COALESCE($3, email),
           address = COALESCE($4, address),
           city = COALESCE($5, city),
           operating_status = COALESCE($6, operating_status),
           is_active = COALESCE($7, is_active),
           updated_at = NOW()
       WHERE id = $8 AND clinic_id = $9 RETURNING *`,
      [name, phone, email, address, city, operating_status, is_active, id, req.clinicId]
    );

    return res.status(200).json({ success: true, data: { branch: updated.rows[0] } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: 'Failed to update branch.' } });
  }
});

// GET /api/v1/clinic/doctors
router.get('/doctors', async (req, res) => {
  try {
    const docs = await query(
      `SELECT dp.id, dp.user_id, dp.qualification, dp.specialty, dp.medical_registration_number,
              dp.experience_years, dp.consultation_fee, dp.consultation_duration_minutes, dp.verification_status, dp.is_active,
              u.full_name, u.email, u.phone_number,
              cb.name as primary_branch_name
       FROM doctor_profiles dp
       JOIN users u ON dp.user_id = u.id
       LEFT JOIN clinic_branches cb ON dp.primary_branch_id = cb.id
       WHERE dp.clinic_id = $1 AND dp.is_active = true
       ORDER BY u.full_name ASC`,
      [req.clinicId]
    );
    return res.status(200).json({ success: true, data: { doctors: docs.rows } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch doctors.' } });
  }
});

// GET /api/v1/clinic/schedules/doctor/:id
router.get('/schedules/doctor/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const schedules = await query(
      `SELECT ds.*, cb.name as branch_name 
       FROM doctor_schedules ds
       LEFT JOIN clinic_branches cb ON ds.branch_id = cb.id
       WHERE ds.doctor_profile_id = $1
       ORDER BY ds.day_of_week ASC`,
      [id]
    );
    return res.status(200).json({ success: true, data: { schedules: schedules.rows } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch doctor schedules.' } });
  }
});

// POST /api/v1/clinic/schedules/doctor/:id
router.post('/schedules/doctor/:id', requireRoles('CLINIC_OWNER', 'DOCTOR'), async (req, res) => {
  const { id } = req.params;
  const { branch_id, day_of_week, start_time, end_time, is_available, break_start_time, break_end_time } = req.body;

  if (day_of_week === undefined || !start_time || !end_time) {
    return res.status(400).json({ success: false, error: { message: 'day_of_week, start_time and end_time are required.' } });
  }

  try {
    // Delete existing schedule for that day and branch
    await query(
      'DELETE FROM doctor_schedules WHERE doctor_profile_id = $1 AND day_of_week = $2 AND branch_id = $3',
      [id, day_of_week, branch_id]
    );

    const scheduleId = uuidv4();
    const created = await query(
      `INSERT INTO doctor_schedules (id, doctor_profile_id, branch_id, day_of_week, start_time, end_time, is_available, break_start_time, break_end_time, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) RETURNING *`,
      [scheduleId, id, branch_id, day_of_week, start_time, end_time, is_available !== false, break_start_time || null, break_end_time || null]
    );

    return res.status(201).json({ success: true, data: { schedule: created.rows[0] } });
  } catch (err) {
    console.error('Schedule config error:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to configure doctor schedule.' } });
  }
});

// ==========================================
// Clinic Location Admin Scoped APIs
// (Strictly for this clinic location)
// ==========================================

// GET /api/v1/clinic/my-location - Clinic details for this location
router.get('/my-location', async (req, res) => {
  try {
    const clinicRes = await query('SELECT * FROM clinics WHERE id = $1', [req.clinicId]);
    if (clinicRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Clinic location not found.' } });
    }
    const branches = await query('SELECT * FROM clinic_branches WHERE clinic_id = $1 ORDER BY is_main_branch DESC', [req.clinicId]);
    return res.status(200).json({
      success: true,
      data: {
        clinic: clinicRes.rows[0],
        branches: branches.rows
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/v1/clinic/doctors - Add a doctor to this clinic location
router.post('/doctors', requireRoles('CLINIC_OWNER', 'SUPER_ADMIN'), async (req, res) => {
  const { full_name, email, phone_number, password, specialty, qualification, medical_registration_number, consultation_fee, branch_id } = req.body;
  const clinicId = req.clinicId;

  if (!full_name || !email || !specialty) {
    return res.status(400).json({ success: false, error: { message: 'full_name, email, and specialty are required.' } });
  }

  try {
    let userRes = await query('SELECT id FROM users WHERE email = $1', [email]);
    let userId;
    if (userRes.rows.length > 0) {
      userId = userRes.rows[0].id;
    } else {
      userId = uuidv4();
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(password || 'Password@123', salt);
      await query(
        `INSERT INTO users (id, email, phone_number, password_hash, full_name, is_active, is_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, true, true, NOW(), NOW())`,
        [userId, email.trim().toLowerCase(), phone_number || null, hash, full_name]
      );
    }

    const roleRes = await query("SELECT id FROM roles WHERE name = 'DOCTOR' LIMIT 1");
    const roleId = roleRes.rows[0]?.id;

    await query(`
      INSERT INTO clinic_memberships (id, clinic_id, user_id, role_id, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 'ACTIVE', NOW(), NOW())
      ON CONFLICT DO NOTHING
    `, [uuidv4(), clinicId, userId, roleId]);

    const doctorProfileId = uuidv4();
    let finalBranchId = branch_id;
    if (!finalBranchId) {
      const bRes = await query('SELECT id FROM clinic_branches WHERE clinic_id = $1 LIMIT 1', [clinicId]);
      finalBranchId = bRes.rows[0]?.id || null;
    }

    await query(`
      INSERT INTO doctor_profiles (
        id, user_id, clinic_id, primary_branch_id, specialty, qualification,
        medical_registration_number, state_medical_council, experience_years,
        consultation_fee, consultation_duration_minutes, verification_status,
        is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'Karnataka Medical Council', 8, $8, 15, 'VERIFIED', true, NOW(), NOW())
    `, [
      doctorProfileId, userId, clinicId, finalBranchId, specialty,
      qualification || 'MBBS, MD', medical_registration_number || `KMC-${Date.now().toString().slice(-6)}`,
      parseFloat(consultation_fee || 500)
    ]);

    return res.status(201).json({
      success: true,
      data: { message: 'Doctor added to clinic successfully.', doctor_id: doctorProfileId }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/v1/clinic/receptionists - Receptionists belonging to this clinic location ONLY
router.get('/receptionists', requireRoles('CLINIC_OWNER', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const recs = await query(`
      SELECT u.id, u.full_name, u.email, u.phone_number, u.is_active, cm.created_at
      FROM users u
      JOIN clinic_memberships cm ON u.id = cm.user_id
      JOIN roles r ON cm.role_id = r.id
      WHERE cm.clinic_id = $1 AND r.name = 'RECEPTIONIST'
      ORDER BY u.full_name ASC
    `, [req.clinicId]);
    return res.status(200).json({ success: true, data: { receptionists: recs.rows } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/v1/clinic/receptionists - Add receptionist to this clinic location
router.post('/receptionists', requireRoles('CLINIC_OWNER', 'SUPER_ADMIN'), async (req, res) => {
  const { full_name, email, phone_number, password } = req.body;
  const clinicId = req.clinicId;

  if (!full_name || !email) {
    return res.status(400).json({ success: false, error: { message: 'full_name and email are required.' } });
  }

  try {
    let userRes = await query('SELECT id FROM users WHERE email = $1', [email]);
    let userId;
    if (userRes.rows.length > 0) {
      userId = userRes.rows[0].id;
    } else {
      userId = uuidv4();
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(password || 'Password@123', salt);
      await query(
        `INSERT INTO users (id, email, phone_number, password_hash, full_name, is_active, is_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, true, true, NOW(), NOW())`,
        [userId, email.trim().toLowerCase(), phone_number || null, hash, full_name]
      );
    }

    const roleRes = await query("SELECT id FROM roles WHERE name = 'RECEPTIONIST' LIMIT 1");
    const roleId = roleRes.rows[0]?.id;

    await query(`
      INSERT INTO clinic_memberships (id, clinic_id, user_id, role_id, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 'ACTIVE', NOW(), NOW())
      ON CONFLICT DO NOTHING
    `, [uuidv4(), clinicId, userId, roleId]);

    return res.status(201).json({
      success: true,
      data: { message: 'Receptionist added to clinic successfully.', receptionist_id: userId }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/v1/clinic/patients-list - Patients who belong to or have appointments at this clinic location
router.get('/patients-list', async (req, res) => {
  try {
    const patients = await query(`
      SELECT p.*,
             (SELECT COUNT(*) FROM appointments a WHERE a.patient_id = p.id AND a.clinic_id = $1) as appointments_at_clinic,
             (SELECT MAX(a.appointment_date) FROM appointments a WHERE a.patient_id = p.id AND a.clinic_id = $1) as last_visit_date
      FROM patients p
      WHERE p.clinic_id = $1 OR p.id IN (SELECT DISTINCT patient_id FROM appointments WHERE clinic_id = $1)
      ORDER BY p.full_name ASC
    `, [req.clinicId]);
    return res.status(200).json({ success: true, data: { patients: patients.rows } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;
