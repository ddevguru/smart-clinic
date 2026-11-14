const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query, withTransaction } = require('../config/db');
const { authenticateToken, requireClinicTenant } = require('../middleware/auth');

router.use(authenticateToken);
router.use(requireClinicTenant);

// Helper to get or create active queue session for doctor today
async function getOrCreateQueueSession(clinicId, branchId, doctorId, dateStr) {
  const ex = await query(
    'SELECT * FROM queue_sessions WHERE clinic_id = $1 AND doctor_id = $2 AND session_date = $3 AND is_active = true',
    [clinicId, doctorId, dateStr]
  );
  if (ex.rows.length > 0) return ex.rows[0];

  const sessionId = uuidv4();
  const created = await query(
    `INSERT INTO queue_sessions (id, clinic_id, branch_id, doctor_id, session_date, is_active, is_paused, started_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, true, false, NOW(), NOW(), NOW()) RETURNING *`,
    [sessionId, clinicId, branchId, doctorId, dateStr]
  );
  return created.rows[0];
}

// GET /api/v1/clinic/appointments
router.get('/', async (req, res) => {
  const clinicId = req.clinicId;
  const { doctor_id, patient_id, date, status } = req.query;

  try {
    let sql = `
      SELECT a.*,
             p.full_name as patient_name, p.phone_number as patient_phone, p.gender, p.blood_group,
             u.full_name as doctor_name, dp.specialty,
             cb.name as branch_name,
             pr.receipt_number, pr.payment_status, pr.amount as paid_amount
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctor_profiles dp ON a.doctor_id = dp.id
      JOIN users u ON dp.user_id = u.id
      LEFT JOIN clinic_branches cb ON a.branch_id = cb.id
      LEFT JOIN payment_records pr ON a.id = pr.appointment_id
      WHERE a.clinic_id = $1
    `;
    const params = [clinicId];

    if (doctor_id) {
      params.push(doctor_id);
      sql += ` AND a.doctor_id = $${params.length}`;
    }
    if (patient_id) {
      params.push(patient_id);
      sql += ` AND a.patient_id = $${params.length}`;
    }
    if (date) {
      params.push(date);
      sql += ` AND a.appointment_date = $${params.length}`;
    }
    if (status) {
      params.push(status);
      sql += ` AND a.status = $${params.length}`;
    }

    sql += ' ORDER BY a.appointment_date DESC, a.appointment_time ASC';

    const result = await query(sql, params);
    return res.status(200).json({ success: true, data: { appointments: result.rows } });
  } catch (err) {
    console.error('Fetch appointments error:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch appointments.' } });
  }
});

// POST /api/v1/clinic/appointments
// Standard slot-based appointment creation
router.post('/', async (req, res) => {
  const clinicId = req.clinicId;
  const { branch_id, patient_id, doctor_id, appointment_date, appointment_time, appointment_source, consultation_fee, appointment_notes } = req.body;

  if (!patient_id || !doctor_id || !appointment_date || !appointment_time) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'patient_id, doctor_id, appointment_date, and appointment_time are required.' }
    });
  }

  try {
    // Determine branch_id if not provided
    let finalBranchId = branch_id;
    if (!finalBranchId) {
      const docRes = await query('SELECT primary_branch_id FROM doctor_profiles WHERE id = $1', [doctor_id]);
      if (docRes.rows.length > 0 && docRes.rows[0].primary_branch_id) {
        finalBranchId = docRes.rows[0].primary_branch_id;
      } else {
        const branchRes = await query('SELECT id FROM clinic_branches WHERE clinic_id = $1 AND is_main_branch = true LIMIT 1', [clinicId]);
        finalBranchId = branchRes.rows[0] ? branchRes.rows[0].id : null;
      }
    }

    const apptId = uuidv4();
    const created = await query(
      `INSERT INTO appointments (
        id, clinic_id, branch_id, patient_id, doctor_id,
        appointment_date, appointment_time, duration_minutes,
        status, appointment_source, consultation_fee, appointment_notes,
        created_by_user_id, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 15, 'SCHEDULED', $8, $9, $10, $11, NOW(), NOW())
      RETURNING *`,
      [
        apptId, clinicId, finalBranchId, patient_id, doctor_id,
        appointment_date, appointment_time,
        appointment_source || 'ONLINE',
        consultation_fee || 500,
        appointment_notes || null,
        req.user.id
      ]
    );

    return res.status(201).json({
      success: true,
      data: { appointment: created.rows[0] }
    });
  } catch (err) {
    console.error('Create appointment error:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to create appointment.' } });
  }
});

// POST /api/v1/clinic/appointments/walkin and /api/v1/clinic/walk-ins
router.post(['/walkin', '/walk-ins'], async (req, res) => {
  const clinicId = req.clinicId;
  const {
    // If existing patient:
    patient_id,
    // If new patient:
    full_name, phone_number, gender, date_of_birth,
    // Common:
    doctor_id, branch_id, consultation_fee, priority_flag, priority_reason
  } = req.body;

  if (!doctor_id) {
    return res.status(400).json({ success: false, error: { message: 'doctor_id is required for walk-in registration.' } });
  }

  try {
    let finalPatientId = patient_id;

    // Register patient if new
    if (!finalPatientId) {
      if (!full_name || !phone_number) {
        return res.status(400).json({ success: false, error: { message: 'full_name and phone_number required for new walk-in patient.' } });
      }

      // Check existing by phone
      const exP = await query('SELECT id FROM patients WHERE clinic_id = $1 AND phone_number = $2', [clinicId, phone_number.trim()]);
      if (exP.rows.length > 0) {
        finalPatientId = exP.rows[0].id;
      } else {
        finalPatientId = uuidv4();
        await query(
          `INSERT INTO patients (id, clinic_id, full_name, phone_number, gender, date_of_birth, registered_by_user_id, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())`,
          [finalPatientId, clinicId, full_name.trim(), phone_number.trim(), gender || 'OTHER', date_of_birth || null, req.user.id]
        );
      }
    }

    // Determine branch_id
    let finalBranchId = branch_id;
    if (!finalBranchId) {
      const docRes = await query('SELECT primary_branch_id FROM doctor_profiles WHERE id = $1', [doctor_id]);
      finalBranchId = docRes.rows[0]?.primary_branch_id;
      if (!finalBranchId) {
        const brRes = await query('SELECT id FROM clinic_branches WHERE clinic_id = $1 LIMIT 1', [clinicId]);
        finalBranchId = brRes.rows[0]?.id;
      }
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const nowTimeStr = new Date().toTimeString().slice(0, 5);

    // 1. Ensure Queue Session
    const session = await getOrCreateQueueSession(clinicId, finalBranchId, doctor_id, todayStr);

    // 2. Execute Atomic Sequential Token Allocation inside Transaction
    const result = await withTransaction(async (client) => {
      // Row-level lock on the session guarantees zero race conditions
      await client.query('SELECT id FROM queue_sessions WHERE id = $1 FOR UPDATE', [session.id]);

      // 3. Create Checked-in Appointment
      const apptId = uuidv4();
      const apptRes = await client.query(
        `INSERT INTO appointments (
          id, clinic_id, branch_id, patient_id, doctor_id,
          appointment_date, appointment_time, duration_minutes,
          status, appointment_source, consultation_fee, checked_in_at,
          created_by_user_id, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 15, 'CHECKED_IN', 'WALK_IN', $8, NOW(), $9, NOW(), NOW())
        RETURNING *`,
        [apptId, clinicId, finalBranchId, finalPatientId, doctor_id, todayStr, nowTimeStr, consultation_fee || 500, req.user.id]
      );

      // 4. Atomic Maximum Token Sequence Calculation
      const countRes = await client.query(
        'SELECT COALESCE(MAX(token_sequence), 0) as max_seq FROM queue_entries WHERE queue_session_id = $1',
        [session.id]
      );
      const seq = parseInt(countRes.rows[0].max_seq, 10) + 1;
      const tokenNumber = `W-${seq.toString().padStart(2, '0')}`;

      // 5. Create Queue Entry
      const queueEntryId = uuidv4();
      const entryRes = await client.query(
        `INSERT INTO queue_entries (
          id, queue_session_id, appointment_id, clinic_id, branch_id, doctor_id, patient_id,
          token_number, token_sequence, booking_source, queue_status, priority_flag, priority_reason,
          estimated_wait_minutes, joined_at, created_by_user_id, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'WALK_IN', 'WAITING', $10, $11, $12, NOW(), $13, NOW(), NOW())
        RETURNING *`,
        [
          queueEntryId, session.id, apptId, clinicId, finalBranchId, doctor_id, finalPatientId,
          tokenNumber, seq, !!priority_flag, priority_reason || null,
          seq * 15, req.user.id
        ]
      );

      return {
        appointment: apptRes.rows[0],
        queue_entry: entryRes.rows[0],
        token_number: tokenNumber
      };
    });

    return res.status(201).json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('Walk-in check-in error:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to register walk-in patient.' } });
  }
});

// PATCH /api/v1/clinic/appointments/:id/status
router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, cancellation_reason } = req.body;
  const clinicId = req.clinicId;

  if (!status) {
    return res.status(400).json({ success: false, error: { message: 'status is required.' } });
  }

  try {
    const apptRes = await query('SELECT * FROM appointments WHERE id = $1 AND clinic_id = $2', [id, clinicId]);
    if (apptRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Appointment not found in this clinic.' } });
    }

    let extraSet = '';
    const params = [status, id, clinicId];
    if (status === 'CHECKED_IN') extraSet = ', checked_in_at = NOW()';
    if (status === 'COMPLETED') extraSet = ', completed_at = NOW()';
    if (status === 'CANCELLED' && cancellation_reason) {
      params.push(cancellation_reason);
      extraSet = `, cancellation_reason = $${params.length}`;
    }

    const updated = await query(
      `UPDATE appointments SET status = $1, updated_at = NOW() ${extraSet}
       WHERE id = $2 AND clinic_id = $3 RETURNING *`,
      params
    );

    // Also update corresponding queue_entry if status is COMPLETED or CANCELLED
    if (status === 'COMPLETED') {
      await query(
        `UPDATE queue_entries SET queue_status = 'COMPLETED', completed_at = NOW(), updated_at = NOW()
         WHERE appointment_id = $1 AND clinic_id = $2`,
        [id, clinicId]
      );
    } else if (status === 'CANCELLED') {
      await query(
        `UPDATE queue_entries SET queue_status = 'CANCELLED', cancelled_at = NOW(), updated_at = NOW()
         WHERE appointment_id = $1 AND clinic_id = $2`,
        [id, clinicId]
      );
    }

    return res.status(200).json({ success: true, data: { appointment: updated.rows[0] } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: 'Failed to update appointment status.' } });
  }
});

// GET /api/v1/clinic/appointments/:id/notes
router.get('/:id/notes', async (req, res) => {
  const { id } = req.params;
  try {
    const notesRes = await query(
      'SELECT * FROM consultation_notes WHERE appointment_id = $1',
      [id]
    );
    return res.status(200).json({
      success: true,
      data: { notes: notesRes.rows[0] || null }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch consultation notes.' } });
  }
});

// POST /api/v1/clinic/appointments/:id/notes
router.post('/:id/notes', async (req, res) => {
  const { id } = req.params;
  const clinicId = req.clinicId;
  const { chief_complaints, examination_findings, diagnosis_summary, treatment_plan, vital_signs, advice_and_precautions, follow_up_date } = req.body;

  try {
    const appt = await query('SELECT * FROM appointments WHERE id = $1 AND clinic_id = $2', [id, clinicId]);
    if (appt.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Appointment not found in this clinic.' } });
    }

    const exNotes = await query('SELECT id FROM consultation_notes WHERE appointment_id = $1', [id]);
    let saved;

    if (exNotes.rows.length > 0) {
      saved = await query(
        `UPDATE consultation_notes
         SET chief_complaints = COALESCE($1, chief_complaints),
             examination_findings = COALESCE($2, examination_findings),
             diagnosis_summary = COALESCE($3, diagnosis_summary),
             treatment_plan = COALESCE($4, treatment_plan),
             vital_signs = COALESCE($5, vital_signs),
             advice_and_precautions = COALESCE($6, advice_and_precautions),
             follow_up_date = COALESCE($7, follow_up_date),
             updated_at = NOW()
         WHERE appointment_id = $8 RETURNING *`,
        [chief_complaints, examination_findings, diagnosis_summary, treatment_plan, vital_signs, advice_and_precautions, follow_up_date || null, id]
      );
    } else {
      const noteId = uuidv4();
      saved = await query(
        `INSERT INTO consultation_notes (
          id, appointment_id, doctor_id, chief_complaints, examination_findings,
          diagnosis_summary, treatment_plan, vital_signs, advice_and_precautions,
          follow_up_date, is_draft, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false, NOW(), NOW()) RETURNING *`,
        [noteId, id, appt.rows[0].doctor_id, chief_complaints, examination_findings, diagnosis_summary, treatment_plan, vital_signs, advice_and_precautions, follow_up_date || null]
      );
    }

    return res.status(200).json({ success: true, data: { notes: saved.rows[0] } });
  } catch (err) {
    console.error('Save notes error:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to save consultation notes.' } });
  }
});

module.exports = router;
