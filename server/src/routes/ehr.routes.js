const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { query } = require('../config/db');
const { authenticateToken, requireClinicTenant, requireRoles } = require('../middleware/auth');
const { generatePrescriptionPdf } = require('../services/pdfGenerator');
const { storageDir } = require('../config/env');

router.use(authenticateToken);
router.use(requireClinicTenant);

// POST /api/v1/clinic/ehr/prescriptions
// Create or finalize a digital prescription
router.post('/prescriptions', requireRoles('DOCTOR', 'CLINIC_OWNER'), async (req, res) => {
  const clinicId = req.clinicId;
  const {
    patient_id,
    appointment_id,
    chief_complaints,
    diagnosis,
    treatment_plan,
    advice_and_precautions,
    follow_up_date,
    medications = [],
    is_draft = false
  } = req.body;

  if (!patient_id) {
    return res.status(400).json({ success: false, error: { message: 'patient_id is required.' } });
  }

  try {
    // 1. Fetch Doctor Profile
    let doctorProfileRes = await query(
      'SELECT dp.*, u.full_name as doctor_name FROM doctor_profiles dp JOIN users u ON dp.user_id = u.id WHERE dp.clinic_id = $1 AND dp.user_id = $2',
      [clinicId, req.user.id]
    );

    let doctorProfile = doctorProfileRes.rows[0];
    if (!doctorProfile) {
      // If owner creating test rx, pick first doctor
      const fallback = await query(
        'SELECT dp.*, u.full_name as doctor_name FROM doctor_profiles dp JOIN users u ON dp.user_id = u.id WHERE dp.clinic_id = $1 LIMIT 1',
        [clinicId]
      );
      doctorProfile = fallback.rows[0];
    }

    if (!doctorProfile) {
      return res.status(400).json({ success: false, error: { message: 'No registered doctor profile available for prescription issuance.' } });
    }

    const patientRes = await query('SELECT * FROM patients WHERE id = $1 AND clinic_id = $2', [patient_id, clinicId]);
    if (patientRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Patient not found in this clinic.' } });
    }
    const patient = patientRes.rows[0];
    const clinicRes = await query('SELECT * FROM clinics WHERE id = $1', [clinicId]);
    const clinic = clinicRes.rows[0];

    // 2. Prescription Number: RX-YYYYMMDD-XXXX
    const today = new Date();
    const dateCode = today.toISOString().slice(0, 10).replace(/-/g, '');
    const countRes = await query('SELECT COUNT(*) FROM prescriptions WHERE clinic_id = $1', [clinicId]);
    const seq = parseInt(countRes.rows[0].count, 10) + 1;
    const rxNumber = `RX-${dateCode}-${seq.toString().padStart(4, '0')}`;

    const rxId = uuidv4();
    const versionId = uuidv4();
    const verificationToken = crypto.randomBytes(16).toString('hex');

    // 3. Generate PDF if finalized
    let pdfResult = { storageKey: null, checksum: null };
    if (!is_draft) {
      pdfResult = await generatePrescriptionPdf({
        prescription_number: rxNumber,
        version_number: 1,
        clinic_name: clinic.name,
        clinic_address: clinic.address,
        clinic_phone: clinic.phone,
        doctor_name: doctorProfile.doctor_name,
        qualification: doctorProfile.qualification,
        specialty: doctorProfile.specialty,
        registration_number: doctorProfile.medical_registration_number,
        patient_name: patient.full_name,
        patient_phone: patient.phone_number,
        gender: patient.gender,
        blood_group: patient.blood_group,
        date: today.toLocaleDateString('en-IN'),
        chief_complaints,
        diagnosis,
        treatment_plan,
        advice_and_precautions,
        follow_up_date,
        medications,
        verification_token: verificationToken
      });
    }

    let finalBranchId = doctorProfile.primary_branch_id;
    if (!finalBranchId) {
      const bRes = await query('SELECT id FROM clinic_branches WHERE clinic_id = $1 LIMIT 1', [clinicId]);
      finalBranchId = bRes.rows[0]?.id;
    }

    // 4. Insert Prescription Head
    await query(
      `INSERT INTO prescriptions (
        id, prescription_number, clinic_id, branch_id, doctor_id, patient_id, appointment_id,
        current_version_id, status, finalized_at, published_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
      [
        rxId, rxNumber, clinicId, finalBranchId, doctorProfile.id, patient_id, appointment_id || null,
        versionId, is_draft ? 'DRAFT' : 'FINALIZED',
        is_draft ? null : new Date(), is_draft ? null : new Date()
      ]
    );

    // 5. Insert Prescription Version
    await query(
      `INSERT INTO prescription_versions (
        id, prescription_id, version_number, chief_complaints, diagnosis, diagnosis_type,
        treatment_plan, advice_and_precautions, follow_up_date, finalized_by_user_id,
        finalized_at, pdf_storage_key, document_checksum, verification_token, is_latest, created_at, updated_at
      ) VALUES ($1, $2, 1, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true, NOW(), NOW())`,
      [
        versionId, rxId, chief_complaints || null, diagnosis || null, req.body.diagnosis_type || 'CONFIRMED',
        treatment_plan || null, advice_and_precautions || null, follow_up_date || null,
        req.user.id, is_draft ? null : new Date(), pdfResult.storageKey, pdfResult.checksum, verificationToken
      ]
    );

    // 6. Insert Prescription Medications
    for (const med of medications) {
      await query(
        `INSERT INTO prescription_medications (
          id, prescription_version_id, medicine_name, generic_name, brand_name,
          strength, dosage, route, frequency, duration, timing_instructions,
          food_instructions, additional_instructions, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())`,
        [
          uuidv4(), versionId, med.medicine_name || med.name, med.generic_name || null,
          med.brand_name || null, med.strength || null, med.dosage || '1 tab',
          med.route || 'Oral', med.frequency || '1-0-1', med.duration || '5 days',
          med.timing_instructions || null, med.food_instructions || null, med.additional_instructions || null
        ]
      );
    }

    return res.status(201).json({
      success: true,
      data: {
        prescription_id: rxId,
        prescription_number: rxNumber,
        status: is_draft ? 'DRAFT' : 'FINALIZED',
        verification_token: verificationToken,
        pdf_storage_key: pdfResult.storageKey,
        checksum: pdfResult.checksum
      }
    });
  } catch (err) {
    console.error('Prescription generation error:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to create prescription.' } });
  }
});

// GET /api/v1/clinic/ehr/patient/:id/timeline
router.get('/patient/:id/timeline', async (req, res) => {
  const { id } = req.params;
  const clinicId = req.clinicId;

  try {
    const appts = await query(
      `SELECT a.id, 'APPOINTMENT' as type, a.appointment_date as event_date, a.status,
              u.full_name as doctor_name, dp.specialty, a.appointment_notes as summary
       FROM appointments a
       JOIN doctor_profiles dp ON a.doctor_id = dp.id
       JOIN users u ON dp.user_id = u.id
       WHERE a.patient_id = $1 AND a.clinic_id = $2
       ORDER BY a.appointment_date DESC`,
      [id, clinicId]
    );

    const prescriptions = await query(
      `SELECT pr.id, 'PRESCRIPTION' as type, pr.created_at as event_date, pr.status,
              pr.prescription_number, u.full_name as doctor_name, pv.diagnosis as summary,
              pv.pdf_storage_key, pv.verification_token
       FROM prescriptions pr
       JOIN doctor_profiles dp ON pr.doctor_id = dp.id
       JOIN users u ON dp.user_id = u.id
       JOIN prescription_versions pv ON pr.current_version_id = pv.id
       WHERE pr.patient_id = $1 AND pr.clinic_id = $2
       ORDER BY pr.created_at DESC`,
      [id, clinicId]
    );

    const timeline = [...appts.rows, ...prescriptions.rows].sort((a, b) => new Date(b.event_date) - new Date(a.event_date));

    return res.status(200).json({ success: true, data: { timeline } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch medical timeline.' } });
  }
});

// GET /api/v1/clinic/ehr/prescriptions/:id/download
router.get('/prescriptions/:id/download', async (req, res) => {
  const { id } = req.params;
  const clinicId = req.clinicId;

  try {
    const rxRes = await query(
      `SELECT pv.pdf_storage_key, pr.prescription_number
       FROM prescriptions pr
       JOIN prescription_versions pv ON pr.current_version_id = pv.id
       WHERE pr.id = $1 AND pr.clinic_id = $2`,
      [id, clinicId]
    );

    if (rxRes.rows.length === 0 || !rxRes.rows[0].pdf_storage_key) {
      return res.status(404).json({ success: false, error: { message: 'Prescription PDF not found or still in draft.' } });
    }

    const filePath = path.join(storageDir, rxRes.rows[0].pdf_storage_key);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: { message: 'Physical PDF file not found on server storage.' } });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${rxRes.rows[0].prescription_number}.pdf"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: 'Failed to download prescription.' } });
  }
});

module.exports = router;

