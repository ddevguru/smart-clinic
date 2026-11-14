const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { query } = require('../src/config/db');
const SubscriptionService = require('../src/services/subscriptionService');
const RazorpayService = require('../src/services/razorpayService');
const InvoiceService = require('../src/services/invoiceService');
const AnalyticsService = require('../src/services/analyticsService');

const BASE_URL = 'http://localhost:5000/api/v1';

// Helper for HTTP requests
function request(method, reqPath, body = null, token = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const fullUrl = `${BASE_URL}${reqPath.startsWith('/') ? reqPath : '/' + reqPath}`;
    const url = new URL(fullUrl);
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    if (token) reqHeaders['Authorization'] = `Bearer ${token}`;

    const req = http.request(url, { method, headers: reqHeaders }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function loginUser(email, password) {
  const res = await request('POST', '/auth/login', { identifier: email, password });
  if (!res.body.success) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.body)}`);
  }
  return res.body.data.token;
}

async function runTests() {
  console.log('===============================================================');
  console.log('   SMART CLINIC OS — PHASE 8 AUTOMATED VERIFICATION TEST SUITE  ');
  console.log('===============================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // Authenticate users
    console.log('\n--- Step 1: Authenticate Test Personas ---');
    const adminToken = await loginUser('admin@smartclinic.in', 'Password@123');
    const carePlusOwnerToken = await loginUser('owner@careplus.in', 'Password@123');
    const apexOwnerToken = await loginUser('owner@apex.in', 'Password@123');

    assert(!!adminToken, 'Super Admin logged in successfully');
    assert(!!carePlusOwnerToken, 'CarePlus Clinic Owner logged in successfully');
    assert(!!apexOwnerToken, 'Apex Health Clinic Owner logged in successfully');

    // 1. Plan Retrieval
    console.log('\n--- Step 2: Test Subscription Plans Retrieval ---');
    const plansRes = await request('GET', '/clinic/subscriptions/plans', null, carePlusOwnerToken);
    assert(plansRes.status === 200, 'GET /clinic/subscriptions/plans returns HTTP 200');
    assert(plansRes.body.data && plansRes.body.data.plans.length >= 4, `Plans loaded: found ${plansRes.body.data?.plans?.length} plans`);

    const plans = plansRes.body.data.plans;
    const trialPlan = plans.find(p => p.code === 'TRIAL');
    const basicPlan = plans.find(p => p.code === 'BASIC');
    const proPlan = plans.find(p => p.code === 'PRO');
    const enterprisePlan = plans.find(p => p.code === 'ENTERPRISE');

    assert(!!trialPlan && parseFloat(trialPlan.monthly_price) === 0, 'TRIAL plan has price INR 0');
    assert(!!basicPlan && parseFloat(basicPlan.monthly_price) === 1999, 'BASIC plan has price INR 1999');
    assert(!!proPlan && parseFloat(proPlan.monthly_price) === 4999, 'PRO plan has price INR 4999');
    assert(!!enterprisePlan && parseFloat(enterprisePlan.monthly_price) === 12999, 'ENTERPRISE plan has price INR 12999');

    // 2. Current Clinic Subscription & Entitlements
    console.log('\n--- Step 3: Test Clinic Current Subscription & Usage ---');
    const currentRes = await request('GET', '/clinic/subscriptions/current', null, carePlusOwnerToken);
    assert(currentRes.status === 200, 'GET /clinic/subscriptions/current returns HTTP 200');
    assert(currentRes.body.data.subscription.status === 'ACTIVE', 'CarePlus subscription status is ACTIVE');
    assert(currentRes.body.data.subscription.plan_code === 'PRO', 'CarePlus is subscribed to PRO plan');
    assert(typeof currentRes.body.data.usage.doctors_used === 'number', 'Current usage reports doctors count');
    assert(typeof currentRes.body.data.usage.branches_used === 'number', 'Current usage reports branches count');
    assert(typeof currentRes.body.data.usage.staff_used === 'number', 'Current usage reports staff count');

    // 3. Entitlement Engine Enforcement
    console.log('\n--- Step 4: Test Plan Entitlement Engine Limits ---');
    const carePlusSub = currentRes.body.data;
    const carePlusClinicId = carePlusSub.subscription.clinic_id;

    // Feature check: PRO has ADVANCED_ANALYTICS and DIGITAL_PRESCRIPTIONS
    const entAnalytics = await SubscriptionService.checkEntitlement(carePlusClinicId, 'ADVANCED_ANALYTICS');
    assert(entAnalytics.allowed === true, 'CarePlus has ADVANCED_ANALYTICS entitlement on PRO');

    const entReminders = await SubscriptionService.checkEntitlement(carePlusClinicId, 'AUTOMATED_REMINDERS');
    assert(entReminders.allowed === true, 'CarePlus has AUTOMATED_REMINDERS entitlement on PRO');

    // BASIC plan clinic: check Traffic Intelligence
    const apexCurrent = await request('GET', '/clinic/subscriptions/current', null, apexOwnerToken);
    const apexClinicId = apexCurrent.body.data.subscription.clinic_id;
    const apexTrafficEnt = await SubscriptionService.checkEntitlement(apexClinicId, 'TRAFFIC_INTELLIGENCE');
    assert(apexTrafficEnt.allowed === false, 'Apex on BASIC plan does NOT have TRAFFIC_INTELLIGENCE entitlement');

    // 4. Server-Authoritative Razorpay Order Creation
    console.log('\n--- Step 5: Test Server-Authoritative Razorpay Order Creation ---');
    const orderRes = await request('POST', '/clinic/subscriptions/create-order', {
      plan_id: proPlan.id,
      billing_interval: 'MONTHLY'
    }, carePlusOwnerToken);

    assert(orderRes.status === 200, 'POST /create-order returns HTTP 200');
    assert(orderRes.body.data.order_id && orderRes.body.data.order_id.startsWith('order_'), 'Server generated order_id');
    assert(orderRes.body.data.subtotal === 4999, 'Order subtotal authoritatively equals 4999 INR');
    assert(orderRes.body.data.tax_amount === 899.82, '18% GST tax calculated as 899.82 INR');
    assert(orderRes.body.data.amount === 5898.82, 'Total authoritative amount is 5898.82 INR');

    // 5. Payment Signature Verification
    console.log('\n--- Step 6: Test Cryptographic Signature Verification ---');
    const orderId = orderRes.body.data.order_id;
    const paymentId = 'pay_test_' + Date.now();
    const keySecret = RazorpayService.getKeySecret();
    const validSignature = crypto.createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex');

    // Test rejection of forged signature
    const invalidVerifyRes = await request('POST', '/clinic/subscriptions/verify-payment', {
      plan_id: proPlan.id,
      billing_interval: 'MONTHLY',
      order_id: orderId,
      payment_id: paymentId,
      signature: 'fraudulent_invalid_signature_12345'
    }, carePlusOwnerToken);
    assert(invalidVerifyRes.status === 400, 'Forged signature rejected with HTTP 400');

    // Test acceptance of valid signature
    const validVerifyRes = await request('POST', '/clinic/subscriptions/verify-payment', {
      plan_id: proPlan.id,
      billing_interval: 'MONTHLY',
      order_id: orderId,
      payment_id: paymentId,
      signature: validSignature
    }, carePlusOwnerToken);

    if (validVerifyRes.status !== 200) {
      console.log('validVerifyRes failed:', validVerifyRes.status, validVerifyRes.body);
    }

    assert(validVerifyRes.status === 200, 'Valid HMAC-SHA256 signature verified with HTTP 200');
    assert(validVerifyRes.body.data.subscription.status === 'ACTIVE', 'Subscription status updated to ACTIVE');
    assert(!!validVerifyRes.body.data.invoice.invoice_number, `Invoice issued: ${validVerifyRes.body.data.invoice.invoice_number}`);

    // 6. Webhook Signature & Idempotency Testing
    console.log('\n--- Step 7: Test Razorpay Webhook & Event Idempotency ---');
    const webhookEventId = 'evt_test_' + Date.now();
    const webhookPayload = {
      event_id: webhookEventId,
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_wh_' + Date.now(),
            order_id: 'order_wh_' + Date.now(),
            amount: 471882,
            currency: 'INR',
            notes: {
              clinic_id: carePlusClinicId,
              plan_id: proPlan.id,
              billing_interval: 'MONTHLY'
            }
          }
        }
      }
    };
    const webhookRaw = JSON.stringify(webhookPayload);
    const webhookSig = crypto.createHmac('sha256', RazorpayService.getWebhookSecret()).update(webhookRaw).digest('hex');

    // 1st Webhook delivery
    const wh1 = await request('POST', '/webhooks/razorpay', webhookRaw, null, {
      'x-razorpay-signature': webhookSig
    });
    assert(wh1.status === 200 && wh1.body.status === 'PROCESSED', '1st Webhook delivery processed successfully');

    // 2nd Webhook delivery (Duplicate Event)
    const wh2 = await request('POST', '/webhooks/razorpay', webhookRaw, null, {
      'x-razorpay-signature': webhookSig
    });
    assert(wh2.status === 200 && wh2.body.message.includes('Duplicate webhook event received; ignored idempotently'), 'Duplicate webhook event ignored idempotently');

    // 7. PDF Invoice Generation & Multi-Tenant Download
    console.log('\n--- Step 8: Test Sequential GST Invoice & PDF Generation ---');
    const invoicesRes = await request('GET', '/clinic/subscriptions/invoices', null, carePlusOwnerToken);
    assert(invoicesRes.status === 200, 'GET /clinic/subscriptions/invoices returns HTTP 200');
    const invoices = invoicesRes.body.data.invoices;
    assert(invoices.length >= 1, `Found ${invoices.length} generated invoices`);

    const latestInvoice = invoices[0];
    assert(/^INV-\d{6}-\d{4}$/.test(latestInvoice.invoice_number), `Invoice format valid: ${latestInvoice.invoice_number}`);

    // Download PDF as authorized owner
    const downloadRes = await request('GET', `/clinic/subscriptions/invoices/${latestInvoice.id}/download`, null, carePlusOwnerToken);
    assert(downloadRes.status === 200, 'Authorized owner can download PDF invoice');
    assert(downloadRes.headers['content-type'] === 'application/pdf', 'Response Content-Type is application/pdf');

    // Multi-tenant check: Apex Owner cannot download CarePlus invoice
    const rogueDownload = await request('GET', `/clinic/subscriptions/invoices/${latestInvoice.id}/download`, null, apexOwnerToken);
    assert(rogueDownload.status === 404, 'Cross-tenant invoice access strictly denied (HTTP 404)');

    // 8. Super Admin Revenue Analytics & Adjustment
    console.log('\n--- Step 9: Test Super Admin Revenue Analytics & Controls ---');
    const revAnalyticsRes = await request('GET', '/admin/revenue/analytics', null, adminToken);
    assert(revAnalyticsRes.status === 200, 'GET /admin/revenue/analytics returns HTTP 200');
    const revData = revAnalyticsRes.body.data;
    assert(revData.revenue.mrr > 0, `Platform MRR calculated: INR ${revData.revenue.mrr}`);
    assert(revData.revenue.arr > 0, `Platform ARR calculated: INR ${revData.revenue.arr}`);
    assert(revData.metrics.active_paying_clinics >= 1, `Active paying clinics: ${revData.metrics.active_paying_clinics}`);
    assert(Array.isArray(revData.plans_breakdown), 'Plans breakdown array returned');

    // Test CSV Export
    const exportRes = await request('GET', '/admin/revenue/export', null, adminToken);
    assert(exportRes.status === 200, 'GET /admin/revenue/export returns HTTP 200');
    assert(exportRes.headers['content-type'] && exportRes.headers['content-type'].includes('text/csv'), 'Content-Type is text/csv');
    assert(typeof exportRes.body === 'string' && exportRes.body.includes('Payment ID,Order ID'), 'CSV headers present in export');

    // Test Super Admin Manual Adjustment with Audit Reason
    const allSubs = await request('GET', '/admin/subscriptions', null, adminToken);
    assert(allSubs.status === 200, 'GET /admin/subscriptions returns HTTP 200');
    const targetSub = allSubs.body.data.subscriptions[0];

    // Attempt adjustment without reason
    const failAdj = await request('POST', `/admin/subscriptions/${targetSub.id}/manual-adjustment`, {
      extend_days: 10
    }, adminToken);
    assert(failAdj.status === 400, 'Manual adjustment without mandatory reason rejected with HTTP 400');

    // Attempt adjustment with valid reason
    const successAdj = await request('POST', `/admin/subscriptions/${targetSub.id}/manual-adjustment`, {
      extend_days: 14,
      reason: 'Promotional loyalty extension authorized by CEO.'
    }, adminToken);
    assert(successAdj.status === 200, 'Manual adjustment with reason accepted with HTTP 200');

    // 9. Clinic Owner Operational Analytics vs SaaS Expense
    console.log('\n--- Step 10: Test Clinic Financial Separation Analytics ---');
    const clinicAnalyticsRes = await request('GET', '/clinic/subscriptions/analytics', null, carePlusOwnerToken);
    if (clinicAnalyticsRes.status !== 200) {
      console.log('clinicAnalyticsRes failed:', clinicAnalyticsRes.status, clinicAnalyticsRes.body);
    }
    assert(clinicAnalyticsRes.status === 200, 'GET /clinic/subscriptions/analytics returns HTTP 200');
    const cData = clinicAnalyticsRes.body.data;
    assert('patient_consultation_collections' in cData.financials, 'Patient consultation collections clearly tracked');
    assert('platform_saas_subscription_expense' in cData.financials, 'SaaS subscription expense clearly separated');
    assert('net_clinic_operational_margin' in cData.financials, 'Net Clinic OPD Margin calculated correctly');

  } catch (err) {
    console.error('Fatal test execution error:', err);
    failed++;
  }

  console.log('\n===============================================================');
  console.log(`  PHASE 8 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) process.exit(1);
}

runTests();
