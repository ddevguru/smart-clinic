const { pool, query } = require('../config/db');

async function runPhase7Migration() {
  console.log('--- Starting Phase 7 Database Migration ---');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. departure_recommendations
    await client.query(`
      CREATE TABLE IF NOT EXISTS departure_recommendations (
        id UUID PRIMARY KEY,
        patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
        queue_entry_id UUID REFERENCES queue_entries(id) ON DELETE SET NULL,
        clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        branch_id UUID REFERENCES clinic_branches(id) ON DELETE SET NULL,
        doctor_id UUID REFERENCES doctor_profiles(id) ON DELETE SET NULL,
        origin_latitude NUMERIC(10, 6),
        origin_longitude NUMERIC(10, 6),
        origin_address TEXT,
        destination_latitude NUMERIC(10, 6),
        destination_longitude NUMERIC(10, 6),
        expected_turn_at TIMESTAMPTZ NOT NULL,
        estimated_travel_seconds INTEGER NOT NULL,
        estimated_travel_text VARCHAR(100),
        traffic_duration_seconds INTEGER,
        traffic_status VARCHAR(50) DEFAULT 'NORMAL',
        distance_meters INTEGER,
        distance_text VARCHAR(100),
        arrival_buffer_seconds INTEGER DEFAULT 600,
        recommended_departure_at TIMESTAMPTZ NOT NULL,
        estimation_confidence VARCHAR(20) DEFAULT 'HIGH',
        recommendation_status VARCHAR(50) DEFAULT 'READY',
        route_polyline TEXT,
        traffic_retrieved_at TIMESTAMPTZ,
        queue_estimated_at TIMESTAMPTZ,
        calculated_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Indexes for fast lookup
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_dep_rec_patient ON departure_recommendations(patient_id);
      CREATE INDEX IF NOT EXISTS idx_dep_rec_appt ON departure_recommendations(appointment_id);
      CREATE INDEX IF NOT EXISTS idx_dep_rec_queue ON departure_recommendations(queue_entry_id);
      CREATE INDEX IF NOT EXISTS idx_dep_rec_clinic ON departure_recommendations(clinic_id);
    `);

    // 2. traffic_route_snapshots (Route caching & deduplication)
    await client.query(`
      CREATE TABLE IF NOT EXISTS traffic_route_snapshots (
        id UUID PRIMARY KEY,
        origin_hash VARCHAR(64) NOT NULL,
        destination_hash VARCHAR(64) NOT NULL,
        travel_mode VARCHAR(30) DEFAULT 'DRIVING',
        duration_seconds INTEGER NOT NULL,
        traffic_duration_seconds INTEGER NOT NULL,
        distance_meters INTEGER NOT NULL,
        distance_text VARCHAR(50),
        duration_text VARCHAR(50),
        raw_response JSON,
        cached_until TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_route_snapshots_hashes ON traffic_route_snapshots(origin_hash, destination_hash, travel_mode);
    `);

    // 3. automation_settings (Clinic Level)
    await client.query(`
      CREATE TABLE IF NOT EXISTS automation_settings (
        id UUID PRIMARY KEY,
        clinic_id UUID NOT NULL UNIQUE REFERENCES clinics(id) ON DELETE CASCADE,
        reminders_enabled BOOLEAN DEFAULT true,
        reminder_intervals_hours INTEGER[] DEFAULT '{24, 2, 0}'::INTEGER[],
        queue_alerts_enabled BOOLEAN DEFAULT true,
        turn_approaching_threshold INTEGER DEFAULT 2,
        delay_alerts_enabled BOOLEAN DEFAULT true,
        delay_threshold_minutes INTEGER DEFAULT 15,
        traffic_departure_enabled BOOLEAN DEFAULT true,
        default_arrival_buffer_minutes INTEGER DEFAULT 10,
        google_maps_cache_ttl_minutes INTEGER DEFAULT 10,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 4. automation_job_logs (Idempotent delivery & execution tracking)
    await client.query(`
      CREATE TABLE IF NOT EXISTS automation_job_logs (
        id UUID PRIMARY KEY,
        job_type VARCHAR(100) NOT NULL,
        clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
        recipient_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
        queue_entry_id UUID REFERENCES queue_entries(id) ON DELETE SET NULL,
        channel VARCHAR(50) DEFAULT 'PUSH',
        status VARCHAR(50) DEFAULT 'SENT',
        error_message TEXT,
        idempotency_key VARCHAR(128) UNIQUE,
        payload JSON,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_job_logs_idemp ON automation_job_logs(idempotency_key);
    `);

    // 5. notification_preferences (Patient Level)
    await client.query(`
      CREATE TABLE IF NOT EXISTS notification_preferences (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        appointment_reminders BOOLEAN DEFAULT true,
        queue_notifications BOOLEAN DEFAULT true,
        departure_recommendations BOOLEAN DEFAULT true,
        delay_alerts BOOLEAN DEFAULT true,
        push_enabled BOOLEAN DEFAULT true,
        sms_enabled BOOLEAN DEFAULT true,
        whatsapp_enabled BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 6. delay_event_logs (Doctor Operational Delays)
    await client.query(`
      CREATE TABLE IF NOT EXISTS delay_event_logs (
        id UUID PRIMARY KEY,
        clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        branch_id UUID REFERENCES clinic_branches(id) ON DELETE SET NULL,
        doctor_id UUID NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
        queue_session_id UUID REFERENCES queue_sessions(id) ON DELETE SET NULL,
        delay_minutes INTEGER NOT NULL,
        reason TEXT,
        affected_patient_count INTEGER DEFAULT 0,
        recorded_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 7. Update clinic_branches with verified coordinates
    await client.query(`
      UPDATE clinic_branches
      SET latitude = 12.9784, longitude = 77.6408
      WHERE name LIKE '%Indiranagar%' AND latitude IS NULL;

      UPDATE clinic_branches
      SET latitude = 12.9352, longitude = 77.6245
      WHERE name LIKE '%Koramangala%' AND latitude IS NULL;

      UPDATE clinic_branches
      SET latitude = 12.9698, longitude = 77.7499
      WHERE name LIKE '%Whitefield%' AND latitude IS NULL;
    `);

    // 8. Seed default automation settings for existing clinics
    const clinics = await client.query('SELECT id FROM clinics');
    const { v4: uuidv4 } = require('uuid');
    for (const c of clinics.rows) {
      await client.query(`
        INSERT INTO automation_settings (
          id, clinic_id, reminders_enabled, reminder_intervals_hours,
          queue_alerts_enabled, turn_approaching_threshold, delay_alerts_enabled,
          delay_threshold_minutes, traffic_departure_enabled, default_arrival_buffer_minutes,
          created_at, updated_at
        ) VALUES ($1, $2, true, '{24, 2, 0}'::INTEGER[], true, 2, true, 15, true, 10, NOW(), NOW())
        ON CONFLICT (clinic_id) DO NOTHING
      `, [uuidv4(), c.id]);
    }

    await client.query('COMMIT');
    console.log('--- Phase 7 Migration Completed Successfully! ---');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

runPhase7Migration();

