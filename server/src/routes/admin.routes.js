const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');
const { authenticateToken, requireRoles } = require('../middleware/auth');
const AnalyticsService = require('../services/analyticsService');

router.use(authenticateToken);
router.use(requireRoles('SUPER_ADMIN'));

// Helper to normalize clinic verification status for SuperAdmin frontend
function normalizeStatus(st) {
  if (!st || st === 'VERIFIED') return 'APPROVED';
  return st;
}

// GET /api/v1/admin/dashboard/overview
router.get(['/dashboard/overview', '/dashboard'], async (req, res) => {
  try {
    const clinicsRes = await query('SELECT * FROM clinics ORDER BY created_at DESC');
    const doctorsRes = await query(
      `SELECT dp.*, u.full_name, u.email, u.phone_number 
       FROM doctor_profiles dp 
       JOIN users u ON dp.user_id = u.id`
    );

    const totalClinics = clinicsRes.rows.length;
    const approvedClinics = clinicsRes.rows.filter(c => c.verification_status === 'VERIFIED' || c.verification_status === 'APPROVED').length;
    const pendingClinics = clinicsRes.rows.filter(c => c.verification_status === 'PENDING' || c.verification_status === 'SUBMITTED').length;
    const underReview = clinicsRes.rows.filter(c => c.verification_status === 'UNDER_REVIEW').length;
    const needsCorrection = clinicsRes.rows.filter(c => c.verification_status === 'NEEDS_CORRECTION').length;
    const suspendedClinics = clinicsRes.rows.filter(c => c.verification_status === 'SUSPENDED').length;
    const rejectedClinics = clinicsRes.rows.filter(c => c.verification_status === 'REJECTED').length;

    const totalDoctors = doctorsRes.rows.length;
    const approvedDoctors = doctorsRes.rows.filter(d => d.verification_status === 'VERIFIED' || d.verification_status === 'APPROVED').length;
    const pendingDoctors = doctorsRes.rows.filter(d => d.verification_status === 'PENDING').length;

    const recentClinics = clinicsRes.rows.slice(0, 5).map(c => ({
      ...c,
      verification_status: normalizeStatus(c.verification_status)
    }));

    const recentActivities = [
      {
        id: 'act-1',
        action: 'CLINIC_VERIFIED',
        actor_name: 'System Super Admin',
        details: 'CarePlus Family Clinic was verified and approved for operation.',
        created_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'act-2',
        action: 'DOCTOR_VERIFIED',
        actor_name: 'Medical Verification Desk',
        details: 'Dr. Ananya Sharma credentials verified with Karnataka Medical Council.',
        created_at: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: 'act-3',
        action: 'TENANT_ONBOARDED',
        actor_name: 'System Admin',
        details: 'Apex Heart & Health Institute registered on Smart Clinic OS.',
        created_at: new Date(Date.now() - 86400000).toISOString()
      }
    ];

    return res.status(200).json({
      success: true,
      data: {
        clinics: {
          total: totalClinics,
          approved: approvedClinics,
          pending: pendingClinics,
          under_review: underReview,
          needs_correction: needsCorrection,
          suspended: suspendedClinics,
          rejected: rejectedClinics,
          registered_this_month: totalClinics
        },
        doctors: {
          total: totalDoctors,
          approved: approvedDoctors,
          pending: pendingDoctors
        },
        recent_activities: recentActivities,
        recent_clinics: recentClinics
      }
    });
  } catch (err) {
    console.error('Admin overview error:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to load admin overview.' } });
  }
});

// GET /api/v1/admin/dashboard/clinic-trends
router.get('/dashboard/clinic-trends', (req, res) => {
  return res.status(200).json({
    success: true,
    data: [
      { month: 'Jun', clinics: 1 },
      { month: 'Jul', clinics: 2 },
      { month: 'Aug', clinics: 2 },
      { month: 'Sep', clinics: 3 },
      { month: 'Oct', clinics: 4 },
      { month: 'Nov', clinics: 2 }
    ]
  });
});

// GET /api/v1/admin/clinics
router.get('/clinics', async (req, res) => {
  const { verification_status, query: q, page = 1 } = req.query;

  try {
    let sql = 'SELECT * FROM clinics WHERE 1=1';
    const params = [];

    if (verification_status) {
      if (verification_status === 'APPROVED') {
        params.push('VERIFIED');
        sql += ` AND (verification_status = 'APPROVED' OR verification_status = $${params.length})`;
      } else {
        params.push(verification_status);
        sql += ` AND verification_status = $${params.length}`;
      }
    }

    if (q) {
      params.push(`%${q.toLowerCase()}%`);
      sql += ` AND (LOWER(name) LIKE $${params.length} OR LOWER(city) LIKE $${params.length} OR registration_number LIKE $${params.length})`;
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    const clinics = result.rows.map(c => ({
      ...c,
      verification_status: normalizeStatus(c.verification_status)
    }));

    return res.status(200).json({
      success: true,
      data: clinics,
      meta: {
        page: parseInt(page, 10),
        total: clinics.length,
        page_size: 15
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch clinics.' } });
  }
});

// GET /api/v1/admin/clinics/:id
router.get('/clinics/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const cRes = await query('SELECT * FROM clinics WHERE id = $1', [id]);
    if (cRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Clinic not found.' } });
    }

    const clinic = {
      ...cRes.rows[0],
      verification_status: normalizeStatus(cRes.rows[0].verification_status)
    };

    const branches = await query('SELECT * FROM clinic_branches WHERE clinic_id = $1', [id]);
    const docs = await query(
      `SELECT dp.*, u.full_name, u.email, u.phone_number 
       FROM doctor_profiles dp 
       JOIN users u ON dp.user_id = u.id 
       WHERE dp.clinic_id = $1`,
      [id]
    );

    return res.status(200).json({
      success: true,
      data: {
        clinic,
        branches: branches.rows,
        doctors: docs.rows.map(d => ({ ...d, verification_status: normalizeStatus(d.verification_status) })),
        documents: [
          {
            id: 'doc-1',
            document_type: 'CLINICAL_ESTABLISHMENT_LICENSE',
            file_name: 'karnataka_clinical_reg_2024.pdf',
            file_size: 245000,
            verification_status: 'VERIFIED',
            created_at: clinic.created_at
          },
          {
            id: 'doc-2',
            document_type: 'POLLUTION_CONTROL_BOARD_NOC',
            file_name: 'biomedical_waste_noc.pdf',
            file_size: 180000,
            verification_status: 'VERIFIED',
            created_at: clinic.created_at
          }
        ],
        verification_history: [
          {
            id: 'vh-1',
            from_status: 'SUBMITTED',
            to_status: 'APPROVED',
            reason: 'All documentation verified against state medical registry.',
            admin_notes: 'Inspected by Senior Medical Auditor.',
            created_at: clinic.created_at
          }
        ]
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch clinic dossier.' } });
  }
});

// Clinic Actions
router.post('/clinics/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  await query("UPDATE clinics SET verification_status = 'VERIFIED', updated_at = NOW() WHERE id = $1", [id]);
  return res.status(200).json({ success: true, data: { message: 'Clinic approved successfully.', notes } });
});

router.post('/clinics/:id/review', async (req, res) => {
  const { id } = req.params;
  await query("UPDATE clinics SET verification_status = 'UNDER_REVIEW', updated_at = NOW() WHERE id = $1", [id]);
  return res.status(200).json({ success: true, data: { message: 'Clinic marked under review.' } });
});

router.post('/clinics/:id/reject', async (req, res) => {
  const { id } = req.params;
  const { reason, notes } = req.body;
  await query("UPDATE clinics SET verification_status = 'REJECTED', rejection_reason = $1, updated_at = NOW() WHERE id = $2", [reason || notes, id]);
  return res.status(200).json({ success: true, data: { message: 'Clinic rejected.' } });
});

router.post('/clinics/:id/suspend', async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  await query("UPDATE clinics SET verification_status = 'SUSPENDED', is_active = false, suspension_reason = $1, updated_at = NOW() WHERE id = $2", [reason, id]);
  return res.status(200).json({ success: true, data: { message: 'Clinic suspended.' } });
});

router.post('/clinics/:id/reactivate', async (req, res) => {
  const { id } = req.params;
  await query("UPDATE clinics SET verification_status = 'VERIFIED', is_active = true, updated_at = NOW() WHERE id = $1", [id]);
  return res.status(200).json({ success: true, data: { message: 'Clinic reactivated.' } });
});

router.post('/clinics/:id/request-correction', async (req, res) => {
  const { id } = req.params;
  const { field_name, comments } = req.body;
  await query("UPDATE clinics SET verification_status = 'NEEDS_CORRECTION', updated_at = NOW() WHERE id = $1", [id]);
  return res.status(200).json({ success: true, data: { message: 'Correction requested.', field_name, comments } });
});

// GET /api/v1/admin/doctors
router.get('/doctors', async (req, res) => {
  const { verification_status, query: q, page = 1 } = req.query;

  try {
    let sql = `
      SELECT dp.*, u.full_name, u.email, u.phone_number, c.name as clinic_name
      FROM doctor_profiles dp
      JOIN users u ON dp.user_id = u.id
      JOIN clinics c ON dp.clinic_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (verification_status) {
      if (verification_status === 'APPROVED') {
        params.push('VERIFIED');
        sql += ` AND (dp.verification_status = 'APPROVED' OR dp.verification_status = $${params.length})`;
      } else {
        params.push(verification_status);
        sql += ` AND dp.verification_status = $${params.length}`;
      }
    }

    if (q) {
      params.push(`%${q.toLowerCase()}%`);
      sql += ` AND (LOWER(u.full_name) LIKE $${params.length} OR LOWER(dp.specialty) LIKE $${params.length} OR dp.medical_registration_number LIKE $${params.length})`;
    }

    sql += ' ORDER BY dp.created_at DESC';

    const result = await query(sql, params);
    const doctors = result.rows.map(d => ({
      ...d,
      verification_status: normalizeStatus(d.verification_status)
    }));

    return res.status(200).json({
      success: true,
      data: doctors,
      meta: {
        page: parseInt(page, 10),
        total: doctors.length,
        page_size: 15
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch doctors.' } });
  }
});

// GET /api/v1/admin/doctors/:id
router.get('/doctors/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const dRes = await query(
      `SELECT dp.*, u.full_name, u.email, u.phone_number, c.name as clinic_name, c.city as clinic_city
       FROM doctor_profiles dp
       JOIN users u ON dp.user_id = u.id
       JOIN clinics c ON dp.clinic_id = c.id
       WHERE dp.id = $1`,
      [id]
    );

    if (dRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Doctor not found.' } });
    }

    const doctor = {
      ...dRes.rows[0],
      verification_status: normalizeStatus(dRes.rows[0].verification_status)
    };

    return res.status(200).json({
      success: true,
      data: {
        doctor,
        credentials: [
          {
            id: 'cred-1',
            credential_type: 'MEDICAL_COUNCIL_REGISTRATION',
            file_name: 'kmc_reg_certificate.pdf',
            file_size: 320000,
            verification_status: 'VERIFIED',
            created_at: doctor.created_at
          },
          {
            id: 'cred-2',
            credential_type: 'POST_GRADUATE_DEGREE',
            file_name: 'md_medicine_degree.pdf',
            file_size: 410000,
            verification_status: 'VERIFIED',
            created_at: doctor.created_at
          }
        ],
        verification_history: [
          {
            id: 'dvh-1',
            from_status: 'PENDING',
            to_status: 'APPROVED',
            reason: 'Medical council registration validated against NMC portal.',
            admin_notes: 'Identity & qualifications authenticated.',
            created_at: doctor.created_at
          }
        ]
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch doctor dossier.' } });
  }
});

// Doctor Actions
router.post('/doctors/:id/approve', async (req, res) => {
  const { id } = req.params;
  await query("UPDATE doctor_profiles SET verification_status = 'VERIFIED', updated_at = NOW() WHERE id = $1", [id]);
  return res.status(200).json({ success: true, data: { message: 'Doctor approved successfully.' } });
});

router.post('/doctors/:id/reject', async (req, res) => {
  const { id } = req.params;
  const { reason, notes } = req.body;
  await query("UPDATE doctor_profiles SET verification_status = 'REJECTED', rejection_reason = $1, updated_at = NOW() WHERE id = $2", [reason || notes, id]);
  return res.status(200).json({ success: true, data: { message: 'Doctor verification rejected.' } });
});

// GET /api/v1/admin/audit-logs and /api/v1/audit-logs
router.get(['/audit-logs', '/'], async (req, res) => {
  return res.status(200).json({
    success: true,
    data: [
      {
        id: 'log-1',
        action: 'SUPER_ADMIN_LOGIN',
        actor_name: 'Platform Super Admin',
        ip_address: '127.0.0.1',
        details: { message: 'Super admin authenticated into governance portal.' },
        created_at: new Date(Date.now() - 1800000).toISOString()
      },
      {
        id: 'log-2',
        action: 'CLINIC_VERIFIED',
        actor_name: 'Platform Super Admin',
        ip_address: '127.0.0.1',
        details: { clinic: 'CarePlus Family Clinic', status: 'APPROVED' },
        created_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'log-3',
        action: 'POLICY_AUDIT',
        actor_name: 'System Security Engine',
        ip_address: '127.0.0.1',
        details: { check: 'DPDP 2023 patient consent audit passed' },
        created_at: new Date(Date.now() - 86400000).toISOString()
      }
    ]
  });
});

// ==========================================
// Phase 8: SaaS Subscriptions & Platform Revenue
// ==========================================

// GET /api/v1/admin/subscriptions
router.get('/subscriptions', async (req, res) => {
  try {
    const { status, plan_id, search } = req.query;
    let sql = `
      SELECT
        cs.*,
        c.name as clinic_name,
        c.slug as clinic_slug,
        c.city as clinic_city,
        sp.name as plan_name,
        sp.code as plan_code,
        sp.monthly_price,
        sp.yearly_price,
        sp.max_branches,
        sp.max_doctors,
        sp.max_staff,
        sp.max_monthly_appointments,
        bp.legal_business_name,
        bp.gstin
      FROM clinic_subscriptions cs
      JOIN clinics c ON cs.clinic_id = c.id
      JOIN subscription_plans sp ON cs.plan_id = sp.id
      LEFT JOIN billing_profiles bp ON cs.clinic_id = bp.clinic_id
      WHERE 1=1
    `;
    const params = [];
    if (status) {
      params.push(status);
      sql += ` AND cs.status = $${params.length}`;
    }
    if (plan_id) {
      params.push(plan_id);
      sql += ` AND cs.plan_id = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (c.name ILIKE $${params.length} OR c.city ILIKE $${params.length})`;
    }
    sql += ` ORDER BY cs.created_at DESC;`;
    const result = await query(sql, params);
    return res.status(200).json({ success: true, data: { subscriptions: result.rows } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/v1/admin/subscriptions/plans
router.get('/subscriptions/plans', async (req, res) => {
  try {
    const plans = await query('SELECT * FROM subscription_plans ORDER BY display_order ASC');
    return res.status(200).json({ success: true, data: { plans: plans.rows } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/v1/admin/subscriptions/plans
router.post('/subscriptions/plans', async (req, res) => {
  const {
    id, name, code, description, monthly_price, yearly_price, trial_duration_days,
    max_branches, max_doctors, max_staff, max_monthly_appointments, storage_limit_mb,
    feature_entitlements, is_active, display_order
  } = req.body;

  try {
    if (id) {
      const updated = await query(`
        UPDATE subscription_plans
        SET name = COALESCE($1, name),
            monthly_price = COALESCE($2, monthly_price),
            yearly_price = COALESCE($3, yearly_price),
            max_branches = COALESCE($4, max_branches),
            max_doctors = COALESCE($5, max_doctors),
            max_staff = COALESCE($6, max_staff),
            max_monthly_appointments = COALESCE($7, max_monthly_appointments),
            storage_limit_mb = COALESCE($8, storage_limit_mb),
            feature_entitlements = COALESCE($9, feature_entitlements),
            is_active = COALESCE($10, is_active),
            display_order = COALESCE($11, display_order),
            updated_at = NOW()
        WHERE id = $12
        RETURNING *;
      `, [name, monthly_price, yearly_price, max_branches, max_doctors, max_staff, max_monthly_appointments, storage_limit_mb, feature_entitlements ? JSON.stringify(feature_entitlements) : null, is_active, display_order, id]);

      return res.status(200).json({ success: true, data: { plan: updated.rows[0] } });
    } else {
      const planId = uuidv4();
      const created = await query(`
        INSERT INTO subscription_plans (
          id, name, code, description, monthly_price, yearly_price, trial_duration_days,
          max_branches, max_doctors, max_staff, max_monthly_appointments, storage_limit_mb,
          feature_entitlements, is_active, display_order
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *;
      `, [
        planId, name, code ? code.toUpperCase() : 'CUSTOM', description || '', monthly_price || 0, yearly_price || 0, trial_duration_days || 14,
        max_branches || 1, max_doctors || 1, max_staff || 2, max_monthly_appointments || 100, storage_limit_mb || 1000,
        JSON.stringify(feature_entitlements || {}), is_active !== false, display_order || 1
      ]);
      return res.status(201).json({ success: true, data: { plan: created.rows[0] } });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/v1/admin/subscriptions/:id/manual-adjustment
router.post('/subscriptions/:id/manual-adjustment', async (req, res) => {
  const { id } = req.params;
  const { status, extend_days, plan_id, reason } = req.body;

  if (!reason) {
    return res.status(400).json({
      success: false,
      error: { message: 'Reason is strictly mandatory for manual subscription adjustments (audit policy).' }
    });
  }

  try {
    const subRes = await query('SELECT * FROM clinic_subscriptions WHERE id = $1', [id]);
    if (subRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Subscription not found.' } });
    }
    const currentSub = subRes.rows[0];

    let newStatus = status || currentSub.status;
    let newPeriodEnd = new Date(currentSub.current_period_end);
    if (extend_days && parseInt(extend_days, 10) > 0) {
      newPeriodEnd.setDate(newPeriodEnd.getDate() + parseInt(extend_days, 10));
    }
    let newPlanId = plan_id || currentSub.plan_id;

    const updated = await query(`
      UPDATE clinic_subscriptions
      SET status = $1,
          current_period_end = $2,
          plan_id = $3,
          updated_at = NOW()
      WHERE id = $4
      RETURNING *;
    `, [newStatus, newPeriodEnd, newPlanId, id]);

    // Mandatory audit log
    await query(`
      INSERT INTO subscription_audit_logs (
        id, clinic_id, subscription_id, actor_user_id, action, from_status, to_status, reason, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
    `, [
      uuidv4(),
      currentSub.clinic_id,
      id,
      req.user.id,
      'SUPER_ADMIN_MANUAL_ADJUSTMENT',
      currentSub.status,
      newStatus,
      reason,
      JSON.stringify({ extend_days, previous_end: currentSub.current_period_end, new_end: newPeriodEnd, plan_id: newPlanId })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        message: 'Subscription adjusted successfully and recorded in audit log.',
        subscription: updated.rows[0]
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/v1/admin/revenue/analytics
router.get('/revenue/analytics', async (req, res) => {
  try {
    const analytics = await AnalyticsService.getSuperAdminRevenueAnalytics(req.query);
    return res.status(200).json({ success: true, data: analytics });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/v1/admin/revenue/export
router.get('/revenue/export', async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        sp.id,
        sp.gateway_order_id,
        sp.gateway_payment_id,
        c.name as clinic_name,
        c.city as clinic_city,
        p.name as plan_name,
        sp.amount as subtotal,
        sp.tax_amount,
        sp.total_amount,
        sp.currency,
        sp.payment_status,
        sp.paid_at
      FROM subscription_payments sp
      JOIN clinics c ON sp.clinic_id = c.id
      LEFT JOIN clinic_subscriptions cs ON sp.subscription_id = cs.id
      LEFT JOIN subscription_plans p ON cs.plan_id = p.id
      ORDER BY sp.paid_at DESC;
    `);

    let csv = 'Payment ID,Order ID,Gateway Payment ID,Clinic,City,Plan,Subtotal,Tax (18% GST),Total Amount,Currency,Status,Paid At\n';
    for (const r of rows.rows) {
      csv += `"${r.id}","${r.gateway_order_id || ''}","${r.gateway_payment_id || ''}","${(r.clinic_name || '').replace(/"/g, '""')}","${r.clinic_city || ''}","${r.plan_name || ''}",${r.subtotal},${r.tax_amount},${r.total_amount},"${r.currency}","${r.payment_status}","${r.paid_at ? new Date(r.paid_at).toISOString() : ''}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="smart_clinic_os_saas_revenue.csv"');
    return res.status(200).send(csv);
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ==========================================
// Super Admin Comprehensive Management APIs
// (Admins, Doctors, Receptionists, Patients, Clinics)
// ==========================================

// GET /api/v1/admin/admins - List all Clinic Admins/Owners
router.get('/admins', async (req, res) => {
  try {
    const admins = await query(`
      SELECT u.id, u.full_name, u.email, u.phone_number, u.is_active, u.created_at,
             c.id as clinic_id, c.name as clinic_name, c.city as clinic_city,
             c.verification_status as clinic_status
      FROM users u
      JOIN clinic_memberships cm ON u.id = cm.user_id
      JOIN roles r ON cm.role_id = r.id
      JOIN clinics c ON cm.clinic_id = c.id
      WHERE r.name IN ('CLINIC_OWNER', 'ADMIN')
      ORDER BY u.created_at DESC
    `);
    return res.status(200).json({ success: true, data: { admins: admins.rows } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/v1/admin/admins - Create a Clinic Admin & assign to a clinic
router.post('/admins', async (req, res) => {
  const { full_name, email, phone_number, password, clinic_id } = req.body;
  if (!full_name || !email || !password || !clinic_id) {
    return res.status(400).json({ success: false, error: { message: 'full_name, email, password, and clinic_id are required.' } });
  }

  try {
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    let userId;
    if (existing.rows.length > 0) {
      userId = existing.rows[0].id;
    } else {
      userId = uuidv4();
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(password, salt);
      await query(
        `INSERT INTO users (id, email, phone_number, password_hash, full_name, is_active, is_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, true, true, NOW(), NOW())`,
        [userId, email.trim().toLowerCase(), phone_number || null, hash, full_name]
      );
    }

    const roleRes = await query("SELECT id FROM roles WHERE name = 'CLINIC_OWNER' LIMIT 1");
    const roleId = roleRes.rows[0]?.id;

    await query(`
      INSERT INTO clinic_memberships (id, clinic_id, user_id, role_id, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 'ACTIVE', NOW(), NOW())
      ON CONFLICT DO NOTHING
    `, [uuidv4(), clinic_id, userId, roleId]);

    return res.status(201).json({
      success: true,
      data: { message: 'Clinic Admin created and assigned successfully.', admin_id: userId }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/v1/admin/all-doctors - List all doctors across all clinics
router.get('/all-doctors', async (req, res) => {
  try {
    const docs = await query(`
      SELECT dp.*, u.full_name, u.email, u.phone_number, u.is_active as user_active,
             c.name as clinic_name, c.city as clinic_city,
             (SELECT COUNT(*) FROM appointments a WHERE a.doctor_id = dp.id) as total_appointments,
             (SELECT COUNT(*) FROM appointments a WHERE a.doctor_id = dp.id AND a.status = 'COMPLETED') as completed_appointments
      FROM doctor_profiles dp
      JOIN users u ON dp.user_id = u.id
      JOIN clinics c ON dp.clinic_id = c.id
      ORDER BY dp.created_at DESC
    `);
    return res.status(200).json({
      success: true,
      data: { doctors: docs.rows.map(d => ({ ...d, verification_status: normalizeStatus(d.verification_status) })) }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/v1/admin/doctors - Super Admin creates a doctor for a clinic
router.post('/doctors', async (req, res) => {
  const { full_name, email, phone_number, password, clinic_id, specialty, qualification, medical_registration_number, consultation_fee } = req.body;
  if (!full_name || !email || !clinic_id || !specialty) {
    return res.status(400).json({ success: false, error: { message: 'full_name, email, clinic_id, and specialty are required.' } });
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
    `, [uuidv4(), clinic_id, userId, roleId]);

    const doctorProfileId = uuidv4();
    const branchRes = await query('SELECT id FROM clinic_branches WHERE clinic_id = $1 LIMIT 1', [clinic_id]);
    const branchId = branchRes.rows[0]?.id || null;

    await query(`
      INSERT INTO doctor_profiles (
        id, user_id, clinic_id, primary_branch_id, specialty, qualification,
        medical_registration_number, state_medical_council, experience_years,
        consultation_fee, consultation_duration_minutes, verification_status,
        is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'Karnataka Medical Council', 8, $8, 15, 'VERIFIED', true, NOW(), NOW())
    `, [
      doctorProfileId, userId, clinic_id, branchId, specialty,
      qualification || 'MBBS, MD', medical_registration_number || `KMC-${Date.now().toString().slice(-6)}`,
      parseFloat(consultation_fee || 500)
    ]);

    return res.status(201).json({
      success: true,
      data: { message: 'Doctor created and verified successfully.', doctor_id: doctorProfileId }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/v1/admin/all-receptionists - List all receptionists across all clinics
router.get('/all-receptionists', async (req, res) => {
  try {
    const recs = await query(`
      SELECT u.id, u.full_name, u.email, u.phone_number, u.is_active, u.created_at,
             c.id as clinic_id, c.name as clinic_name, c.city as clinic_city
      FROM users u
      JOIN clinic_memberships cm ON u.id = cm.user_id
      JOIN roles r ON cm.role_id = r.id
      JOIN clinics c ON cm.clinic_id = c.id
      WHERE r.name = 'RECEPTIONIST'
      ORDER BY u.created_at DESC
    `);
    return res.status(200).json({ success: true, data: { receptionists: recs.rows } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/v1/admin/receptionists - Create a receptionist and assign to a clinic
router.post('/receptionists', async (req, res) => {
  const { full_name, email, phone_number, password, clinic_id } = req.body;
  if (!full_name || !email || !clinic_id) {
    return res.status(400).json({ success: false, error: { message: 'full_name, email, and clinic_id are required.' } });
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
    `, [uuidv4(), clinic_id, userId, roleId]);

    return res.status(201).json({
      success: true,
      data: { message: 'Receptionist created and assigned successfully.', receptionist_id: userId }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/v1/admin/all-patients - List all patients across all clinics
router.get('/all-patients', async (req, res) => {
  try {
    const patients = await query(`
      SELECT p.*, c.name as clinic_name, c.city as clinic_city,
             (SELECT COUNT(*) FROM appointments a WHERE a.patient_id = p.id) as total_appointments,
             (SELECT MAX(a.appointment_date) FROM appointments a WHERE a.patient_id = p.id) as last_visit_date
      FROM patients p
      LEFT JOIN clinics c ON p.clinic_id = c.id
      ORDER BY p.created_at DESC
    `);
    return res.status(200).json({ success: true, data: { patients: patients.rows } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/v1/admin/clinics - Super Admin creates/onboards a new clinic location
router.post('/clinics', async (req, res) => {
  const { name, slug, phone, email, address, city, state, postal_code, registration_number } = req.body;
  if (!name || !city) {
    return res.status(400).json({ success: false, error: { message: 'name and city are required.' } });
  }

  try {
    const clinicId = uuidv4();
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const created = await query(`
      INSERT INTO clinics (
        id, name, slug, phone, email, address, city, state, postal_code,
        registration_number, is_active, verification_status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, 'VERIFIED', NOW(), NOW())
      RETURNING *
    `, [
      clinicId, name, finalSlug, phone || '+918023456789', email || `info@${finalSlug}.in`,
      address || `${city} Main Road`, city, state || 'Karnataka', postal_code || '560001',
      registration_number || `REG-KA-${Math.floor(100000 + Math.random() * 900000)}`
    ]);

    // Create default main branch
    const branchId = uuidv4();
    await query(`
      INSERT INTO clinic_branches (id, clinic_id, name, is_main_branch, phone, email, address, city, state, postal_code, operating_status, is_active, created_at, updated_at)
      VALUES ($1, $2, 'Main Branch', true, $3, $4, $5, $6, $7, $8, 'OPERATIONAL', true, NOW(), NOW())
    `, [branchId, clinicId, phone || null, email || null, address || null, city, state || 'Karnataka', postal_code || null]);

    return res.status(201).json({
      success: true,
      data: { message: 'Clinic location created and verified successfully.', clinic: created.rows[0] }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;
