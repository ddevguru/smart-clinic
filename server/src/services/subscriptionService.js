const { query, pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class SubscriptionService {
  /**
   * Get all active subscription plans
   */
  static async getActivePlans() {
    const res = await query(`
      SELECT * FROM subscription_plans
      WHERE is_active = true
      ORDER BY display_order ASC;
    `);
    return res.rows;
  }

  /**
   * Get plan by ID or code
   */
  static async getPlan(planIdOrCode) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(planIdOrCode);
    let res;
    if (isUuid) {
      res = await query('SELECT * FROM subscription_plans WHERE id = $1', [planIdOrCode]);
    } else {
      res = await query('SELECT * FROM subscription_plans WHERE code = $1', [planIdOrCode.toUpperCase()]);
    }
    return res.rows[0] || null;
  }

  /**
   * Calculate real clinic resource usage
   */
  static async calculateClinicUsage(clinicId) {
    const [branchesRes, docsRes, staffRes, apptsRes] = await Promise.all([
      query('SELECT count(*) as cnt FROM clinic_branches WHERE clinic_id = $1 AND is_active = true', [clinicId]),
      query('SELECT count(*) as cnt FROM doctor_profiles WHERE clinic_id = $1 AND is_active = true', [clinicId]),
      query('SELECT count(*) as cnt FROM clinic_memberships WHERE clinic_id = $1 AND status = $2', [clinicId, 'ACTIVE']),
      query(`
        SELECT count(*) as cnt FROM appointments
        WHERE clinic_id = $1
          AND appointment_date >= DATE_TRUNC('month', CURRENT_DATE)
      `, [clinicId])
    ]);

    return {
      branches_used: parseInt(branchesRes.rows[0].cnt, 10),
      doctors_used: parseInt(docsRes.rows[0].cnt, 10),
      staff_used: parseInt(staffRes.rows[0].cnt, 10),
      monthly_appointments_used: parseInt(apptsRes.rows[0].cnt, 10)
    };
  }

  /**
   * Get current clinic subscription with plan details and real usage vs limits
   */
  static async getClinicSubscription(clinicId) {
    const subRes = await query(`
      SELECT cs.*,
             sp.name as plan_name, sp.code as plan_code, sp.description as plan_description,
             sp.monthly_price, sp.yearly_price, sp.currency,
             sp.max_branches, sp.max_doctors, sp.max_staff, sp.max_monthly_appointments,
             sp.storage_limit_mb, sp.feature_entitlements
      FROM clinic_subscriptions cs
      JOIN subscription_plans sp ON cs.plan_id = sp.id
      WHERE cs.clinic_id = $1
      ORDER BY cs.created_at DESC
      LIMIT 1;
    `, [clinicId]);

    const subscription = subRes.rows[0] || null;
    const usage = await this.calculateClinicUsage(clinicId);

    // Fetch billing profile
    const bpRes = await query('SELECT * FROM billing_profiles WHERE clinic_id = $1', [clinicId]);
    const billingProfile = bpRes.rows[0] || null;

    return {
      subscription,
      usage,
      billing_profile: billingProfile
    };
  }

  /**
   * Centralized Feature Entitlement Enforcement
   * Returns { allowed: boolean, reason?: string, current?: number, max?: number }
   */
  static async checkEntitlement(clinicId, featureKey, requestedAmount = 1) {
    const { subscription, usage } = await this.getClinicSubscription(clinicId);

    if (!subscription) {
      return {
        allowed: false,
        reason: 'No active subscription found for this clinic. Please choose a subscription plan.',
        status: 'NO_SUBSCRIPTION'
      };
    }

    // Check status expiration or suspension
    const activeStatuses = ['ACTIVE', 'TRIALING', 'GRACE_PERIOD'];
    if (!activeStatuses.includes(subscription.status)) {
      return {
        allowed: false,
        reason: `Clinic subscription is currently ${subscription.status}. Existing medical records remain accessible, but premium actions require subscription renewal.`,
        status: subscription.status
      };
    }

    // 1. Max Branches Entitlement
    if (featureKey === 'MAX_BRANCHES') {
      const allowed = subscription.max_branches === -1 || (usage.branches_used + requestedAmount) <= subscription.max_branches;
      return {
        allowed,
        current: usage.branches_used,
        max: subscription.max_branches,
        reason: allowed ? null : `Branch limit reached (${usage.branches_used}/${subscription.max_branches}). Please upgrade to Professional or Enterprise to add more branches.`
      };
    }

    // 2. Max Doctors Entitlement
    if (featureKey === 'MAX_DOCTORS') {
      const allowed = subscription.max_doctors === -1 || (usage.doctors_used + requestedAmount) <= subscription.max_doctors;
      return {
        allowed,
        current: usage.doctors_used,
        max: subscription.max_doctors,
        reason: allowed ? null : `Doctor seat limit reached (${usage.doctors_used}/${subscription.max_doctors}). Please upgrade your plan to register more doctors.`
      };
    }

    // 3. Max Staff Entitlement
    if (featureKey === 'MAX_STAFF') {
      const allowed = subscription.max_staff === -1 || (usage.staff_used + requestedAmount) <= subscription.max_staff;
      return {
        allowed,
        current: usage.staff_used,
        max: subscription.max_staff,
        reason: allowed ? null : `Staff member limit reached (${usage.staff_used}/${subscription.max_staff}). Upgrade plan to add more staff.`
      };
    }

    // 4. Max Monthly Appointments
    if (featureKey === 'MAX_MONTHLY_APPOINTMENTS') {
      const allowed = subscription.max_monthly_appointments === -1 || (usage.monthly_appointments_used + requestedAmount) <= subscription.max_monthly_appointments;
      return {
        allowed,
        current: usage.monthly_appointments_used,
        max: subscription.max_monthly_appointments,
        reason: allowed ? null : `Monthly appointment booking limit reached (${usage.monthly_appointments_used}/${subscription.max_monthly_appointments}). Upgrade your subscription.`
      };
    }

    // 5. Feature Flags (Digital Prescriptions, Traffic Intelligence, etc.)
    const entitlements = subscription.feature_entitlements || {};
    if (featureKey in entitlements) {
      const allowed = entitlements[featureKey] === true;
      return {
        allowed,
        reason: allowed ? null : `Feature "${featureKey}" is not included in the ${subscription.plan_name} plan. Upgrade to unlock.`
      };
    }

    return { allowed: true };
  }

  /**
   * Start a 14-day free trial with duplicate abuse protection
   */
  static async startFreeTrial(clinicId, actorUserId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check for prior trial abuse on this clinic
      const priorTrials = await client.query(`
        SELECT count(*) as cnt FROM clinic_subscriptions
        WHERE clinic_id = $1 AND trial_start_at IS NOT NULL;
      `, [clinicId]);

      if (parseInt(priorTrials.rows[0].cnt, 10) > 0) {
        throw new Error('This clinic has already utilized its free trial period. Please subscribe to an active paid plan.');
      }

      const trialPlanRes = await client.query("SELECT * FROM subscription_plans WHERE code = 'TRIAL'");
      if (trialPlanRes.rows.length === 0) {
        throw new Error('Free trial plan is currently unavailable.');
      }
      const trialPlan = trialPlanRes.rows[0];

      const trialStart = new Date();
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + (trialPlan.trial_duration_days || 14));

      const subId = uuidv4();
      const newSub = await client.query(`
        INSERT INTO clinic_subscriptions (
          id, clinic_id, plan_id, status, billing_interval,
          trial_start_at, trial_end_at, current_period_start, current_period_end,
          next_billing_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, 'TRIALING', 'MONTHLY',
          $4, $5, $4, $5,
          $5, NOW(), NOW()
        ) RETURNING *;
      `, [subId, clinicId, trialPlan.id, trialStart, trialEnd]);

      // Audit log
      await client.query(`
        INSERT INTO subscription_audit_logs (
          id, clinic_id, subscription_id, actor_user_id, action,
          from_status, to_status, reason, metadata, created_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, 'TRIAL_STARTED',
          NULL, 'TRIALING', 'Clinic initialized 14-day free trial',
          $4::jsonb, NOW()
        );
      `, [clinicId, subId, actorUserId, JSON.stringify({ trial_duration_days: trialPlan.trial_duration_days })]);

      await client.query('COMMIT');
      return newSub.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Activate paid subscription upon verified payment
   */
  static async activateSubscription({
    clinicId,
    planId,
    billingInterval = 'MONTHLY',
    paymentData,
    actorUserId
  }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const planRes = await client.query('SELECT * FROM subscription_plans WHERE id = $1', [planId]);
      if (planRes.rows.length === 0) {
        throw new Error('Subscription plan not found.');
      }
      const plan = planRes.rows[0];

      const periodStart = new Date();
      const periodEnd = new Date();
      if (billingInterval.toUpperCase() === 'YEARLY') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setDate(periodEnd.getDate() + 30);
      }

      // Check current subscription
      const curSubRes = await client.query(
        'SELECT * FROM clinic_subscriptions WHERE clinic_id = $1 ORDER BY created_at DESC LIMIT 1',
        [clinicId]
      );
      const curSub = curSubRes.rows[0] || null;

      let subId = curSub ? curSub.id : uuidv4();
      let updatedSub;

      if (curSub) {
        updatedSub = await client.query(`
          UPDATE clinic_subscriptions SET
            plan_id = $1,
            status = 'ACTIVE',
            billing_interval = $2,
            current_period_start = $3,
            current_period_end = $4,
            next_billing_at = $4,
            grace_period_ends_at = NULL,
            cancelled_at = NULL,
            cancel_at_period_end = false,
            updated_at = NOW()
          WHERE id = $5
          RETURNING *;
        `, [plan.id, billingInterval.toUpperCase(), periodStart, periodEnd, subId]);
      } else {
        updatedSub = await client.query(`
          INSERT INTO clinic_subscriptions (
            id, clinic_id, plan_id, status, billing_interval,
            current_period_start, current_period_end, next_billing_at,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, 'ACTIVE', $4,
            $5, $6, $6,
            NOW(), NOW()
          ) RETURNING *;
        `, [subId, clinicId, plan.id, billingInterval.toUpperCase(), periodStart, periodEnd]);
      }

      // Record verified payment
      const paymentId = uuidv4();
      const amount = billingInterval.toUpperCase() === 'YEARLY' ? parseFloat(plan.yearly_price) : parseFloat(plan.monthly_price);
      const taxAmount = +(amount * 0.18).toFixed(2);
      const totalAmount = +(amount + taxAmount).toFixed(2);

      const payRes = await client.query(`
        INSERT INTO subscription_payments (
          id, subscription_id, clinic_id, amount, tax_amount, total_amount,
          currency, payment_gateway, gateway_order_id, gateway_payment_id,
          gateway_signature, payment_status, idempotency_key, paid_at,
          metadata, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          'INR', 'RAZORPAY', $7, $8,
          $9, 'SUCCESS', $10, NOW(),
          $11, NOW()
        ) RETURNING *;
      `, [
        paymentId,
        subId,
        clinicId,
        amount,
        taxAmount,
        totalAmount,
        paymentData.order_id,
        paymentData.payment_id,
        paymentData.signature || null,
        'pay:' + paymentData.payment_id,
        JSON.stringify(paymentData)
      ]);

      // Audit log
      await client.query(`
        INSERT INTO subscription_audit_logs (
          id, clinic_id, subscription_id, actor_user_id, action,
          from_status, to_status, reason, metadata, created_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, 'SUBSCRIPTION_ACTIVATED',
          $4, 'ACTIVE', 'Payment verified successfully via Razorpay',
          $5::jsonb, NOW()
        );
      `, [
        clinicId,
        subId,
        actorUserId,
        curSub?.status || 'NONE',
        JSON.stringify({ plan_code: plan.code, total_amount: totalAmount, payment_id: paymentId })
      ]);

      await client.query('COMMIT');
      return {
        subscription: updatedSub.rows[0],
        payment: payRes.rows[0],
        plan
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Cancel subscription (immediate or at period end)
   */
  static async cancelSubscription({ clinicId, cancelAtPeriodEnd = true, reason, actorUserId }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const subRes = await client.query(
        'SELECT * FROM clinic_subscriptions WHERE clinic_id = $1 ORDER BY created_at DESC LIMIT 1',
        [clinicId]
      );
      if (subRes.rows.length === 0) throw new Error('No active subscription found.');
      const sub = subRes.rows[0];

      const newStatus = cancelAtPeriodEnd ? sub.status : 'CANCELLED';
      const updated = await client.query(`
        UPDATE clinic_subscriptions SET
          status = $1,
          cancel_at_period_end = $2,
          cancelled_at = NOW(),
          updated_at = NOW()
        WHERE id = $3
        RETURNING *;
      `, [newStatus, cancelAtPeriodEnd, sub.id]);

      await client.query(`
        INSERT INTO subscription_audit_logs (
          id, clinic_id, subscription_id, actor_user_id, action,
          from_status, to_status, reason, metadata, created_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, 'SUBSCRIPTION_CANCELLED',
          $4, $5, $6,
          $7::jsonb, NOW()
        );
      `, [
        clinicId, sub.id, actorUserId,
        sub.status, newStatus, reason || 'Customer requested cancellation',
        JSON.stringify({ cancel_at_period_end: cancelAtPeriodEnd })
      ]);

      await client.query('COMMIT');
      return updated.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Super Admin manual subscription adjustment
   */
  static async manualAdminAdjustment({
    adminUserId,
    clinicId,
    newStatus,
    extendDays = 0,
    reason
  }) {
    if (!reason || !reason.trim()) {
      throw new Error('Mandatory justification reason required for manual subscription modifications.');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const curSubRes = await client.query(
        'SELECT * FROM clinic_subscriptions WHERE clinic_id = $1 ORDER BY created_at DESC LIMIT 1',
        [clinicId]
      );
      if (curSubRes.rows.length === 0) throw new Error('No subscription record found for this clinic.');
      const sub = curSubRes.rows[0];

      let newPeriodEnd = new Date(sub.current_period_end);
      if (extendDays > 0) {
        newPeriodEnd.setDate(newPeriodEnd.getDate() + extendDays);
      }

      const updated = await client.query(`
        UPDATE clinic_subscriptions SET
          status = COALESCE($1, status),
          current_period_end = $2,
          next_billing_at = $2,
          updated_at = NOW()
        WHERE id = $3
        RETURNING *;
      `, [newStatus || sub.status, newPeriodEnd, sub.id]);

      await client.query(`
        INSERT INTO subscription_audit_logs (
          id, clinic_id, subscription_id, actor_user_id, action,
          from_status, to_status, reason, metadata, created_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, 'SUPERADMIN_MANUAL_ADJUSTMENT',
          $4, $5, $6,
          $7::jsonb, NOW()
        );
      `, [
        clinicId, sub.id, adminUserId,
        sub.status, newStatus || sub.status, reason,
        JSON.stringify({ extended_days: extendDays, new_period_end: newPeriodEnd })
      ]);

      await client.query('COMMIT');
      return updated.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = SubscriptionService;
