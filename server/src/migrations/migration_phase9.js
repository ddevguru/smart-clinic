const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

async function runPhase9Migration() {
  console.log('--- Starting Phase 9 Migration: Home Healthcare Marketplace ---');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. healthcare_service_categories
    console.log('Creating table healthcare_service_categories...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS healthcare_service_categories (
        id UUID PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        icon_name VARCHAR(50) DEFAULT 'Home',
        is_clinical_procedure BOOLEAN DEFAULT false,
        display_order INT DEFAULT 1,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_hsc_code ON healthcare_service_categories(code);
      CREATE INDEX IF NOT EXISTS idx_hsc_active ON healthcare_service_categories(is_active);
    `);

    // 2. healthcare_services
    console.log('Creating table healthcare_services...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS healthcare_services (
        id UUID PRIMARY KEY,
        category_id UUID NOT NULL REFERENCES healthcare_service_categories(id) ON DELETE CASCADE,
        name VARCHAR(150) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        default_duration_minutes INT NOT NULL DEFAULT 45,
        base_price NUMERIC(10,2) NOT NULL DEFAULT 500.00,
        required_qualification_type VARCHAR(100),
        service_scope_notes TEXT,
        sac_code VARCHAR(20) DEFAULT '999312',
        is_active BOOLEAN DEFAULT true,
        display_order INT DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_hs_category ON healthcare_services(category_id);
      CREATE INDEX IF NOT EXISTS idx_hs_code ON healthcare_services(code);
    `);

    // 3. healthcare_provider_profiles
    console.log('Creating table healthcare_provider_profiles...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS healthcare_provider_profiles (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider_type VARCHAR(50) NOT NULL,
        full_name VARCHAR(150) NOT NULL,
        email VARCHAR(150) NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        qualification VARCHAR(150) NOT NULL,
        specialty VARCHAR(100),
        experience_years INT DEFAULT 1,
        registration_number VARCHAR(100),
        registration_council VARCHAR(150),
        languages JSONB DEFAULT '["English", "Hindi", "Kannada"]'::jsonb,
        bio TEXT,
        profile_photo_url VARCHAR(255),
        verification_status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
        verification_notes TEXT,
        verified_at TIMESTAMPTZ,
        verified_by_user_id UUID REFERENCES users(id),
        associated_clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
        is_independent BOOLEAN DEFAULT true,
        rating_avg NUMERIC(3,2) DEFAULT 0.00,
        rating_count INT DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_hpp_user ON healthcare_provider_profiles(user_id);
      CREATE INDEX IF NOT EXISTS idx_hpp_type ON healthcare_provider_profiles(provider_type);
      CREATE INDEX IF NOT EXISTS idx_hpp_status ON healthcare_provider_profiles(verification_status);
      CREATE INDEX IF NOT EXISTS idx_hpp_clinic ON healthcare_provider_profiles(associated_clinic_id);
    `);

    // 4. provider_credentials
    console.log('Creating table provider_credentials...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS provider_credentials (
        id UUID PRIMARY KEY,
        provider_id UUID NOT NULL REFERENCES healthcare_provider_profiles(id) ON DELETE CASCADE,
        credential_type VARCHAR(100) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(255),
        file_size INT,
        verification_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
        verification_notes TEXT,
        verified_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_pc_provider ON provider_credentials(provider_id);
    `);

    // 5. provider_services
    console.log('Creating table provider_services...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS provider_services (
        id UUID PRIMARY KEY,
        provider_id UUID NOT NULL REFERENCES healthcare_provider_profiles(id) ON DELETE CASCADE,
        service_id UUID NOT NULL REFERENCES healthcare_services(id) ON DELETE CASCADE,
        custom_price NUMERIC(10,2),
        is_offered BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(provider_id, service_id)
      );
      CREATE INDEX IF NOT EXISTS idx_ps_provider ON provider_services(provider_id);
      CREATE INDEX IF NOT EXISTS idx_ps_service ON provider_services(service_id);
    `);

    // 6. provider_service_areas
    console.log('Creating table provider_service_areas...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS provider_service_areas (
        id UUID PRIMARY KEY,
        provider_id UUID NOT NULL REFERENCES healthcare_provider_profiles(id) ON DELETE CASCADE,
        city VARCHAR(100) NOT NULL,
        locality VARCHAR(100),
        postal_code VARCHAR(10),
        service_radius_km NUMERIC(5,2) DEFAULT 10.00,
        base_latitude NUMERIC(10,7) DEFAULT 12.9716,
        base_longitude NUMERIC(10,7) DEFAULT 77.5946,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_psa_provider ON provider_service_areas(provider_id);
      CREATE INDEX IF NOT EXISTS idx_psa_city ON provider_service_areas(city);
      CREATE INDEX IF NOT EXISTS idx_psa_postal ON provider_service_areas(postal_code);
    `);

    // 7. provider_availability
    console.log('Creating table provider_availability...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS provider_availability (
        id UUID PRIMARY KEY,
        provider_id UUID NOT NULL REFERENCES healthcare_provider_profiles(id) ON DELETE CASCADE,
        day_of_week INT NOT NULL,
        start_time VARCHAR(8) NOT NULL DEFAULT '09:00',
        end_time VARCHAR(8) NOT NULL DEFAULT '18:00',
        max_daily_visits INT DEFAULT 6,
        buffer_minutes INT DEFAULT 30,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(provider_id, day_of_week)
      );
      CREATE INDEX IF NOT EXISTS idx_pa_provider ON provider_availability(provider_id);
    `);

    // 8. home_visit_bookings
    console.log('Creating table home_visit_bookings...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS home_visit_bookings (
        id UUID PRIMARY KEY,
        booking_reference VARCHAR(50) UNIQUE NOT NULL,
        patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        booked_by_user_id UUID REFERENCES users(id),
        provider_id UUID REFERENCES healthcare_provider_profiles(id),
        service_id UUID NOT NULL REFERENCES healthcare_services(id),
        service_category_id UUID NOT NULL REFERENCES healthcare_service_categories(id),
        clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
        assignment_type VARCHAR(30) NOT NULL DEFAULT 'PATIENT_SELECTED',
        status VARCHAR(30) NOT NULL DEFAULT 'REQUESTED',
        scheduled_date DATE NOT NULL,
        scheduled_start_time VARCHAR(8) NOT NULL,
        scheduled_end_time VARCHAR(8) NOT NULL,
        estimated_travel_minutes INT DEFAULT 20,
        estimated_travel_distance_km NUMERIC(5,2) DEFAULT 5.00,
        service_address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL DEFAULT 'Bengaluru',
        postal_code VARCHAR(10) NOT NULL,
        latitude NUMERIC(10,7),
        longitude NUMERIC(10,7),
        contact_phone VARCHAR(20) NOT NULL,
        patient_notes TEXT,
        service_price NUMERIC(10,2) NOT NULL,
        travel_charge NUMERIC(10,2) NOT NULL DEFAULT 0.00,
        tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
        total_amount NUMERIC(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'INR',
        payment_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
        payment_method VARCHAR(30) DEFAULT 'RAZORPAY',
        gateway_order_id VARCHAR(100),
        gateway_payment_id VARCHAR(100),
        commission_rate_pct NUMERIC(5,2) DEFAULT 15.00,
        platform_commission_amount NUMERIC(10,2) DEFAULT 0.00,
        provider_payable_amount NUMERIC(10,2) DEFAULT 0.00,
        payout_status VARCHAR(30) DEFAULT 'PENDING',
        completed_at TIMESTAMPTZ,
        cancelled_at TIMESTAMPTZ,
        cancellation_reason TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_hvb_patient ON home_visit_bookings(patient_id);
      CREATE INDEX IF NOT EXISTS idx_hvb_provider ON home_visit_bookings(provider_id);
      CREATE INDEX IF NOT EXISTS idx_hvb_status ON home_visit_bookings(status);
      CREATE INDEX IF NOT EXISTS idx_hvb_date ON home_visit_bookings(scheduled_date);
      CREATE INDEX IF NOT EXISTS idx_hvb_ref ON home_visit_bookings(booking_reference);
    `);

    // 9. home_visit_status_history
    console.log('Creating table home_visit_status_history...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS home_visit_status_history (
        id UUID PRIMARY KEY,
        booking_id UUID NOT NULL REFERENCES home_visit_bookings(id) ON DELETE CASCADE,
        from_status VARCHAR(30),
        to_status VARCHAR(30) NOT NULL,
        changed_by_user_id UUID REFERENCES users(id),
        reason TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_hvsh_booking ON home_visit_status_history(booking_id);
    `);

    // 10. home_visit_service_records
    console.log('Creating table home_visit_service_records...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS home_visit_service_records (
        id UUID PRIMARY KEY,
        booking_id UUID NOT NULL REFERENCES home_visit_bookings(id) ON DELETE CASCADE,
        provider_id UUID NOT NULL REFERENCES healthcare_provider_profiles(id),
        started_at TIMESTAMPTZ NOT NULL,
        completed_at TIMESTAMPTZ NOT NULL,
        clinical_observations TEXT,
        vitals JSONB DEFAULT '{}'::jsonb,
        procedure_notes TEXT,
        checklist_completed JSONB DEFAULT '[]'::jsonb,
        follow_up_recommendation TEXT,
        specimen_identifiers JSONB DEFAULT '[]'::jsonb,
        prescription_id UUID,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_hvsr_booking ON home_visit_service_records(booking_id);
    `);

    // 11. provider_reviews
    console.log('Creating table provider_reviews...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS provider_reviews (
        id UUID PRIMARY KEY,
        booking_id UUID UNIQUE NOT NULL REFERENCES home_visit_bookings(id) ON DELETE CASCADE,
        provider_id UUID NOT NULL REFERENCES healthcare_provider_profiles(id),
        patient_id UUID NOT NULL REFERENCES patients(id),
        rating INT NOT NULL CHECK(rating >= 1 AND rating <= 5),
        punctuality_rating INT CHECK(punctuality_rating >= 1 AND punctuality_rating <= 5),
        review_text TEXT,
        is_verified_visit BOOLEAN DEFAULT true,
        is_moderated BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_pr_provider ON provider_reviews(provider_id);
    `);

    // 12. provider_complaints
    console.log('Creating table provider_complaints...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS provider_complaints (
        id UUID PRIMARY KEY,
        booking_id UUID REFERENCES home_visit_bookings(id),
        reporter_user_id UUID NOT NULL REFERENCES users(id),
        provider_id UUID NOT NULL REFERENCES healthcare_provider_profiles(id),
        complaint_type VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(30) DEFAULT 'OPEN',
        resolution_notes TEXT,
        resolved_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_pc_status ON provider_complaints(status);
    `);

    // 13. Seed Standard Healthcare Service Categories
    console.log('Seeding standard healthcare service categories...');
    const categories = [
      {
        id: '22222222-2222-2222-2222-222222220001',
        name: 'Doctor Home Visit',
        code: 'DOCTOR_VISIT',
        description: 'Comprehensive at-home physician consultation, physical exam, and clinical assessment for non-emergency conditions.',
        icon_name: 'Stethoscope',
        is_clinical_procedure: true,
        display_order: 1
      },
      {
        id: '22222222-2222-2222-2222-222222220002',
        name: 'Nursing Services',
        code: 'NURSING',
        description: 'Professional nursing care including sterile wound dressing, IV/injection therapy, catheter care, and post-op support.',
        icon_name: 'HeartPulse',
        is_clinical_procedure: true,
        display_order: 2
      },
      {
        id: '22222222-2222-2222-2222-222222220003',
        name: 'Physiotherapy & Rehab',
        code: 'PHYSIOTHERAPY',
        description: 'Customized mobility exercises, neuro/ortho rehab, stroke recovery, and ergonomic musculoskeletal pain management.',
        icon_name: 'Activity',
        is_clinical_procedure: true,
        display_order: 3
      },
      {
        id: '22222222-2222-2222-2222-222222220004',
        name: 'Elderly Care & Assistance',
        code: 'ELDERLY_CARE',
        description: 'Compassionate non-clinical elder assistance, mobility support, supervised feeding, and companion care.',
        icon_name: 'Users',
        is_clinical_procedure: false,
        display_order: 4
      },
      {
        id: '22222222-2222-2222-2222-222222220005',
        name: 'Diagnostic Sample Collection',
        code: 'SAMPLE_COLLECTION',
        description: 'Sterile home phlebotomy, blood/urine specimen collection with cold-chain transport to accredited partner laboratories.',
        icon_name: 'FlaskConical',
        is_clinical_procedure: true,
        display_order: 5
      },
      {
        id: '22222222-2222-2222-2222-222222220006',
        name: 'Post-operative Recovery',
        code: 'POST_OPERATIVE',
        description: 'Dedicated post-surgical recovery monitoring, suture removal, vital checks, and specialized nursing follow-up.',
        icon_name: 'ShieldCheck',
        is_clinical_procedure: true,
        display_order: 6
      }
    ];

    for (const c of categories) {
      await client.query(`
        INSERT INTO healthcare_service_categories (id, name, code, description, icon_name, is_clinical_procedure, display_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (code) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          icon_name = EXCLUDED.icon_name,
          is_clinical_procedure = EXCLUDED.is_clinical_procedure,
          display_order = EXCLUDED.display_order;
      `, [c.id, c.name, c.code, c.description, c.icon_name, c.is_clinical_procedure, c.display_order]);
    }

    // 14. Seed Standard Services
    console.log('Seeding standard catalog services...');
    const services = [
      // Doctor Home Visits
      {
        id: '33333333-3333-3333-3333-333333330001',
        category_id: '22222222-2222-2222-2222-222222220001',
        name: 'General Physician Home Consultation',
        code: 'DOC_GEN_CONSULT',
        description: 'Comprehensive physical examination, diagnosis, digital prescription, and personalized care plan at home.',
        default_duration_minutes: 45,
        base_price: 1200.00,
        required_qualification_type: 'MBBS',
        service_scope_notes: 'Non-emergency primary care consultation. Emergency escalation required for chest pain or breathing difficulty.'
      },
      {
        id: '33333333-3333-3333-3333-333333330002',
        category_id: '22222222-2222-2222-2222-222222220001',
        name: 'Geriatric Specialist Doctor Visit',
        code: 'DOC_GERIATRIC_VISIT',
        description: 'Comprehensive elderly medical review, multi-morbidity management, and medication reconciliation.',
        default_duration_minutes: 60,
        base_price: 1800.00,
        required_qualification_type: 'MD_MEDICINE',
        service_scope_notes: 'Specialist physician visit focusing on polypharmacy and chronic degenerative conditions.'
      },
      // Nursing
      {
        id: '33333333-3333-3333-3333-333333330003',
        category_id: '22222222-2222-2222-2222-222222220002',
        name: 'Sterile Wound Dressing & Suture Care',
        code: 'NURSE_WOUND_DRESSING',
        description: 'Hospital-grade antiseptic dressing for post-op surgical wounds, diabetic ulcers, and trauma lacerations.',
        default_duration_minutes: 30,
        base_price: 650.00,
        required_qualification_type: 'BSC_NURSING',
        service_scope_notes: 'Requires clinical prescription or discharge summary for specialized aseptic techniques.'
      },
      {
        id: '33333333-3333-3333-3333-333333330004',
        category_id: '22222222-2222-2222-2222-222222220002',
        name: 'Injection & IV Infusion Administration',
        code: 'NURSE_IV_INJECTION',
        description: 'Safe IV/IM injection administration, saline/antibiotic infusion with vital sign pre-checks.',
        default_duration_minutes: 45,
        base_price: 550.00,
        required_qualification_type: 'GNM_NURSING',
        service_scope_notes: 'Administered strictly upon valid registered doctor prescription with test dose verification.'
      },
      // Physiotherapy
      {
        id: '33333333-3333-3333-3333-333333330005',
        category_id: '22222222-2222-2222-2222-222222220003',
        name: 'Post-Op Orthopedic Rehabilitation',
        code: 'PHYSIO_ORTHO_REHAB',
        description: 'Joint replacement recovery, gait training, range-of-motion enhancement, and pain relief therapy.',
        default_duration_minutes: 60,
        base_price: 900.00,
        required_qualification_type: 'BPT',
        service_scope_notes: 'Includes customized progressive therapeutic exercise sheet.'
      },
      // Elderly Care
      {
        id: '33333333-3333-3333-3333-333333330006',
        category_id: '22222222-2222-2222-2222-222222220004',
        name: 'Attendant Care & Daily Living Support (4 Hours)',
        code: 'CARE_DAILY_4HR',
        description: 'Assisted ambulation, sponge bathing, feeding, medication reminders, and vital monitoring.',
        default_duration_minutes: 240,
        base_price: 1200.00,
        required_qualification_type: 'CERTIFIED_CAREGIVER',
        service_scope_notes: 'Non-clinical assistive caregiver support. Does not include invasive nursing procedures.'
      },
      // Sample Collection
      {
        id: '33333333-3333-3333-3333-333333330007',
        category_id: '22222222-2222-2222-2222-222222220005',
        name: 'Home Phlebotomy & Blood Sample Draw',
        code: 'LAB_SAMPLE_BLOOD',
        description: 'Sterile vacuum blood collection with barcode labeling and temperature-controlled specimen transfer.',
        default_duration_minutes: 20,
        base_price: 350.00,
        required_qualification_type: 'DMLT',
        service_scope_notes: 'Specimen handed over to NABL accredited diagnostic partner with digital chain-of-custody.'
      }
    ];

    for (const s of services) {
      await client.query(`
        INSERT INTO healthcare_services (id, category_id, name, code, description, default_duration_minutes, base_price, required_qualification_type, service_scope_notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (code) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          default_duration_minutes = EXCLUDED.default_duration_minutes,
          base_price = EXCLUDED.base_price,
          required_qualification_type = EXCLUDED.required_qualification_type,
          service_scope_notes = EXCLUDED.service_scope_notes;
      `, [s.id, s.category_id, s.name, s.code, s.description, s.default_duration_minutes, s.base_price, s.required_qualification_type, s.service_scope_notes]);
    }

    // 15. Seed Real Verified Healthcare Providers
    console.log('Seeding verified marketplace healthcare professionals...');
    const carePlusId = '99d4f519-dc8f-4f76-8dcf-0aefca9b0fdc';
    const pwdHash = bcrypt.hashSync('Password@123', 10);

    const testProviders = [
      {
        user_id: '44444444-4444-4444-4444-444444440001',
        profile_id: '55555555-5555-5555-5555-555555550001',
        full_name: 'Dr. Rajesh Sharma',
        email: 'doctor.home@careplus.in',
        phone: '+919876543301',
        provider_type: 'DOCTOR',
        qualification: 'MBBS, MD (Family Medicine)',
        specialty: 'General Medicine & Geriatrics',
        experience: 12,
        reg_num: 'KMC-54128-2012',
        reg_council: 'Karnataka Medical Council',
        service_id: '33333333-3333-3333-3333-333333330001',
        custom_price: 1200.00
      },
      {
        user_id: '44444444-4444-4444-4444-444444440002',
        profile_id: '55555555-5555-5555-5555-555555550002',
        full_name: 'Sister Mary Varghese',
        email: 'nurse.mary@careplus.in',
        phone: '+919876543302',
        provider_type: 'NURSE',
        qualification: 'B.Sc Nursing, Critical Care Cert',
        specialty: 'Clinical Wound Care & Infusion',
        experience: 8,
        reg_num: 'KNC-RN-88124',
        reg_council: 'Karnataka State Nursing Council',
        service_id: '33333333-3333-3333-3333-333333330003',
        custom_price: 650.00
      },
      {
        user_id: '44444444-4444-4444-4444-444444440003',
        profile_id: '55555555-5555-5555-5555-555555550003',
        full_name: 'Dr. Arun Kumar, BPT',
        email: 'physio.arun@careplus.in',
        phone: '+919876543303',
        provider_type: 'PHYSIOTHERAPIST',
        qualification: 'Bachelor of Physiotherapy (BPT), MIAP',
        specialty: 'Musculoskeletal & Orthopedic Rehab',
        experience: 6,
        reg_num: 'IAP-REG-39102',
        reg_council: 'Indian Association of Physiotherapists',
        service_id: '33333333-3333-3333-3333-333333330005',
        custom_price: 900.00
      },
      {
        user_id: '44444444-4444-4444-4444-444444440004',
        profile_id: '55555555-5555-5555-5555-555555550004',
        full_name: 'Suresh Nair',
        email: 'lab.suresh@careplus.in',
        phone: '+919876543304',
        provider_type: 'PHLEBOTOMIST',
        qualification: 'Diploma in Medical Laboratory Tech (DMLT)',
        specialty: 'Aseptic Home Phlebotomy',
        experience: 5,
        reg_num: 'PMB-KA-41029',
        reg_council: 'Para Medical Board Karnataka',
        service_id: '33333333-3333-3333-3333-333333330007',
        custom_price: 350.00
      }
    ];

    for (const p of testProviders) {
      // 1. Create or update user account
      await client.query(`
        INSERT INTO users (id, email, phone_number, full_name, password_hash, is_active, is_verified, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, true, true, NOW(), NOW())
        ON CONFLICT (email) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          phone_number = EXCLUDED.phone_number,
          password_hash = EXCLUDED.password_hash;
      `, [p.user_id, p.email, p.phone, p.full_name, pwdHash]);

      // 2. Create provider profile
      await client.query(`
        INSERT INTO healthcare_provider_profiles (
          id, user_id, provider_type, full_name, email, phone_number,
          qualification, specialty, experience_years, registration_number, registration_council,
          verification_status, verified_at, associated_clinic_id, is_independent, rating_avg, rating_count, is_active
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11,
          'APPROVED', NOW(), $12, false, 4.90, 18, true
        )
        ON CONFLICT (id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          qualification = EXCLUDED.qualification,
          specialty = EXCLUDED.specialty,
          verification_status = 'APPROVED';
      `, [p.profile_id, p.user_id, p.provider_type, p.full_name, p.email, p.phone, p.qualification, p.specialty, p.experience, p.reg_num, p.reg_council, carePlusId]);

      // 3. Link offering service
      await client.query(`
        INSERT INTO provider_services (id, provider_id, service_id, custom_price, is_offered)
        VALUES ($1, $2, $3, $4, true)
        ON CONFLICT (provider_id, service_id) DO UPDATE SET
          custom_price = EXCLUDED.custom_price,
          is_offered = true;
      `, [uuidv4(), p.profile_id, p.service_id, p.custom_price]);

      // 4. Set service area in Bengaluru
      await client.query(`
        INSERT INTO provider_service_areas (id, provider_id, city, locality, postal_code, service_radius_km, base_latitude, base_longitude)
        VALUES ($1, $2, 'Bengaluru', 'Indiranagar / Koramangala / Whitefield', '560038', 15.00, 12.9716, 77.5946)
        ON CONFLICT DO NOTHING;
      `, [uuidv4(), p.profile_id]);

      // 5. Set working schedule (Monday through Saturday, 09:00 - 18:00)
      for (let day = 1; day <= 6; day++) {
        await client.query(`
          INSERT INTO provider_availability (id, provider_id, day_of_week, start_time, end_time, max_daily_visits, buffer_minutes, is_active)
          VALUES ($1, $2, $3, '09:00', '18:00', 6, 30, true)
          ON CONFLICT (provider_id, day_of_week) DO NOTHING;
        `, [uuidv4(), p.profile_id, day]);
      }
    }

    await client.query('COMMIT');
    console.log('--- Phase 9 Migration Completed Successfully! ---');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Fatal Phase 9 Migration Error:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runPhase9Migration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runPhase9Migration };
