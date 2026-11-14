const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { query, pool } = require('../config/db');

async function seed() {
  console.log('--- Starting Database Seeding ---');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Roles
    const roleRows = await client.query('SELECT id, name FROM roles');
    const roleMap = {};
    for (const r of roleRows.rows) {
      roleMap[r.name] = r.id;
    }

    const defaultPasswordHash = bcrypt.hashSync('Password@123', 10);

    // 2. Insert or update users
    async function upsertUser(phone, email, fullName, roleName) {
      const existing = await client.query('SELECT * FROM users WHERE phone_number = $1 OR email = $2', [phone, email]);
      if (existing.rows.length > 0) {
        return existing.rows[0];
      }
      const id = uuidv4();
      const res = await client.query(
        `INSERT INTO users (id, phone_number, email, password_hash, full_name, is_active, is_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, true, true, NOW(), NOW()) RETURNING *`,
        [id, phone, email, defaultPasswordHash, fullName]
      );
      return res.rows[0];
    }

    const superAdminUser = await upsertUser('+919999999999', 'admin@smartclinic.in', 'System Super Admin', 'SUPER_ADMIN');
    const ownerAUser = await upsertUser('+919876543210', 'owner@careplus.in', 'Dr. Ramesh Gupta (Owner)', 'CLINIC_OWNER');
    const doctorAUser = await upsertUser('+919876543211', 'doctor@careplus.in', 'Dr. Ananya Sharma', 'DOCTOR');
    const receptionistAUser = await upsertUser('+919876543212', 'reception@careplus.in', 'Priya Patel', 'RECEPTIONIST');

    // Clinic B (for multi-tenant isolation testing)
    const ownerBUser = await upsertUser('+919876543220', 'owner@apex.in', 'Dr. Vikram Malhotra (Apex Owner)', 'CLINIC_OWNER');
    const doctorBUser = await upsertUser('+919876543221', 'doctor@apex.in', 'Dr. Sneha Verma', 'DOCTOR');

    // 3. Upsert Clinic A (CarePlus)
    let clinicA;
    const existingClinicA = await client.query("SELECT * FROM clinics WHERE slug = 'careplus-indiranagar'");
    if (existingClinicA.rows.length > 0) {
      clinicA = existingClinicA.rows[0];
    } else {
      const id = uuidv4();
      const res = await client.query(
        `INSERT INTO clinics (id, name, slug, clinic_type, registration_number, email, phone, address, city, state, postal_code, verification_status, is_active, established_year, created_at, updated_at)
         VALUES ($1, 'CarePlus Family Clinic', 'careplus-indiranagar', 'POLYCLINIC', 'REG-KA-2024-8841', 'contact@careplus.in', '+919876543210', '100ft Road, Indiranagar', 'Bengaluru', 'Karnataka', '560038', 'VERIFIED', true, 2018, NOW(), NOW()) RETURNING *`,
        [id]
      );
      clinicA = res.rows[0];
    }

    // Upsert Clinic B (Apex)
    let clinicB;
    const existingClinicB = await client.query("SELECT * FROM clinics WHERE slug = 'apex-heart-koramangala'");
    if (existingClinicB.rows.length > 0) {
      clinicB = existingClinicB.rows[0];
    } else {
      const id = uuidv4();
      const res = await client.query(
        `INSERT INTO clinics (id, name, slug, clinic_type, registration_number, email, phone, address, city, state, postal_code, verification_status, is_active, established_year, created_at, updated_at)
         VALUES ($1, 'Apex Heart & Health Institute', 'apex-heart-koramangala', 'SPECIALTY', 'REG-KA-2024-9912', 'contact@apex.in', '+919876543220', '80ft Road, Koramangala 4th Block', 'Bengaluru', 'Karnataka', '560034', 'VERIFIED', true, 2020, NOW(), NOW()) RETURNING *`,
        [id]
      );
      clinicB = res.rows[0];
    }

    // 4. Branch for Clinic A
    let branchA;
    const existingBranchA = await client.query("SELECT * FROM clinic_branches WHERE clinic_id = $1", [clinicA.id]);
    if (existingBranchA.rows.length > 0) {
      branchA = existingBranchA.rows[0];
    } else {
      const id = uuidv4();
      const res = await client.query(
        `INSERT INTO clinic_branches (id, clinic_id, name, is_main_branch, phone, email, address, city, state, postal_code, operating_status, is_active, created_at, updated_at)
         VALUES ($1, $2, 'Main Branch - Indiranagar', true, '+919876543210', 'main@careplus.in', '100ft Road, Indiranagar', 'Bengaluru', 'Karnataka', '560038', 'OPERATIONAL', true, NOW(), NOW()) RETURNING *`,
        [id, clinicA.id]
      );
      branchA = res.rows[0];
    }

    // Branch for Clinic B
    let branchB;
    const existingBranchB = await client.query("SELECT * FROM clinic_branches WHERE clinic_id = $1", [clinicB.id]);
    if (existingBranchB.rows.length > 0) {
      branchB = existingBranchB.rows[0];
    } else {
      const id = uuidv4();
      const res = await client.query(
        `INSERT INTO clinic_branches (id, clinic_id, name, is_main_branch, phone, email, address, city, state, postal_code, operating_status, is_active, created_at, updated_at)
         VALUES ($1, $2, 'Apex Koramangala Flagship', true, '+919876543220', 'koramangala@apex.in', '80ft Road, Koramangala', 'Bengaluru', 'Karnataka', '560034', 'OPERATIONAL', true, NOW(), NOW()) RETURNING *`,
        [id, clinicB.id]
      );
      branchB = res.rows[0];
    }

    // 5. Clinic Memberships
    async function ensureMembership(clinicId, userId, roleName) {
      const roleId = roleMap[roleName];
      const ex = await client.query('SELECT * FROM clinic_memberships WHERE clinic_id = $1 AND user_id = $2', [clinicId, userId]);
      if (ex.rows.length === 0) {
        await client.query(
          `INSERT INTO clinic_memberships (id, clinic_id, user_id, role_id, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, 'ACTIVE', NOW(), NOW())`,
          [uuidv4(), clinicId, userId, roleId]
        );
      }
    }

    await ensureMembership(clinicA.id, ownerAUser.id, 'CLINIC_OWNER');
    await ensureMembership(clinicA.id, doctorAUser.id, 'DOCTOR');
    await ensureMembership(clinicA.id, receptionistAUser.id, 'RECEPTIONIST');

    await ensureMembership(clinicB.id, ownerBUser.id, 'CLINIC_OWNER');
    await ensureMembership(clinicB.id, doctorBUser.id, 'DOCTOR');

    // 6. Doctor Profiles
    async function ensureDoctorProfile(userId, clinicId, branchId, qualification, specialty, regNo, fee) {
      const ex = await client.query('SELECT * FROM doctor_profiles WHERE user_id = $1 AND clinic_id = $2', [userId, clinicId]);
      if (ex.rows.length > 0) return ex.rows[0];
      const id = uuidv4();
      const res = await client.query(
        `INSERT INTO doctor_profiles (id, user_id, clinic_id, primary_branch_id, qualification, specialty, medical_registration_number, registration_council, experience_years, consultation_fee, consultation_duration_minutes, verification_status, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'Karnataka Medical Council', 12, $8, 15, 'VERIFIED', true, NOW(), NOW()) RETURNING *`,
        [id, userId, clinicId, branchId, qualification, specialty, regNo, fee]
      );
      return res.rows[0];
    }

    const doctorProfileA = await ensureDoctorProfile(doctorAUser.id, clinicA.id, branchA.id, 'MBBS, MD (General Medicine)', 'General Physician', 'KMC-2012-45219', 500);
    const doctorProfileB = await ensureDoctorProfile(doctorBUser.id, clinicB.id, branchB.id, 'MBBS, MD, DM (Cardiology)', 'Cardiologist', 'KMC-2015-88310', 800);

    // 7. Doctor Schedule
    async function ensureSchedule(doctorProfileId, branchId) {
      const ex = await client.query('SELECT * FROM doctor_schedules WHERE doctor_profile_id = $1 AND branch_id = $2', [doctorProfileId, branchId]);
      if (ex.rows.length === 0) {
        for (let day = 1; day <= 6; day++) { // Mon-Sat
          await client.query(
            `INSERT INTO doctor_schedules (id, doctor_profile_id, branch_id, day_of_week, start_time, end_time, is_available, created_at, updated_at)
             VALUES ($1, $2, $3, $4, '09:00', '13:00', true, NOW(), NOW())`,
            [uuidv4(), doctorProfileId, branchId, day]
          );
        }
      }
    }
    await ensureSchedule(doctorProfileA.id, branchA.id);
    await ensureSchedule(doctorProfileB.id, branchB.id);

    // 8. Sample Patients for Clinic A
    async function ensurePatient(clinicId, phone, name, dob, gender, blood) {
      const ex = await client.query('SELECT * FROM patients WHERE clinic_id = $1 AND phone_number = $2', [clinicId, phone]);
      if (ex.rows.length > 0) return ex.rows[0];
      const id = uuidv4();
      const res = await client.query(
        `INSERT INTO patients (id, clinic_id, full_name, phone_number, email, date_of_birth, gender, blood_group, city, registered_by_user_id, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Bengaluru', $9, true, NOW(), NOW()) RETURNING *`,
        [id, clinicId, name, phone, name.toLowerCase().replace(/ /g, '') + '@example.com', dob, gender, blood, receptionistAUser.id]
      );
      return res.rows[0];
    }

    const patientA1 = await ensurePatient(clinicA.id, '+919811122233', 'Rahul Verma', '1989-05-14', 'MALE', 'O+');
    const patientA2 = await ensurePatient(clinicA.id, '+919822233344', 'Meera Krishnan', '1995-11-20', 'FEMALE', 'B+');
    const patientA3 = await ensurePatient(clinicA.id, '+919833344455', 'Amitabh Sen', '1968-02-09', 'MALE', 'AB+');

    // Patient for Clinic B
    const patientB1 = await ensurePatient(clinicB.id, '+919899988877', 'Vikramaditya Rao', '1975-08-12', 'MALE', 'A+');

    // 9. Sample Today Appointment for Clinic A
    const todayStr = new Date().toISOString().split('T')[0];
    const exAppt = await client.query('SELECT * FROM appointments WHERE clinic_id = $1 AND patient_id = $2 AND appointment_date = $3', [clinicA.id, patientA1.id, todayStr]);
    let apptA1;
    if (exAppt.rows.length > 0) {
      apptA1 = exAppt.rows[0];
    } else {
      const id = uuidv4();
      const res = await client.query(
        `INSERT INTO appointments (id, clinic_id, branch_id, patient_id, doctor_id, appointment_date, appointment_time, duration_minutes, status, appointment_source, consultation_fee, created_by_user_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, '10:00', 15, 'SCHEDULED', 'ONLINE', 500, $7, NOW(), NOW()) RETURNING *`,
        [id, clinicA.id, branchA.id, patientA1.id, doctorProfileA.id, todayStr, receptionistAUser.id]
      );
      apptA1 = res.rows[0];
    }

    // 10. Queue Session for Today
    let queueSessionA;
    const exSession = await client.query('SELECT * FROM queue_sessions WHERE clinic_id = $1 AND doctor_id = $2 AND session_date = $3', [clinicA.id, doctorProfileA.id, todayStr]);
    if (exSession.rows.length > 0) {
      queueSessionA = exSession.rows[0];
    } else {
      const id = uuidv4();
      const res = await client.query(
        `INSERT INTO queue_sessions (id, clinic_id, branch_id, doctor_id, session_date, is_active, is_paused, started_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, true, false, NOW(), NOW(), NOW()) RETURNING *`,
        [id, clinicA.id, branchA.id, doctorProfileA.id, todayStr]
      );
      queueSessionA = res.rows[0];
    }

    // 11. Queue Entry for Patient A1
    const exEntry = await client.query('SELECT * FROM queue_entries WHERE queue_session_id = $1 AND patient_id = $2', [queueSessionA.id, patientA1.id]);
    if (exEntry.rows.length === 0) {
      await client.query(
        `INSERT INTO queue_entries (id, queue_session_id, appointment_id, clinic_id, branch_id, doctor_id, patient_id, token_number, token_sequence, booking_source, queue_status, priority_flag, estimated_wait_minutes, joined_at, created_by_user_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'A-01', 1, 'ONLINE', 'WAITING', false, 15, NOW(), $8, NOW(), NOW())`,
        [uuidv4(), queueSessionA.id, apptA1.id, clinicA.id, branchA.id, doctorProfileA.id, patientA1.id, receptionistAUser.id]
      );
    }

    await client.query('COMMIT');
    console.log('Seeding completed successfully!');
    console.log('Default credentials for all seeded users: Password@123');
    console.log(`Clinic A (CarePlus) ID: ${clinicA.id}`);
    console.log(`Clinic B (Apex) ID: ${clinicB.id}`);
    console.log(`Owner A: ${ownerAUser.email}`);
    console.log(`Doctor A: ${doctorAUser.email}`);
    console.log(`Receptionist A: ${receptionistAUser.email}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

seed();
