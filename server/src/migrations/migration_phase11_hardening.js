/**
 * SMART CLINIC OS — PHASE 11 PRODUCTION HARDENING MIGRATION
 * Database Performance, Composite Indexing & Integrity Constraints
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'smart_clinic_os',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function runPhase11Migration() {
  const client = await pool.connect();
  try {
    console.log('================================================================');
    console.log('  STARTING PHASE 11 PRODUCTION DATABASE HARDENING & INDEXING   ');
    console.log('================================================================');

    await client.query('BEGIN');

    // 1. High-Traffic Core Appointments Composite Indexes
    console.log('1. Applying composite indexes to appointments...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_p11_appts_clinic_date_status 
      ON appointments(clinic_id, appointment_date, status);

      CREATE INDEX IF NOT EXISTS idx_p11_appts_doctor_date 
      ON appointments(doctor_id, appointment_date);

      CREATE INDEX IF NOT EXISTS idx_p11_appts_patient_created 
      ON appointments(patient_id, created_at DESC);
    `);

    // 2. High-Concurrency OPD Live Queue Indexes
    console.log('2. Applying composite indexes to queue_entries & sessions...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_p11_queue_session_status 
      ON queue_entries(queue_session_id, queue_status);

      CREATE INDEX IF NOT EXISTS idx_p11_queue_patient_joined 
      ON queue_entries(patient_id, joined_at);

      CREATE INDEX IF NOT EXISTS idx_p11_queue_token_lookup 
      ON queue_entries(clinic_id, token_number);

      CREATE INDEX IF NOT EXISTS idx_p11_session_active 
      ON queue_sessions(doctor_id, session_date, is_active);
    `);

    // 3. Clinical Consultation & Digital Prescriptions
    console.log('3. Applying indexes to consultation_notes & prescriptions...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_p11_consult_appt 
      ON consultation_notes(appointment_id);

      CREATE INDEX IF NOT EXISTS idx_p11_consult_doctor 
      ON consultation_notes(doctor_id, created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_p11_rx_patient_clinic 
      ON prescriptions(patient_id, clinic_id);

      CREATE INDEX IF NOT EXISTS idx_p11_rx_appt 
      ON prescriptions(appointment_id);

      CREATE INDEX IF NOT EXISTS idx_p11_rx_status 
      ON prescriptions(status);
    `);

    // 4. Billing & SaaS Subscriptions
    console.log('4. Applying indexes to payment_records & subscriptions...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_p11_pay_appt_status 
      ON payment_records(appointment_id, payment_status);

      CREATE INDEX IF NOT EXISTS idx_p11_pay_clinic_date 
      ON payment_records(clinic_id, created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_p11_sub_clinic_status 
      ON clinic_subscriptions(clinic_id, status);

      CREATE INDEX IF NOT EXISTS idx_p11_sub_pay_sub 
      ON subscription_payments(subscription_id, payment_status);

      CREATE INDEX IF NOT EXISTS idx_p11_sub_inv_sub 
      ON subscription_invoices(subscription_id, created_at DESC);
    `);

    // 5. Audit Logs & Compliance Trail
    console.log('5. Applying indexes to audit_logs...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_p11_audit_clinic_time 
      ON audit_logs(clinic_id, created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_p11_audit_actor 
      ON audit_logs(actor_user_id, created_at DESC);
    `);

    // 6. Teleconsultation & Ecosystem Integrations
    console.log('6. Applying indexes to teleconsultation, labs & pharmacy...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_p11_tele_appt_status 
      ON teleconsultation_rooms(appointment_id, status);

      CREATE INDEX IF NOT EXISTS idx_p11_tele_room_code 
      ON teleconsultation_rooms(room_code);

      CREATE INDEX IF NOT EXISTS idx_p11_lab_orders_patient 
      ON diagnostic_lab_orders(patient_id, status);

      CREATE INDEX IF NOT EXISTS idx_p11_lab_orders_clinic 
      ON diagnostic_lab_orders(clinic_id, created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_p11_pharm_orders_patient 
      ON pharmacy_orders(patient_id, status);

      CREATE INDEX IF NOT EXISTS idx_p11_pharm_orders_rx 
      ON pharmacy_orders(prescription_id);
    `);

    // 7. Secure Record Sharing & Access Logs (DPDP Act)
    console.log('7. Applying indexes to medical_record_shares & access logs...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_p11_share_token 
      ON medical_record_shares(share_token);

      CREATE INDEX IF NOT EXISTS idx_p11_share_patient_exp 
      ON medical_record_shares(patient_id, expires_at);

      CREATE INDEX IF NOT EXISTS idx_p11_access_share_time 
      ON record_access_logs(share_id, accessed_at DESC);
    `);

    // 8. Home Healthcare Marketplace
    console.log('8. Applying indexes to home_visit_bookings...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_p11_home_booking_prov_status 
      ON home_visit_bookings(provider_id, status);

      CREATE INDEX IF NOT EXISTS idx_p11_home_booking_patient 
      ON home_visit_bookings(patient_id, created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_p11_home_booking_clinic 
      ON home_visit_bookings(clinic_id, status);
    `);

    // Commit changes
    await client.query('COMMIT');
    console.log('\n[SUCCESS] Phase 11 composite and performance indexes committed!');

    // 9. Execute ANALYZE to update PostgreSQL query planner statistics
    console.log('9. Updating query planner statistics with ANALYZE...');
    await client.query('ANALYZE appointments;');
    await client.query('ANALYZE queue_entries;');
    await client.query('ANALYZE prescriptions;');
    await client.query('ANALYZE consultation_notes;');
    await client.query('ANALYZE payment_records;');
    await client.query('ANALYZE clinic_subscriptions;');
    await client.query('ANALYZE medical_record_shares;');
    await client.query('ANALYZE teleconsultation_rooms;');
    await client.query('ANALYZE home_visit_bookings;');
    console.log('[SUCCESS] Query planner statistics refreshed.');

    console.log('================================================================');
    console.log('  PHASE 11 DATABASE HARDENING MIGRATION COMPLETED SUCCESSFULLY ');
    console.log('================================================================');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[ERROR] Phase 11 database hardening failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runPhase11Migration().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = runPhase11Migration;
