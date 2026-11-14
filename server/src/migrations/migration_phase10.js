const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

async function runPhase10Migration() {
  console.log('=================================================================');
  console.log('  STARTING PHASE 10 MIGRATION: ADVANCED HEALTHCARE ECOSYSTEM     ');
  console.log('=================================================================');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 0. Alter existing tables if needed
    console.log('0. Altering appointments table for teleconsultation flag...');
    await client.query(`
      ALTER TABLE appointments 
      ADD COLUMN IF NOT EXISTS is_teleconsultation BOOLEAN DEFAULT false;
    `);

    // 1. ai_consultation_drafts
    console.log('1. Creating table ai_consultation_drafts...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_consultation_drafts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
        doctor_id UUID REFERENCES doctor_profiles(id) ON DELETE CASCADE,
        patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
        raw_input_notes TEXT,
        structured_soap JSONB NOT NULL DEFAULT '{}',
        missing_fields JSONB DEFAULT '[]',
        differential_diagnoses JSONB DEFAULT '[]',
        status VARCHAR(50) DEFAULT 'DRAFT',
        is_ai_generated BOOLEAN DEFAULT true,
        approved_at TIMESTAMPTZ,
        approved_by_user_id UUID REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_ai_draft_appt ON ai_consultation_drafts(appointment_id);
      CREATE INDEX IF NOT EXISTS idx_ai_draft_doc ON ai_consultation_drafts(doctor_id);
      CREATE INDEX IF NOT EXISTS idx_ai_draft_status ON ai_consultation_drafts(status);
    `);

    // 2. ai_lab_report_extractions
    console.log('2. Creating table ai_lab_report_extractions...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_lab_report_extractions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
        clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
        document_url TEXT,
        file_name VARCHAR(255),
        source_lab VARCHAR(100),
        report_date DATE DEFAULT CURRENT_DATE,
        raw_ocr_text TEXT,
        extracted_data JSONB NOT NULL DEFAULT '[]',
        overall_confidence NUMERIC(5,2) DEFAULT 95.00,
        status VARCHAR(50) DEFAULT 'PENDING_REVIEW',
        verified_by_user_id UUID REFERENCES users(id),
        verified_at TIMESTAMPTZ,
        doctor_notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_lab_ext_patient ON ai_lab_report_extractions(patient_id);
      CREATE INDEX IF NOT EXISTS idx_lab_ext_clinic ON ai_lab_report_extractions(clinic_id);
      CREATE INDEX IF NOT EXISTS idx_lab_ext_status ON ai_lab_report_extractions(status);
    `);

    // 3. teleconsultation_rooms
    console.log('3. Creating table teleconsultation_rooms...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS teleconsultation_rooms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        appointment_id UUID UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
        clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
        doctor_id UUID REFERENCES doctor_profiles(id) ON DELETE CASCADE,
        patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
        room_code VARCHAR(100) UNIQUE NOT NULL,
        room_url TEXT,
        doctor_token TEXT,
        patient_token TEXT,
        token_expires_at TIMESTAMPTZ NOT NULL,
        status VARCHAR(50) DEFAULT 'SCHEDULED',
        patient_joined_at TIMESTAMPTZ,
        doctor_joined_at TIMESTAMPTZ,
        started_at TIMESTAMPTZ,
        ended_at TIMESTAMPTZ,
        duration_seconds INT DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_tele_appt ON teleconsultation_rooms(appointment_id);
      CREATE INDEX IF NOT EXISTS idx_tele_room_code ON teleconsultation_rooms(room_code);
      CREATE INDEX IF NOT EXISTS idx_tele_status ON teleconsultation_rooms(status);
    `);

    // 4. abdm_integrations
    console.log('4. Creating table abdm_integrations...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS abdm_integrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        clinic_id UUID UNIQUE REFERENCES clinics(id) ON DELETE CASCADE,
        hip_id VARCHAR(100) NOT NULL,
        hiu_id VARCHAR(100) NOT NULL,
        client_id VARCHAR(200),
        client_secret VARCHAR(200),
        sandbox_mode BOOLEAN DEFAULT true,
        is_enabled BOOLEAN DEFAULT true,
        status VARCHAR(50) DEFAULT 'ACTIVE',
        public_key TEXT,
        last_sync_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_abdm_clinic ON abdm_integrations(clinic_id);
      CREATE INDEX IF NOT EXISTS idx_abdm_hip ON abdm_integrations(hip_id);
    `);

    // 5. abdm_consents
    console.log('5. Creating table abdm_consents...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS abdm_consents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
        clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
        consent_artefact_id VARCHAR(150) UNIQUE NOT NULL,
        purpose VARCHAR(100) NOT NULL DEFAULT 'CAREMGT',
        abha_address VARCHAR(150) NOT NULL,
        hi_types JSONB DEFAULT '["Prescription", "DiagnosticReport", "OPConsultation"]',
        date_from TIMESTAMPTZ NOT NULL,
        date_to TIMESTAMPTZ NOT NULL,
        expiry_date TIMESTAMPTZ NOT NULL,
        status VARCHAR(50) DEFAULT 'GRANTED',
        revoked_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_abdm_cons_patient ON abdm_consents(patient_id);
      CREATE INDEX IF NOT EXISTS idx_abdm_cons_artefact ON abdm_consents(consent_artefact_id);
      CREATE INDEX IF NOT EXISTS idx_abdm_cons_status ON abdm_consents(status);
    `);

    // 6. diagnostic_laboratories
    console.log('6. Creating table diagnostic_laboratories...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS diagnostic_laboratories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(150) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        integration_type VARCHAR(50) DEFAULT 'WEBHOOK',
        api_endpoint TEXT,
        webhook_secret VARCHAR(255),
        catalog JSONB DEFAULT '[]',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_diag_lab_code ON diagnostic_laboratories(code);
    `);

    // 7. diagnostic_lab_orders
    console.log('7. Creating table diagnostic_lab_orders...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS diagnostic_lab_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_reference VARCHAR(100) UNIQUE NOT NULL,
        clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
        patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
        doctor_id UUID REFERENCES doctor_profiles(id) ON DELETE CASCADE,
        laboratory_id UUID REFERENCES diagnostic_laboratories(id) ON DELETE CASCADE,
        appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
        test_codes JSONB NOT NULL DEFAULT '[]',
        sample_collection_type VARCHAR(50) DEFAULT 'CLINIC_WALKIN',
        sample_barcode VARCHAR(100),
        status VARCHAR(50) DEFAULT 'ORDER_PLACED',
        report_url TEXT,
        report_received_at TIMESTAMPTZ,
        external_order_id VARCHAR(100),
        webhook_events JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_lab_order_ref ON diagnostic_lab_orders(order_reference);
      CREATE INDEX IF NOT EXISTS idx_lab_order_patient ON diagnostic_lab_orders(patient_id);
      CREATE INDEX IF NOT EXISTS idx_lab_order_clinic ON diagnostic_lab_orders(clinic_id);
      CREATE INDEX IF NOT EXISTS idx_lab_order_status ON diagnostic_lab_orders(status);
    `);

    // 8. pharmacy_partners
    console.log('8. Creating table pharmacy_partners...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS pharmacy_partners (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(150) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        api_endpoint TEXT,
        webhook_secret VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        catalog_available BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_pharm_code ON pharmacy_partners(code);
    `);

    // 9. pharmacy_orders
    console.log('9. Creating table pharmacy_orders...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS pharmacy_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_reference VARCHAR(100) UNIQUE NOT NULL,
        prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
        pharmacy_id UUID REFERENCES pharmacy_partners(id) ON DELETE CASCADE,
        patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
        clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
        doctor_id UUID REFERENCES doctor_profiles(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'TRANSMITTED',
        delivery_type VARCHAR(50) DEFAULT 'HOME_DELIVERY',
        delivery_address JSONB,
        items JSONB NOT NULL DEFAULT '[]',
        total_amount NUMERIC(10,2) DEFAULT 0.00,
        external_order_id VARCHAR(100),
        tracking_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_pharm_order_ref ON pharmacy_orders(order_reference);
      CREATE INDEX IF NOT EXISTS idx_pharm_order_rx ON pharmacy_orders(prescription_id);
      CREATE INDEX IF NOT EXISTS idx_pharm_order_patient ON pharmacy_orders(patient_id);
      CREATE INDEX IF NOT EXISTS idx_pharm_order_status ON pharmacy_orders(status);
    `);

    // 10. medical_record_shares
    console.log('10. Creating table medical_record_shares...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS medical_record_shares (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
        share_token VARCHAR(120) UNIQUE NOT NULL,
        recipient_name VARCHAR(150),
        recipient_email_or_phone VARCHAR(150),
        shared_records JSONB NOT NULL DEFAULT '["PRESCRIPTION", "LAB_REPORT", "CLINICAL_NOTE"]',
        expires_at TIMESTAMPTZ NOT NULL,
        status VARCHAR(50) DEFAULT 'ACTIVE',
        access_count INT DEFAULT 0,
        revoked_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_share_token ON medical_record_shares(share_token);
      CREATE INDEX IF NOT EXISTS idx_share_patient ON medical_record_shares(patient_id);
      CREATE INDEX IF NOT EXISTS idx_share_status ON medical_record_shares(status);
    `);

    // 11. record_access_logs
    console.log('11. Creating table record_access_logs...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS record_access_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        share_id UUID REFERENCES medical_record_shares(id) ON DELETE CASCADE,
        ip_address VARCHAR(100),
        user_agent TEXT,
        record_types_accessed JSONB DEFAULT '[]',
        accessed_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_access_share ON record_access_logs(share_id);
      CREATE INDEX IF NOT EXISTS idx_access_time ON record_access_logs(accessed_at);
    `);

    // 12. platform_integrations
    console.log('12. Creating table platform_integrations...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS platform_integrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(50) UNIQUE NOT NULL,
        category VARCHAR(50) NOT NULL,
        description TEXT,
        is_enabled BOOLEAN DEFAULT true,
        status VARCHAR(50) DEFAULT 'HEALTHY',
        sync_interval_minutes INT DEFAULT 60,
        last_sync_at TIMESTAMPTZ DEFAULT NOW(),
        failed_sync_count INT DEFAULT 0,
        config_metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_plat_slug ON platform_integrations(slug);
      CREATE INDEX IF NOT EXISTS idx_plat_cat ON platform_integrations(category);
    `);

    // -------------------------------------------------------------
    // SEED DATA FOR PHASE 10
    // -------------------------------------------------------------
    console.log('\n--- Seeding Diagnostic Laboratories ---');
    const labMetropolis = {
      name: 'Metropolis Healthcare Labs',
      code: 'METROPOLIS',
      integration_type: 'WEBHOOK',
      api_endpoint: 'https://api.sandbox.metropolisindia.com/v2/orders',
      webhook_secret: 'whsec_metro_prod_9898231',
      catalog: JSON.stringify([
        { code: 'CBC', name: 'Complete Blood Count', category: 'Hematology', tat_hours: 12, price: 450.00 },
        { code: 'LIPID_PANEL', name: 'Lipid Profile Standard', category: 'Biochemistry', tat_hours: 24, price: 850.00 },
        { code: 'LFT', name: 'Liver Function Test', category: 'Biochemistry', tat_hours: 18, price: 900.00 },
        { code: 'KFT', name: 'Kidney Function Test', category: 'Biochemistry', tat_hours: 18, price: 850.00 },
        { code: 'HBA1C', name: 'Glycated Hemoglobin HbA1c', category: 'Diabetes', tat_hours: 8, price: 550.00 },
        { code: 'THYROID_TSH', name: 'Thyroid Stimulating Hormone (TSH)', category: 'Endocrinology', tat_hours: 12, price: 400.00 }
      ])
    };

    const labLal = {
      name: 'Dr. Lal PathLabs Interconnect',
      code: 'LALPATH',
      integration_type: 'API',
      api_endpoint: 'https://sandbox.lalpathlabs.com/enterprise/b2b/v1',
      webhook_secret: 'whsec_lalpath_b2b_55612',
      catalog: JSON.stringify([
        { code: 'CBC', name: 'Complete Hemogram with Platelets', category: 'Hematology', tat_hours: 10, price: 420.00 },
        { code: 'VIT_D', name: 'Vitamin D 25-Hydroxy', category: 'Vitamins', tat_hours: 24, price: 1200.00 },
        { code: 'VIT_B12', name: 'Vitamin B12 Cyanocobalamin', category: 'Vitamins', tat_hours: 24, price: 950.00 },
        { code: 'CRP', name: 'C-Reactive Protein Quantitative', category: 'Inflammation', tat_hours: 12, price: 500.00 }
      ])
    };

    await client.query(`
      INSERT INTO diagnostic_laboratories (name, code, integration_type, api_endpoint, webhook_secret, catalog)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        integration_type = EXCLUDED.integration_type,
        api_endpoint = EXCLUDED.api_endpoint,
        webhook_secret = EXCLUDED.webhook_secret,
        catalog = EXCLUDED.catalog;
    `, [labMetropolis.name, labMetropolis.code, labMetropolis.integration_type, labMetropolis.api_endpoint, labMetropolis.webhook_secret, labMetropolis.catalog]);

    await client.query(`
      INSERT INTO diagnostic_laboratories (name, code, integration_type, api_endpoint, webhook_secret, catalog)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        integration_type = EXCLUDED.integration_type,
        api_endpoint = EXCLUDED.api_endpoint,
        webhook_secret = EXCLUDED.webhook_secret,
        catalog = EXCLUDED.catalog;
    `, [labLal.name, labLal.code, labLal.integration_type, labLal.api_endpoint, labLal.webhook_secret, labLal.catalog]);

    console.log('\n--- Seeding Pharmacy Partners ---');
    const pharmApollo = {
      name: 'Apollo Pharmacy Digital Network',
      code: 'APOLLO_PHARMACY',
      api_endpoint: 'https://api.sandbox.apollopharmacy.in/b2b/rx-orders',
      webhook_secret: 'whsec_apollo_rx_12893'
    };

    const pharmMedPlus = {
      name: 'MedPlus Mart Healthcare Delivery',
      code: 'MEDPLUS',
      api_endpoint: 'https://sandbox.medplusmart.com/api/v3/partner/orders',
      webhook_secret: 'whsec_medplus_rx_77812'
    };

    await client.query(`
      INSERT INTO pharmacy_partners (name, code, api_endpoint, webhook_secret)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        api_endpoint = EXCLUDED.api_endpoint,
        webhook_secret = EXCLUDED.webhook_secret;
    `, [pharmApollo.name, pharmApollo.code, pharmApollo.api_endpoint, pharmApollo.webhook_secret]);

    await client.query(`
      INSERT INTO pharmacy_partners (name, code, api_endpoint, webhook_secret)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        api_endpoint = EXCLUDED.api_endpoint,
        webhook_secret = EXCLUDED.webhook_secret;
    `, [pharmMedPlus.name, pharmMedPlus.code, pharmMedPlus.api_endpoint, pharmMedPlus.webhook_secret]);

    console.log('\n--- Seeding Platform Integrations Directory ---');
    const integrations = [
      {
        name: 'Ayushman Bharat Digital Mission (ABDM)',
        slug: 'abdm',
        category: 'ABDM',
        description: 'National digital health ecosystem bridge: ABHA ID creation, consent management & FHIR R4 milestone sync.',
        status: 'HEALTHY',
        config_metadata: { gateway: 'https://dev.abdm.gov.in/gateway', environment: 'SANDBOX', fhir_version: '4.0.1' }
      },
      {
        name: 'Metropolis Healthcare Lab Network',
        slug: 'metropolis_lab',
        category: 'DIAGNOSTIC_LAB',
        description: 'Diagnostic test dispatch, sample barcoding & automated real-time PDF lab report webhook sync.',
        status: 'HEALTHY',
        config_metadata: { provider: 'Metropolis', auto_verification_support: true }
      },
      {
        name: 'Dr. Lal PathLabs Interconnect',
        slug: 'lalpath_lab',
        category: 'DIAGNOSTIC_LAB',
        description: 'B2B API integration for specialized pathology panels and electronic report fulfillment.',
        status: 'HEALTHY',
        config_metadata: { provider: 'Dr Lal PathLabs', b2b_channel: 'DIRECT_REST' }
      },
      {
        name: 'Apollo Pharmacy Digital Dispatch',
        slug: 'apollo_pharmacy',
        category: 'PHARMACY',
        description: 'Automated prescription parsing, item fulfillment & door-step medication delivery routing.',
        status: 'HEALTHY',
        config_metadata: { delivery_sla_hours: 4, e_prescription_valid: true }
      },
      {
        name: 'MedPlus Mart Express Fulfillment',
        slug: 'medplus_pharmacy',
        category: 'PHARMACY',
        description: 'Clinic-to-pharmacy fast order dispatch and patient pickup point coordination.',
        status: 'HEALTHY',
        config_metadata: { discount_pass_through: '10%', store_network: 'PAN_INDIA' }
      },
      {
        name: 'WebRTC Teleconsultation Media Bridge',
        slug: 'webrtc_teleconsult',
        category: 'TELECONSULTATION',
        description: 'Encrypted end-to-end video consultation rooms, waiting queue routing & virtual doctor call rooms.',
        status: 'HEALTHY',
        config_metadata: { stun_turn_servers: ['stun:stun.l.google.com:19302'], token_ttl_minutes: 60 }
      },
      {
        name: 'Clinical AI Documentation & Lab Extraction',
        slug: 'ai_assistant',
        category: 'AI_SERVICE',
        description: 'Ambient doctor-patient transcript SOAP structuring, missing vitals warning & lab OCR breakdown.',
        status: 'HEALTHY',
        config_metadata: { model: 'smartclinic-clinical-v1', safety_guards_active: true, emergency_triage_enabled: true }
      }
    ];

    for (const integ of integrations) {
      await client.query(`
        INSERT INTO platform_integrations (name, slug, category, description, status, config_metadata)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          category = EXCLUDED.category,
          description = EXCLUDED.description,
          status = EXCLUDED.status,
          config_metadata = EXCLUDED.config_metadata;
      `, [integ.name, integ.slug, integ.category, integ.description, integ.status, JSON.stringify(integ.config_metadata)]);
    }

    // Connect first clinic to ABDM integration sandbox if available
    const clinicRes = await client.query('SELECT id, name FROM clinics LIMIT 1');
    if (clinicRes.rows.length > 0) {
      const clinic = clinicRes.rows[0];
      const hipId = 'IN_KA_BLR_' + clinic.id.slice(0, 8).toUpperCase();
      const hiuId = 'HIU_KA_' + clinic.id.slice(0, 8).toUpperCase();

      await client.query(`
        INSERT INTO abdm_integrations (clinic_id, hip_id, hiu_id, sandbox_mode, is_enabled, status)
        VALUES ($1, $2, $3, true, true, 'ACTIVE')
        ON CONFLICT (clinic_id) DO UPDATE SET
          hip_id = EXCLUDED.hip_id,
          hiu_id = EXCLUDED.hiu_id,
          is_enabled = true;
      `, [clinic.id, hipId, hiuId]);
      console.log(`Connected clinic "${clinic.name}" (${clinic.id}) to ABDM Sandbox HIP: ${hipId}`);
    }

    await client.query('COMMIT');
    console.log('--- PHASE 10 MIGRATION COMPLETED SUCCESSFULLY ---');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Phase 10 Migration Failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runPhase10Migration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runPhase10Migration };

