const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

async function runPhase8Migration() {
  console.log('--- Starting Phase 8 Migration: SaaS Subscription, Billing & Analytics ---');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. subscription_plans
    console.log('Creating table subscription_plans...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id UUID PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        monthly_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
        yearly_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
        trial_duration_days INT DEFAULT 14,
        currency VARCHAR(3) DEFAULT 'INR',
        max_branches INT NOT NULL DEFAULT 1,
        max_doctors INT NOT NULL DEFAULT 1,
        max_staff INT NOT NULL DEFAULT 2,
        max_monthly_appointments INT NOT NULL DEFAULT 100,
        storage_limit_mb INT NOT NULL DEFAULT 1000,
        feature_entitlements JSONB NOT NULL DEFAULT '{}'::jsonb,
        is_active BOOLEAN DEFAULT true,
        display_order INT DEFAULT 1,
        version INT DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_sub_plans_code ON subscription_plans(code);
      CREATE INDEX IF NOT EXISTS idx_sub_plans_active ON subscription_plans(is_active);
    `);

    // 2. clinic_subscriptions
    console.log('Creating table clinic_subscriptions...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS clinic_subscriptions (
        id UUID PRIMARY KEY,
        clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        plan_id UUID NOT NULL REFERENCES subscription_plans(id),
        status VARCHAR(30) NOT NULL DEFAULT 'TRIALING',
        billing_interval VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
        trial_start_at TIMESTAMPTZ,
        trial_end_at TIMESTAMPTZ,
        current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        current_period_end TIMESTAMPTZ NOT NULL,
        next_billing_at TIMESTAMPTZ,
        grace_period_ends_at TIMESTAMPTZ,
        cancelled_at TIMESTAMPTZ,
        cancel_at_period_end BOOLEAN DEFAULT false,
        gateway_subscription_id VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_clinic_subs_clinic ON clinic_subscriptions(clinic_id);
      CREATE INDEX IF NOT EXISTS idx_clinic_subs_status ON clinic_subscriptions(status);
    `);

    // 3. billing_profiles
    console.log('Creating table billing_profiles...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS billing_profiles (
        id UUID PRIMARY KEY,
        clinic_id UUID UNIQUE NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        legal_business_name VARCHAR(255) NOT NULL,
        gstin VARCHAR(20),
        pan VARCHAR(10),
        billing_address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        postal_code VARCHAR(20) NOT NULL,
        contact_email VARCHAR(255) NOT NULL,
        contact_phone VARCHAR(20) NOT NULL,
        place_of_supply VARCHAR(100) DEFAULT 'Karnataka (29)',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_billing_profiles_clinic ON billing_profiles(clinic_id);
    `);

    // 4. subscription_payments
    console.log('Creating table subscription_payments...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscription_payments (
        id UUID PRIMARY KEY,
        subscription_id UUID REFERENCES clinic_subscriptions(id) ON DELETE SET NULL,
        clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        amount NUMERIC(10,2) NOT NULL,
        tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
        total_amount NUMERIC(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'INR',
        payment_gateway VARCHAR(30) DEFAULT 'RAZORPAY',
        gateway_order_id VARCHAR(100),
        gateway_payment_id VARCHAR(100) UNIQUE,
        gateway_signature VARCHAR(255),
        payment_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
        idempotency_key VARCHAR(100) UNIQUE,
        paid_at TIMESTAMPTZ,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_sub_payments_clinic ON subscription_payments(clinic_id);
      CREATE INDEX IF NOT EXISTS idx_sub_payments_gateway_order ON subscription_payments(gateway_order_id);
      CREATE INDEX IF NOT EXISTS idx_sub_payments_status ON subscription_payments(payment_status);
    `);

    // 5. subscription_invoices
    console.log('Creating table subscription_invoices...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscription_invoices (
        id UUID PRIMARY KEY,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        subscription_id UUID REFERENCES clinic_subscriptions(id) ON DELETE SET NULL,
        payment_id UUID REFERENCES subscription_payments(id) ON DELETE SET NULL,
        clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        clinic_billing_name VARCHAR(255) NOT NULL,
        clinic_billing_address TEXT,
        clinic_gstin VARCHAR(20),
        platform_legal_name VARCHAR(255) NOT NULL DEFAULT 'Smart Clinic OS Technologies Pvt Ltd',
        platform_gstin VARCHAR(20) DEFAULT '29AABCS1429B1Z8',
        plan_name VARCHAR(100) NOT NULL,
        billing_period_start TIMESTAMPTZ NOT NULL,
        billing_period_end TIMESTAMPTZ NOT NULL,
        subtotal NUMERIC(10,2) NOT NULL,
        tax_rate NUMERIC(5,2) DEFAULT 18.00,
        tax_type VARCHAR(10) DEFAULT 'IGST',
        tax_amount NUMERIC(10,2) NOT NULL,
        total_amount NUMERIC(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'INR',
        status VARCHAR(20) DEFAULT 'PAID',
        pdf_file_path VARCHAR(255),
        finalized_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_sub_invoices_clinic ON subscription_invoices(clinic_id);
      CREATE INDEX IF NOT EXISTS idx_sub_invoices_num ON subscription_invoices(invoice_number);
    `);

    // 6. payment_webhook_events
    console.log('Creating table payment_webhook_events...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_webhook_events (
        id UUID PRIMARY KEY,
        gateway VARCHAR(30) DEFAULT 'RAZORPAY',
        event_id VARCHAR(100) UNIQUE NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        payload JSONB NOT NULL,
        status VARCHAR(20) DEFAULT 'PROCESSED',
        processed_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_webhook_events_id ON payment_webhook_events(event_id);
    `);

    // 7. subscription_audit_logs
    console.log('Creating table subscription_audit_logs...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscription_audit_logs (
        id UUID PRIMARY KEY,
        clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
        subscription_id UUID REFERENCES clinic_subscriptions(id) ON DELETE SET NULL,
        actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        from_status VARCHAR(50),
        to_status VARCHAR(50),
        reason TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_sub_audit_clinic ON subscription_audit_logs(clinic_id);
    `);

    // 8. Seed Default Subscription Plans
    console.log('Seeding configurable subscription plans...');
    const plans = [
      {
        id: '11111111-1111-1111-1111-111111110001',
        name: 'Free Trial',
        code: 'TRIAL',
        description: 'Full feature 14-day evaluation for modern clinics exploring automated queue and OPD management.',
        monthly_price: 0.00,
        yearly_price: 0.00,
        trial_duration_days: 14,
        max_branches: 1,
        max_doctors: 1,
        max_staff: 2,
        max_monthly_appointments: 100,
        storage_limit_mb: 1000,
        feature_entitlements: JSON.stringify({
          DIGITAL_PRESCRIPTIONS: true,
          HEALTH_RECORDS: true,
          ADVANCED_ANALYTICS: false,
          TRAFFIC_INTELLIGENCE: false,
          AUTOMATED_REMINDERS: true,
          PRIORITY_SUPPORT: false
        }),
        display_order: 1
      },
      {
        id: '11111111-1111-1111-1111-111111110002',
        name: 'Basic Clinic Plan',
        code: 'BASIC',
        description: 'Essential OPD and billing engine for single-doctor clinics and standalone general practices.',
        monthly_price: 1999.00,
        yearly_price: 19990.00,
        trial_duration_days: 14,
        max_branches: 1,
        max_doctors: 2,
        max_staff: 3,
        max_monthly_appointments: 300,
        storage_limit_mb: 5000,
        feature_entitlements: JSON.stringify({
          DIGITAL_PRESCRIPTIONS: true,
          HEALTH_RECORDS: true,
          ADVANCED_ANALYTICS: false,
          TRAFFIC_INTELLIGENCE: false,
          AUTOMATED_REMINDERS: true,
          PRIORITY_SUPPORT: false
        }),
        display_order: 2
      },
      {
        id: '11111111-1111-1111-1111-111111110003',
        name: 'Professional Clinic Suite',
        code: 'PRO',
        description: 'Multi-branch growth suite with Smart Queue Intelligence, Traffic Departure Engine & Advanced Analytics.',
        monthly_price: 4999.00,
        yearly_price: 49990.00,
        trial_duration_days: 14,
        max_branches: 3,
        max_doctors: 6,
        max_staff: 10,
        max_monthly_appointments: 1500,
        storage_limit_mb: 25000,
        feature_entitlements: JSON.stringify({
          DIGITAL_PRESCRIPTIONS: true,
          HEALTH_RECORDS: true,
          ADVANCED_ANALYTICS: true,
          TRAFFIC_INTELLIGENCE: true,
          AUTOMATED_REMINDERS: true,
          PRIORITY_SUPPORT: false
        }),
        display_order: 3
      },
      {
        id: '11111111-1111-1111-1111-111111110004',
        name: 'Enterprise Healthcare Network',
        code: 'ENTERPRISE',
        description: 'Unlimited capacity for multi-specialty polyclinic chains, customized reporting & 24/7 dedicated support.',
        monthly_price: 12999.00,
        yearly_price: 129990.00,
        trial_duration_days: 30,
        max_branches: 10,
        max_doctors: 25,
        max_staff: 50,
        max_monthly_appointments: -1, // Unlimited
        storage_limit_mb: 100000,
        feature_entitlements: JSON.stringify({
          DIGITAL_PRESCRIPTIONS: true,
          HEALTH_RECORDS: true,
          ADVANCED_ANALYTICS: true,
          TRAFFIC_INTELLIGENCE: true,
          AUTOMATED_REMINDERS: true,
          PRIORITY_SUPPORT: true
        }),
        display_order: 4
      }
    ];

    for (const p of plans) {
      await client.query(`
        INSERT INTO subscription_plans (
          id, name, code, description, monthly_price, yearly_price,
          trial_duration_days, currency, max_branches, max_doctors, max_staff,
          max_monthly_appointments, storage_limit_mb, feature_entitlements,
          is_active, display_order, version, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, 'INR', $8, $9, $10, $11, $12, $13, true, $14, 1, NOW()
        )
        ON CONFLICT (code) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          monthly_price = EXCLUDED.monthly_price,
          yearly_price = EXCLUDED.yearly_price,
          trial_duration_days = EXCLUDED.trial_duration_days,
          max_branches = EXCLUDED.max_branches,
          max_doctors = EXCLUDED.max_doctors,
          max_staff = EXCLUDED.max_staff,
          max_monthly_appointments = EXCLUDED.max_monthly_appointments,
          feature_entitlements = EXCLUDED.feature_entitlements,
          updated_at = NOW();
      `, [
        p.id, p.name, p.code, p.description, p.monthly_price, p.yearly_price,
        p.trial_duration_days, p.max_branches, p.max_doctors, p.max_staff,
        p.max_monthly_appointments, p.storage_limit_mb, p.feature_entitlements,
        p.display_order
      ]);
    }

    // 9. Link CarePlus to PRO subscription & Apex to BASIC subscription
    console.log('Initializing clinic subscriptions & billing profiles...');
    const clinicRows = await client.query('SELECT id, name, slug, email, phone, address, city, state, postal_code FROM clinics');

    for (const c of clinicRows.rows) {
      const isCarePlus = c.slug.includes('careplus');
      const planCode = isCarePlus ? 'PRO' : 'BASIC';
      const planRes = await client.query('SELECT * FROM subscription_plans WHERE code = $1', [planCode]);
      const plan = planRes.rows[0];

      // Billing Profile
      await client.query(`
        INSERT INTO billing_profiles (
          id, clinic_id, legal_business_name, gstin, pan, billing_address,
          city, state, postal_code, contact_email, contact_phone, place_of_supply,
          created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Karnataka (29)',
          NOW(), NOW()
        )
        ON CONFLICT (clinic_id) DO UPDATE SET
          legal_business_name = EXCLUDED.legal_business_name,
          updated_at = NOW();
      `, [
        c.id,
        c.name + ' LLP',
        isCarePlus ? '29AABCC4521G1ZQ' : '29AABCA9912H1ZP',
        isCarePlus ? 'AABCC4521G' : 'AABCA9912H',
        c.address || '100ft Road',
        c.city || 'Bengaluru',
        c.state || 'Karnataka',
        c.postal_code || '560038',
        c.email || 'billing@careplus.in',
        c.phone || '+919876543210'
      ]);

      // Clinic Subscription
      const subId = uuidv4();
      const periodStart = new Date();
      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + 30); // 30-day active period

      const subRes = await client.query(`
        INSERT INTO clinic_subscriptions (
          id, clinic_id, plan_id, status, billing_interval,
          current_period_start, current_period_end, next_billing_at,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, 'ACTIVE', 'MONTHLY',
          $4, $5, $5,
          NOW(), NOW()
        )
        RETURNING *;
      `, [subId, c.id, plan.id, periodStart, periodEnd]);

      const sub = subRes.rows[0];

      // Generate verified subscription payment and initial invoice
      const paymentId = uuidv4();
      const subtotal = parseFloat(plan.monthly_price);
      const taxAmount = +(subtotal * 0.18).toFixed(2);
      const totalAmount = +(subtotal + taxAmount).toFixed(2);
      const orderId = 'order_mock_' + Math.floor(100000 + Math.random() * 900000);
      const payId = 'pay_mock_' + Math.floor(10000000 + Math.random() * 90000000);

      await client.query(`
        INSERT INTO subscription_payments (
          id, subscription_id, clinic_id, amount, tax_amount, total_amount,
          currency, payment_gateway, gateway_order_id, gateway_payment_id,
          payment_status, idempotency_key, paid_at, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          'INR', 'RAZORPAY', $7, $8,
          'SUCCESS', $9, NOW(), NOW()
        );
      `, [
        paymentId, sub.id, c.id, subtotal, taxAmount, totalAmount,
        orderId, payId, 'init:' + sub.id
      ]);

      const invoiceNum = 'INV-' + new Date().getFullYear() + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + (isCarePlus ? '0001' : '0002');
      await client.query(`
        INSERT INTO subscription_invoices (
          id, invoice_number, subscription_id, payment_id, clinic_id,
          clinic_billing_name, clinic_billing_address, clinic_gstin,
          platform_legal_name, platform_gstin, plan_name,
          billing_period_start, billing_period_end,
          subtotal, tax_rate, tax_type, tax_amount, total_amount,
          status, finalized_at, created_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4,
          $5, $6, $7,
          'Smart Clinic OS Technologies Pvt Ltd', '29AABCS1429B1Z8', $8,
          $9, $10,
          $11, 18.00, 'IGST', $12, $13,
          'PAID', NOW(), NOW()
        );
      `, [
        invoiceNum, sub.id, paymentId, c.id,
        c.name + ' LLP', c.address + ', ' + c.city, isCarePlus ? '29AABCC4521G1ZQ' : '29AABCA9912H1ZP',
        plan.name, periodStart, periodEnd,
        subtotal, taxAmount, totalAmount
      ]);
    }

    await client.query('COMMIT');
    console.log('--- Phase 8 Migration completed successfully! ---');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runPhase8Migration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runPhase8Migration };
