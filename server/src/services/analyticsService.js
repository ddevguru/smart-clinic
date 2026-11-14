const { query } = require('../config/db');

class AnalyticsService {
  /**
   * Super Admin Platform-Wide SaaS Revenue Analytics
   */
  static async getSuperAdminRevenueAnalytics({ startDate, endDate, planId } = {}) {
    // 1. Total Collected Platform Revenue (Verified Success Payments only)
    let revQuery = `
      SELECT
        COALESCE(SUM(amount), 0) as total_subtotal_collected,
        COALESCE(SUM(tax_amount), 0) as total_tax_collected,
        COALESCE(SUM(total_amount), 0) as total_gross_collected,
        count(*) as total_successful_transactions
      FROM subscription_payments
      WHERE payment_status = 'SUCCESS'
    `;
    const revParams = [];
    if (startDate) {
      revParams.push(startDate);
      revQuery += ` AND paid_at >= $${revParams.length}`;
    }
    if (endDate) {
      revParams.push(endDate);
      revQuery += ` AND paid_at <= $${revParams.length}`;
    }
    const revRes = await query(revQuery, revParams);
    const revData = revRes.rows[0];

    // 2. Monthly Recurring Revenue (MRR) & Annual Recurring Revenue (ARR)
    // Formula: Sum of monthly plan prices for all ACTIVE subscriptions + (yearly plan prices / 12)
    const mrrRes = await query(`
      SELECT
        SUM(
          CASE 
            WHEN cs.billing_interval = 'YEARLY' THEN sp.yearly_price / 12.0
            ELSE sp.monthly_price
          END
        ) as mrr,
        count(cs.id) as active_paying_clinics
      FROM clinic_subscriptions cs
      JOIN subscription_plans sp ON cs.plan_id = sp.id
      WHERE cs.status = 'ACTIVE' AND sp.code != 'TRIAL';
    `);

    const mrr = parseFloat(mrrRes.rows[0].mrr || 0);
    const arr = +(mrr * 12).toFixed(2);
    const activePayingClinics = parseInt(mrrRes.rows[0].active_paying_clinics || 0, 10);

    // 3. Subscriptions Status Distribution
    const statusRes = await query(`
      SELECT status, count(*) as count
      FROM clinic_subscriptions
      GROUP BY status;
    `);
    const statusMap = {
      ACTIVE: 0,
      TRIALING: 0,
      PAST_DUE: 0,
      GRACE_PERIOD: 0,
      CANCELLED: 0,
      EXPIRED: 0,
      SUSPENDED: 0
    };
    for (const r of statusRes.rows) {
      statusMap[r.status] = parseInt(r.count, 10);
    }

    // 4. Revenue & Clinics by Plan
    const planBreakdown = await query(`
      SELECT 
        sp.id, sp.name, sp.code, sp.monthly_price, sp.yearly_price,
        count(cs.id) as subscriber_count,
        COALESCE(SUM(sp.monthly_price), 0) as monthly_run_rate
      FROM subscription_plans sp
      LEFT JOIN clinic_subscriptions cs ON sp.id = cs.plan_id AND cs.status = 'ACTIVE'
      GROUP BY sp.id, sp.name, sp.code, sp.monthly_price, sp.yearly_price
      ORDER BY sp.display_order ASC;
    `);

    // 5. Churn Rate & Trial Conversion Rate
    const churnRes = await query(`
      SELECT
        (SELECT count(*) FROM clinic_subscriptions WHERE status = 'CANCELLED') as cancelled_count,
        (SELECT count(*) FROM clinic_subscriptions WHERE status IN ('ACTIVE', 'CANCELLED', 'PAST_DUE')) as total_count,
        (SELECT count(*) FROM clinic_subscriptions WHERE trial_start_at IS NOT NULL) as total_trials,
        (SELECT count(*) FROM clinic_subscriptions WHERE trial_start_at IS NOT NULL AND status = 'ACTIVE') as converted_trials;
    `);
    const chData = churnRes.rows[0];
    const totalSubscribers = parseInt(chData.total_count || 0, 10);
    const cancelledCount = parseInt(chData.cancelled_count || 0, 10);
    const churnRate = totalSubscribers > 0 ? +((cancelledCount / totalSubscribers) * 100).toFixed(1) : 0.0;

    const totalTrials = parseInt(chData.total_trials || 0, 10);
    const convertedTrials = parseInt(chData.converted_trials || 0, 10);
    const trialConversionRate = totalTrials > 0 ? +((convertedTrials / totalTrials) * 100).toFixed(1) : 0.0;

    // 6. Monthly Revenue Trend (Last 6 Months)
    const trendRes = await query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', paid_at), 'YYYY-MM') as month,
        SUM(amount) as subtotal,
        SUM(tax_amount) as tax,
        SUM(total_amount) as gross,
        count(*) as transaction_count
      FROM subscription_payments
      WHERE payment_status = 'SUCCESS'
        AND paid_at >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', paid_at)
      ORDER BY DATE_TRUNC('month', paid_at) ASC;
    `);

    return {
      revenue: {
        total_collected: parseFloat(revData.total_gross_collected),
        total_subtotal: parseFloat(revData.total_subtotal_collected),
        total_tax: parseFloat(revData.total_tax_collected),
        mrr: +mrr.toFixed(2),
        arr,
        currency: 'INR',
        transaction_count: parseInt(revData.total_successful_transactions, 10)
      },
      metrics: {
        active_paying_clinics: activePayingClinics,
        total_active: statusMap.ACTIVE,
        total_trialing: statusMap.TRIALING,
        total_past_due: statusMap.PAST_DUE + statusMap.GRACE_PERIOD,
        total_cancelled: statusMap.CANCELLED,
        churn_rate_pct: churnRate,
        trial_conversion_pct: trialConversionRate
      },
      status_distribution: statusMap,
      plans_breakdown: planBreakdown.rows,
      monthly_trend: trendRes.rows
    };
  }

  /**
   * Clinic Owner Operational & Performance Analytics
   * Strictly separates Patient Consultation Billing from SaaS Platform Subscription Fees
   */
  static async getClinicOperationalAnalytics(clinicId, { startDate, endDate } = {}) {
    // 1. Patient Volume Metrics
    const patientStats = await query(`
      SELECT
        count(*) as total_registered_patients,
        COUNT(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as new_patients_this_month
      FROM patients
      WHERE clinic_id = $1;
    `, [clinicId]);

    // 2. Appointment Metrics
    const apptStats = await query(`
      SELECT
        count(*) as total_appointments,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_count,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled_count,
        COUNT(CASE WHEN status = 'SCHEDULED' THEN 1 END) as scheduled_count,
        COUNT(CASE WHEN appointment_source = 'ONLINE' THEN 1 END) as online_bookings,
        COUNT(CASE WHEN appointment_source = 'WALK_IN' THEN 1 END) as walkin_bookings
      FROM appointments
      WHERE clinic_id = $1;
    `, [clinicId]);

    const totalAppts = parseInt(apptStats.rows[0].total_appointments, 10);
    const completedAppts = parseInt(apptStats.rows[0].completed_count, 10);
    const cancelledAppts = parseInt(apptStats.rows[0].cancelled_count, 10);
    const completionRate = totalAppts > 0 ? +((completedAppts / totalAppts) * 100).toFixed(1) : 0.0;
    const cancellationRate = totalAppts > 0 ? +((cancelledAppts / totalAppts) * 100).toFixed(1) : 0.0;

    // 3. Doctor Performance & OPD Volume
    const doctorStats = await query(`
      SELECT
        dp.id, dp.qualification, dp.specialty, u.full_name,
        COUNT(a.id) as total_appointments,
        COUNT(CASE WHEN a.status = 'COMPLETED' THEN 1 END) as completed_consultations
      FROM doctor_profiles dp
      JOIN users u ON dp.user_id = u.id
      LEFT JOIN appointments a ON dp.id = a.doctor_id AND a.clinic_id = $1
      WHERE dp.clinic_id = $1
      GROUP BY dp.id, dp.qualification, dp.specialty, u.full_name;
    `, [clinicId]);

    // 4. Financial Separation:
    // A) Patient Consultation Billing Collections (Clinic Revenue from Patients)
    const patientBillingStats = await query(`
      SELECT
        COALESCE(SUM(amount), 0) as total_consultation_revenue,
        count(*) as total_receipts_issued,
        COUNT(CASE WHEN payment_method = 'UPI' THEN 1 END) as upi_count,
        COUNT(CASE WHEN payment_method = 'CASH' THEN 1 END) as cash_count,
        COUNT(CASE WHEN payment_method = 'CARD' THEN 1 END) as card_count
      FROM payment_records
      WHERE clinic_id = $1 AND (payment_status = 'PAID' OR payment_status = 'SUCCESS');
    `, [clinicId]);

    // B) SaaS Subscription Fees Paid to Platform (Clinic Operating Expense)
    const saasFeeStats = await query(`
      SELECT
        COALESCE(SUM(total_amount), 0) as total_saas_fees_paid,
        count(*) as saas_invoices_paid
      FROM subscription_payments
      WHERE clinic_id = $1 AND payment_status = 'SUCCESS';
    `, [clinicId]);

    const consultationRev = parseFloat(patientBillingStats.rows[0].total_consultation_revenue);
    const saasCost = parseFloat(saasFeeStats.rows[0].total_saas_fees_paid);
    const netClinicOpMargin = +(consultationRev - saasCost).toFixed(2);

    return {
      patients: {
        total_registered: parseInt(patientStats.rows[0].total_registered_patients, 10),
        new_this_month: parseInt(patientStats.rows[0].new_patients_this_month, 10)
      },
      appointments: {
        total: totalAppts,
        completed: completedAppts,
        cancelled: cancelledAppts,
        scheduled: parseInt(apptStats.rows[0].scheduled_count, 10),
        completion_rate_pct: completionRate,
        cancellation_rate_pct: cancellationRate,
        online_bookings: parseInt(apptStats.rows[0].online_bookings, 10),
        walkin_bookings: parseInt(apptStats.rows[0].walkin_bookings, 10)
      },
      doctors: doctorStats.rows,
      financials: {
        // Workflow A: Clinic Revenue from Patients
        patient_consultation_collections: consultationRev,
        receipts_issued_count: parseInt(patientBillingStats.rows[0].total_receipts_issued, 10),
        payment_methods: {
          upi: parseInt(patientBillingStats.rows[0].upi_count, 10),
          cash: parseInt(patientBillingStats.rows[0].cash_count, 10),
          card: parseInt(patientBillingStats.rows[0].card_count, 10)
        },
        // Workflow B: SaaS Subscription Expense paid to Platform
        platform_saas_subscription_expense: saasCost,
        // Net Clinic OPD Margin
        net_clinic_operational_margin: netClinicOpMargin,
        currency: 'INR'
      }
    };
  }
}

module.exports = AnalyticsService;
