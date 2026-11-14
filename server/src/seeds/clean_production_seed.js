const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/db');

async function cleanProductionSeed() {
  console.log('====================================================');
  console.log('  SMART CLINIC OS — CLEAN PRODUCTION SETUP & SEEDING');
  console.log('  Wiping all mock data & creating verified staff logins');
  console.log('====================================================');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Wipe all mock and transactional data completely
    console.log('[1/5] Truncating all mock & transactional tables...');
    await client.query(`
      TRUNCATE TABLE
        prescription_medications,
        prescription_versions,
        prescriptions,
        consultation_notes,
        follow_up_records,
        medical_documents,
        record_sharing_consents,
        payment_adjustments,
        payment_records,
        departure_recommendations,
        delay_event_logs,
        automation_job_logs,
        traffic_route_snapshots,
        queue_state_history,
        queue_pause_history,
        queue_token_counters,
        queue_entries,
        queue_sessions,
        appointments,
        patient_medical_profiles,
        patients,
        otp_verifications,
        audit_logs
      CASCADE;
    `);

    // 2. Clean users table: remove all dummy users, keep only recognized staff/admin emails
    console.log('[2/5] Cleaning users table (removing mock patient users)...');
    const allowedEmails = [
      'admin@smartclinic.in',
      'admin@smartclinicos.in',
      'owner@careplus.in',
      'doctor@careplus.in',
      'reception@careplus.in',
      'owner@apex.in',
      'doctor@apex.in'
    ];

    await client.query(`
      DELETE FROM clinic_memberships 
      WHERE user_id IN (SELECT id FROM users WHERE NOT (email = ANY($1)));
    `, [allowedEmails]);

    await client.query(`
      DELETE FROM doctor_profiles 
      WHERE user_id IN (SELECT id FROM users WHERE NOT (email = ANY($1)));
    `, [allowedEmails]);

    await client.query(`
      DELETE FROM users 
      WHERE NOT (email = ANY($1));
    `, [allowedEmails]);

    // 3. Ensure Roles & Permissions exist
    console.log('[3/5] Verifying system roles & role assignments...');
    const rolesRes = await client.query('SELECT id, name FROM roles');
    const roleMap = {};
    for (const r of rolesRes.rows) {
      roleMap[r.name] = r.id;
    }

    const defaultPasswordHash = bcrypt.hashSync('Password@123', 10);

    async function upsertStaffUser(phone, email, fullName) {
      const existing = await client.query('SELECT * FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        await client.query(
          `UPDATE users SET password_hash = $1, is_active = true, is_verified = true, full_name = $2, phone_number = $3, updated_at = NOW() WHERE id = $4`,
          [defaultPasswordHash, fullName, phone, existing.rows[0].id]
        );
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

    // Create / ensure Staff Logins
    const superAdmin = await upsertStaffUser('+919999999999', 'admin@smartclinic.in', 'System Super Admin');
    const ownerA = await upsertStaffUser('+919876543210', 'owner@careplus.in', 'Dr. Ramesh Gupta');
    const doctorA = await upsertStaffUser('+919876543211', 'doctor@careplus.in', 'Dr. Ananya Sharma');
    const receptionistA = await upsertStaffUser('+919876543212', 'reception@careplus.in', 'Priya Patel');

    // Secondary clinic for multi-tenant isolation testing
    const ownerB = await upsertStaffUser('+919876543220', 'owner@apex.in', 'Dr. Vikram Malhotra');
    const doctorB = await upsertStaffUser('+919876543221', 'doctor@apex.in', 'Dr. Sneha Verma');

    // 4. Ensure Clinics & Branches
    console.log('[4/5] Verifying clinic institutions & branches...');
    async function upsertClinic(slug, name, type, regNo, email, phone, address, city, state, postal) {
      const ex = await client.query('SELECT * FROM clinics WHERE slug = $1', [slug]);
      if (ex.rows.length > 0) return ex.rows[0];
      const id = uuidv4();
      const res = await client.query(
        `INSERT INTO clinics (id, name, slug, clinic_type, registration_number, email, phone, address, city, state, postal_code, verification_status, is_active, established_year, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'VERIFIED', true, 2018, NOW(), NOW()) RETURNING *`,
        [id, name, slug, type, regNo, email, phone, address, city, state, postal]
      );
      return res.rows[0];
    }

    const clinicA = await upsertClinic(
      'careplus-indiranagar',
      'CarePlus Family Clinic',
      'POLYCLINIC',
      'REG-KA-2024-8841',
      'contact@careplus.in',
      '+919876543210',
      '100ft Road, Indiranagar',
      'Bengaluru',
      'Karnataka',
      '560038'
    );

    const clinicB = await upsertClinic(
      'apex-heart-koramangala',
      'Apex Heart & Health Institute',
      'SPECIALTY',
      'REG-KA-2024-9912',
      'contact@apex.in',
      '+919876543220',
      '80ft Road, Koramangala 4th Block',
      'Bengaluru',
      'Karnataka',
      '560034'
    );

    async function upsertBranch(clinicId, name, isMain, phone, email, address, city, state, postal, lat, lng) {
      const ex = await client.query('SELECT * FROM clinic_branches WHERE clinic_id = $1 AND name = $2', [clinicId, name]);
      if (ex.rows.length > 0) {
        await client.query(`UPDATE clinic_branches SET latitude = $1, longitude = $2 WHERE id = $3`, [lat, lng, ex.rows[0].id]);
        return ex.rows[0];
      }
      const id = uuidv4();
      const res = await client.query(
        `INSERT INTO clinic_branches (id, clinic_id, name, is_main_branch, phone, email, address, city, state, postal_code, latitude, longitude, operating_status, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'OPERATIONAL', true, NOW(), NOW()) RETURNING *`,
        [id, clinicId, name, isMain, phone, email, address, city, state, postal, lat, lng]
      );
      return res.rows[0];
    }

    const branchA1 = await upsertBranch(clinicA.id, 'Main Branch - Indiranagar', true, '+919876543210', 'main@careplus.in', '100ft Road, Indiranagar', 'Bengaluru', 'Karnataka', '560038', 12.9784, 77.6408);
    const branchA2 = await upsertBranch(clinicA.id, 'Koramangala Diagnostic Center', false, '+919876543214', 'koramangala@careplus.in', '80ft Road, 4th Block', 'Bengaluru', 'Karnataka', '560034', 12.9352, 77.6245);
    const branchA3 = await upsertBranch(clinicA.id, 'Whitefield Medical Hub', false, '+919876543215', 'whitefield@careplus.in', 'ITPL Main Road', 'Bengaluru', 'Karnataka', '560066', 12.9698, 77.7499);
    const branchB1 = await upsertBranch(clinicB.id, 'Apex Koramangala Flagship', true, '+919876543220', 'koramangala@apex.in', '80ft Road, Koramangala', 'Bengaluru', 'Karnataka', '560034', 12.9352, 77.6245);

    // Memberships
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

    await ensureMembership(clinicA.id, ownerA.id, 'CLINIC_OWNER');
    await ensureMembership(clinicA.id, doctorA.id, 'DOCTOR');
    await ensureMembership(clinicA.id, receptionistA.id, 'RECEPTIONIST');
    await ensureMembership(clinicB.id, ownerB.id, 'CLINIC_OWNER');
    await ensureMembership(clinicB.id, doctorB.id, 'DOCTOR');

    // Doctor Profiles
    async function ensureDocProfile(userId, clinicId, branchId, qual, spec, regNo, fee) {
      const ex = await client.query('SELECT * FROM doctor_profiles WHERE user_id = $1 AND clinic_id = $2', [userId, clinicId]);
      if (ex.rows.length > 0) return ex.rows[0];
      const id = uuidv4();
      const res = await client.query(
        `INSERT INTO doctor_profiles (id, user_id, clinic_id, primary_branch_id, qualification, specialty, medical_registration_number, registration_council, experience_years, consultation_fee, consultation_duration_minutes, verification_status, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'Karnataka Medical Council', 12, $8, 15, 'VERIFIED', true, NOW(), NOW()) RETURNING *`,
        [id, userId, clinicId, branchId, qual, spec, regNo, fee]
      );
      return res.rows[0];
    }

    const docProfA = await ensureDocProfile(doctorA.id, clinicA.id, branchA1.id, 'MBBS, MD (General Medicine)', 'General Physician', 'KMC-2012-45219', 500);
    const docProfB = await ensureDocProfile(doctorB.id, clinicB.id, branchB1.id, 'MBBS, MD, DM (Cardiology)', 'Cardiologist', 'KMC-2015-88310', 800);

    // Doctor Schedules (OPD Timetable)
    async function ensureSchedules(docProfId, branchId) {
      const ex = await client.query('SELECT * FROM doctor_schedules WHERE doctor_profile_id = $1 AND branch_id = $2', [docProfId, branchId]);
      if (ex.rows.length === 0) {
        for (let day = 1; day <= 6; day++) {
          await client.query(
            `INSERT INTO doctor_schedules (id, doctor_profile_id, branch_id, day_of_week, start_time, end_time, is_available, created_at, updated_at)
             VALUES ($1, $2, $3, $4, '09:00', '13:00', true, NOW(), NOW())`,
            [uuidv4(), docProfId, branchId, day]
          );
        }
      }
    }
    await ensureSchedules(docProfA.id, branchA1.id);
    await ensureSchedules(docProfB.id, branchB1.id);

    // Automation Settings
    async function ensureAutomationSettings(clinicId) {
      await client.query(`
        INSERT INTO automation_settings (
          id, clinic_id, reminders_enabled, reminder_intervals_hours,
          queue_alerts_enabled, turn_approaching_threshold, delay_alerts_enabled,
          delay_threshold_minutes, traffic_departure_enabled, default_arrival_buffer_minutes,
          updated_at
        ) VALUES (
          gen_random_uuid(), $1, true, ARRAY[24, 2, 0],
          true, 2, true, 15, true, 10, NOW()
        )
        ON CONFLICT (clinic_id) DO NOTHING;
      `, [clinicId]);
    }
    await ensureAutomationSettings(clinicA.id);
    await ensureAutomationSettings(clinicB.id);

    await client.query('COMMIT');
    console.log('[5/5] Database clean setup successfully committed!');

    // Audit Row Counts
    console.log('\n--- VERIFICATION: CLEAN DATABASE STATE ---');
    const checkTables = [
      'appointments',
      'patients',
      'queue_entries',
      'queue_sessions',
      'payment_records',
      'prescriptions',
      'consultation_notes',
      'delay_event_logs',
      'departure_recommendations',
      'automation_job_logs',
      'users',
      'clinics',
      'clinic_branches',
      'doctor_profiles'
    ];

    for (const tbl of checkTables) {
      const countRes = await client.query(`SELECT count(*) as cnt FROM "${tbl}"`);
      console.log(`  ${tbl.padEnd(28)}: ${countRes.rows[0].cnt} rows`);
    }

    console.log('\n--- VERIFIED STAFF LOGINS (READY FOR PRODUCTION USE) ---');
    console.log('1. Super Admin:   admin@smartclinic.in    / Password@123  (Platform Governance)');
    console.log('2. Clinic Owner:  owner@careplus.in       / Password@123  (Executive Analytics & Settings)');
    console.log('3. Doctor:        doctor@careplus.in      / Password@123  (OPD Desk & Prescriptions)');
    console.log('4. Receptionist:  reception@careplus.in   / Password@123  (Front Desk & Live Queue)');
    console.log('----------------------------------------------------');
    console.log('Zero mock patients. Zero mock appointments. 100% clean!');
    console.log('====================================================\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Clean seed failed:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

cleanProductionSeed();
