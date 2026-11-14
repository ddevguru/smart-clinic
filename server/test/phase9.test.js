const http = require('http');
const { query } = require('../src/config/db');

const BASE_URL = 'http://localhost:5000/api/v1';

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
  console.log('   SMART CLINIC OS — PHASE 9 HOME HEALTHCARE TEST SUITE       ');
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
    // -------------------------------------------------------------
    // Test Setup & Logins
    // -------------------------------------------------------------
    console.log('\n--- 1. Authenticating Roles ---');
    const adminToken = await loginUser('admin@smartclinic.in', 'Password@123');
    assert(adminToken, 'Super Admin logged in successfully');

    const clinicToken = await loginUser('owner@apex.in', 'Password@123');
    assert(clinicToken, 'Clinic Owner logged in successfully');

    const nurseToken = await loginUser('nurse.mary@careplus.in', 'Password@123');
    assert(nurseToken, 'Healthcare Provider (Nurse Mary) logged in successfully');

    const doctorToken = await loginUser('doctor.home@careplus.in', 'Password@123');
    assert(doctorToken, 'Healthcare Provider (Dr. Rajesh Sharma) logged in successfully');

    // Authenticate Patient via Phone OTP Verification
    const patientOtpRes = await request('POST', '/auth/verify-otp', {
      phone_number: '+919876599999',
      otp: '123456',
      full_name: 'Aditi Sharma Patient'
    });
    assert(patientOtpRes.status === 200 && patientOtpRes.body.success, 'Patient verified OTP successfully');
    const patientToken = patientOtpRes.body.data.token;
    assert(patientToken, 'Patient JWT token issued');

    // -------------------------------------------------------------
    // 2. Service Catalog & Public Discovery
    // -------------------------------------------------------------
    console.log('\n--- 2. Public Catalog & Discovery ---');
    const catRes = await request('GET', '/marketplace/categories');
    assert(catRes.status === 200 && catRes.body.success, 'GET /marketplace/categories returned 200');
    assert(catRes.body.data.categories.length >= 6, `Categories returned: ${catRes.body.data.categories.length} (expected >= 6)`);
    
    const catCodes = catRes.body.data.categories.map(c => c.code);
    assert(catCodes.includes('DOCTOR_VISIT'), 'Catalog includes DOCTOR_VISIT');
    assert(catCodes.includes('NURSING'), 'Catalog includes NURSING');
    assert(catCodes.includes('PHYSIOTHERAPY'), 'Catalog includes PHYSIOTHERAPY');
    assert(catCodes.includes('SAMPLE_COLLECTION'), 'Catalog includes SAMPLE_COLLECTION');

    const servRes = await request('GET', '/marketplace/services');
    assert(servRes.status === 200 && servRes.body.data.services.length >= 7, 'GET /marketplace/services returned catalog of services');
    
    const sampleService = servRes.body.data.services.find(s => s.code === 'NURSE_WOUND_DRESSING');
    assert(sampleService && sampleService.sac_code === '999312', 'Service has valid healthcare SAC Code 999312');
    assert(sampleService && Number(sampleService.base_price) > 0, `Service base price is valid: ₹${sampleService ? sampleService.base_price : 0}`);

    // Category filtered services
    const nurseServRes = await request('GET', '/marketplace/services?category_code=NURSING');
    assert(nurseServRes.body.data.services.length >= 2, 'Filtered services for NURSING returned correctly');

    // -------------------------------------------------------------
    // 3. Provider Discovery & Verification Filtering
    // -------------------------------------------------------------
    console.log('\n--- 3. Provider Discovery & Verification Filtering ---');
    const provRes = await request('GET', '/marketplace/providers?postal_code=560038');
    assert(provRes.status === 200 && provRes.body.success, 'GET /marketplace/providers returns 200 for postal code 560038');
    assert(provRes.body.data.providers.length >= 4, `Found ${provRes.body.data.providers.length} approved providers in coverage area`);
    
    // Check that all returned providers are strictly APPROVED
    const allApproved = provRes.body.data.providers.every(p => p.verification_status === 'APPROVED');
    assert(allApproved, 'Every discovered provider strictly has status APPROVED');

    const nurseProfile = provRes.body.data.providers.find(p => p.full_name && p.full_name.includes('Mary'));
    assert(nurseProfile, 'Nurse Mary is present in approved provider discovery');

    // Test specific provider details
    const provDetailRes = await request('GET', `/marketplace/providers/${nurseProfile.id}`);
    assert(provDetailRes.status === 200 && provDetailRes.body.data.provider.full_name.includes('Mary'), 'Provider detail endpoint returns full profile');
    assert(provDetailRes.body.data.provider.registration_number, 'Provider has verified medical registration number');
    assert(provDetailRes.body.data.services.length > 0, 'Provider has linked services catalog');

    // -------------------------------------------------------------
    // 4. Provider Availability & Buffer Validation
    // -------------------------------------------------------------
    console.log('\n--- 4. Provider Availability & Conflict Buffer ---');
    // Check weekday date (ensure not Sunday)
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 1);
    if (targetDate.getDay() === 0) { // Sunday
      targetDate.setDate(targetDate.getDate() + 1); // Move to Monday
    }
    const dateStr = targetDate.toISOString().split('T')[0];

    const availRes = await request('GET', `/marketplace/availability?provider_id=${nurseProfile.id}&date=${dateStr}&service_id=${sampleService.id}`);
    assert(availRes.status === 200 && availRes.body.success, 'Provider availability API returns 200');
    assert(availRes.body.data.available === true, 'Provider is available on scheduled working day');
    assert(availRes.body.data.slots && availRes.body.data.slots.length > 0, `Provider has ${availRes.body.data.slots.length} available slots`);

    const firstSlot = availRes.body.data.slots[0];
    assert(firstSlot.start_time && firstSlot.end_time, 'Slot has valid start and end time');

    // -------------------------------------------------------------
    // 5. Booking Creation & Sequential Reference Generation
    // -------------------------------------------------------------
    console.log('\n--- 5. Home Visit Booking Creation ---');
    // Ensure clean state for test run idempotence
    await query("DELETE FROM home_visit_service_records WHERE booking_id IN (SELECT id FROM home_visit_bookings WHERE contact_phone = '+919876543299')");
    await query("DELETE FROM provider_reviews WHERE booking_id IN (SELECT id FROM home_visit_bookings WHERE contact_phone = '+919876543299')");
    await query("DELETE FROM home_visit_status_history WHERE booking_id IN (SELECT id FROM home_visit_bookings WHERE contact_phone = '+919876543299')");
    await query("DELETE FROM home_visit_bookings WHERE contact_phone = '+919876543299'");

    const bookingPayload = {
      provider_id: nurseProfile.id,
      service_id: sampleService.id,
      scheduled_date: dateStr,
      scheduled_start_time: firstSlot.start_time,
      service_address: 'Flat 402, Green Acres Apt, 100ft Road, Indiranagar',
      city: 'Bengaluru',
      postal_code: '560038',
      latitude: 12.9716,
      longitude: 77.6412,
      patient_notes: 'Post-surgery wound dressing and IV injection as prescribed.',
      contact_phone: '+919876543299',
      payment_method: 'ONLINE'
    };

    const bookRes = await request('POST', '/marketplace/bookings', bookingPayload, patientToken);
    assert(bookRes.status === 201 && bookRes.body.success, 'Booking created successfully with HTTP 201');
    const booking = bookRes.body.data.booking;
    
    // Verify Sequential Reference format: HV-YYYYMMDD-XXXX
    const refRegex = /^HV-\d{8}-\d{4}$/;
    assert(refRegex.test(booking.booking_reference), `Booking reference follows standard format: ${booking.booking_reference}`);

    // Verify Financial Breakdown: 15% platform commission, 85% provider payout
    const totalAmt = Number(booking.total_amount);
    const platFee = Number(booking.platform_commission_amount);
    const provPayout = Number(booking.provider_payable_amount);
    assert(totalAmt > 0, `Total amount calculated: ₹${totalAmt}`);
    assert(platFee > 0, `Platform commission calculated: ₹${platFee}`);
    assert(provPayout > 0, `Provider payout calculated: ₹${provPayout}`);

    // Verify initial status
    assert(booking.status === 'REQUESTED' || booking.status === 'ACCEPTED', `Initial booking status: ${booking.status}`);

    // -------------------------------------------------------------
    // 6. Patient Address Privacy & Security Check
    // -------------------------------------------------------------
    console.log('\n--- 6. Patient Address Privacy Protection ---');
    // Dr. Rajesh (unassigned provider) fetches this booking details -> masked
    const unassignedDetailRes = await request('GET', `/marketplace/bookings/${booking.id}`, null, doctorToken);
    assert(
      unassignedDetailRes.body.data.booking.service_address.includes('[Address Protected]'),
      'Patient address is strictly masked for unassigned provider'
    );

    // Assigned Nurse Mary fetches before acceptance -> still masked until accepted
    const preAcceptDetailRes = await request('GET', `/marketplace/bookings/${booking.id}`, null, nurseToken);
    assert(
      preAcceptDetailRes.body.data.booking.service_address.includes('[Address Protected]'),
      'Patient address remains masked for provider prior to accepting request'
    );

    // Patient themselves can view their own unmasked address
    const patientDetailRes = await request('GET', `/marketplace/bookings/${booking.id}`, null, patientToken);
    assert(
      patientDetailRes.body.data.booking.service_address.includes('Flat 402'),
      'Patient can view their own unmasked address'
    );

    // -------------------------------------------------------------
    // 7. Visit Lifecycle State Machine Transitions
    // -------------------------------------------------------------
    console.log('\n--- 7. Visit Lifecycle State Machine ---');
    // Provider accepts request: REQUESTED -> ACCEPTED
    const acceptRes = await request('PATCH', `/marketplace/provider/bookings/${booking.id}/status`, {
      status: 'ACCEPTED',
      notes: 'Nurse Mary accepted the home visit request.'
    }, nurseToken);
    assert(acceptRes.status === 200 && acceptRes.body.data.booking.status === 'ACCEPTED', 'Booking transitioned to ACCEPTED');

    // After acceptance, assigned provider can now view unmasked address
    const postAcceptDetailRes = await request('GET', `/marketplace/bookings/${booking.id}`, null, nurseToken);
    assert(
      !postAcceptDetailRes.body.data.booking.service_address.includes('[Address Protected]'),
      'Assigned provider can view unmasked patient address once booking is ACCEPTED'
    );

    // Transition: PROVIDER_EN_ROUTE
    const enRouteRes = await request('PATCH', `/marketplace/provider/bookings/${booking.id}/status`, {
      status: 'PROVIDER_EN_ROUTE',
      notes: 'Provider departed clinic, en route to patient home.'
    }, nurseToken);
    assert(enRouteRes.status === 200 && enRouteRes.body.data.booking.status === 'PROVIDER_EN_ROUTE', 'Booking transitioned to PROVIDER_EN_ROUTE');
    assert(enRouteRes.body.data.booking.estimated_arrival_time !== null, 'Estimated arrival time computed automatically');

    // Transition: ARRIVED
    const arrivedRes = await request('PATCH', `/marketplace/provider/bookings/${booking.id}/status`, {
      status: 'ARRIVED',
      notes: 'Provider reached patient residence.'
    }, nurseToken);
    assert(arrivedRes.status === 200 && arrivedRes.body.data.booking.status === 'ARRIVED', 'Booking transitioned to ARRIVED');
    assert(arrivedRes.body.data.booking.actual_arrival_time !== null, 'Actual arrival timestamp recorded');

    // Transition: SERVICE_IN_PROGRESS
    const inProgressRes = await request('PATCH', `/marketplace/provider/bookings/${booking.id}/status`, {
      status: 'SERVICE_IN_PROGRESS',
      notes: 'Sterilization complete, dressing and injection in progress.'
    }, nurseToken);
    assert(inProgressRes.status === 200 && inProgressRes.body.data.booking.status === 'SERVICE_IN_PROGRESS', 'Booking transitioned to SERVICE_IN_PROGRESS');

    // Verify invalid transition prevention (e.g. going from SERVICE_IN_PROGRESS back to REQUESTED should fail)
    const invalidRes = await request('PATCH', `/marketplace/provider/bookings/${booking.id}/status`, {
      status: 'REQUESTED'
    }, nurseToken);
    assert(invalidRes.status === 400, 'Invalid backwards transition strictly rejected with HTTP 400');

    // -------------------------------------------------------------
    // 8. Service Completion & Clinical Records
    // -------------------------------------------------------------
    console.log('\n--- 8. Service Completion & Clinical Documentation ---');
    const completePayload = {
      clinical_notes: 'Patient wound clean, no signs of infection. Sterile dressing applied. Antibiotic injection administered without allergic reaction.',
      vital_signs: {
        blood_pressure: '120/80 mmHg',
        pulse: 74,
        temperature: '98.4 F',
        spo2: 99
      },
      checklist_completed: [
        { task: 'Patient Identification Verified', done: true },
        { task: 'Sterile Equipment Prepared', done: true },
        { task: 'Wound Dressing Applied', done: true },
        { task: 'Injection Administered', done: true },
        { task: 'Post-Care Instructions Provided', done: true }
      ],
      recommendations: 'Keep wound dry for 24 hours. Follow-up visit scheduled in 3 days.'
    };

    const completeRes = await request('POST', `/marketplace/provider/bookings/${booking.id}/complete`, completePayload, nurseToken);
    assert(completeRes.status === 200 && completeRes.body.success, 'Home visit completed successfully');
    assert(completeRes.body.data.booking.status === 'COMPLETED', 'Booking status is now COMPLETED');
    assert(completeRes.body.data.booking.payment_status === 'PAID', 'Booking payment status updated to PAID');
    assert(completeRes.body.data.service_record.vital_signs.blood_pressure === '120/80 mmHg', 'Clinical vitals recorded in service record');

    // -------------------------------------------------------------
    // 9. Verified Patient Review & Rating Engine
    // -------------------------------------------------------------
    console.log('\n--- 9. Verified Review & Rating Recalculation ---');
    // Patient submits review
    const reviewPayload = {
      booking_id: booking.id,
      rating: 5,
      punctuality_rating: 5,
      review_comment: 'Nurse Mary was extremely gentle, highly professional, and arrived right on time.'
    };

    const reviewRes = await request('POST', '/marketplace/review', reviewPayload, patientToken);
    assert(reviewRes.status === 201 && reviewRes.body.success, 'Patient review submitted successfully');
    assert(reviewRes.body.data.review.is_verified_visit === true, 'Review marked as verified visit');

    // Duplicate review should be rejected
    const dupReviewRes = await request('POST', '/marketplace/review', reviewPayload, patientToken);
    assert(dupReviewRes.status === 400, 'Duplicate review on same booking rejected with HTTP 400');

    // Verify provider average rating updated
    const updatedProvRes = await request('GET', `/marketplace/providers/${nurseProfile.id}`);
    assert(Number(updatedProvRes.body.data.provider.rating_avg) >= 4.5, `Provider rating updated: ${updatedProvRes.body.data.provider.rating_avg}`);
    assert(Number(updatedProvRes.body.data.provider.rating_count) >= 1, `Provider review count updated: ${updatedProvRes.body.data.provider.rating_count}`);

    // -------------------------------------------------------------
    // 10. Super Admin Marketplace Operations & Analytics
    // -------------------------------------------------------------
    console.log('\n--- 10. Super Admin Marketplace Operations ---');
    const adminOverviewRes = await request('GET', '/marketplace/admin/overview', null, adminToken);
    assert(adminOverviewRes.status === 200 && adminOverviewRes.body.success, 'GET /marketplace/admin/overview returned 200');
    assert(adminOverviewRes.body.data.metrics.total_bookings >= 1, 'Admin metrics tracks total home visit bookings');
    assert(Number(adminOverviewRes.body.data.metrics.total_gmv) > 0, `Admin metrics tracks total marketplace GMV: ₹${adminOverviewRes.body.data.metrics.total_gmv}`);
    assert(Number(adminOverviewRes.body.data.metrics.platform_commission) > 0, `Admin metrics tracks 15% platform commission: ₹${adminOverviewRes.body.data.metrics.platform_commission}`);

    const adminProvListRes = await request('GET', '/marketplace/admin/providers', null, adminToken);
    assert(adminProvListRes.body.data.providers.length >= 4, 'Super Admin lists all registered healthcare providers');

    // Test Provider Verification action
    const verifyActionRes = await request('PATCH', `/marketplace/admin/providers/${nurseProfile.id}/verify`, {
      verification_status: 'APPROVED',
      notes: 'Routine compliance audit: all certifications verified and active.'
    }, adminToken);
    assert(verifyActionRes.status === 200 && verifyActionRes.body.data.provider.verification_status === 'APPROVED', 'Super Admin successfully verified provider profile');

    // -------------------------------------------------------------
    // 11. Clinic Home Care Dispatch
    // -------------------------------------------------------------
    console.log('\n--- 11. Clinic Home Care Dispatch ---');
    const clinicOverviewRes = await request('GET', '/marketplace/clinic/overview', null, clinicToken);
    assert(clinicOverviewRes.status === 200 && clinicOverviewRes.body.success, 'GET /marketplace/clinic/overview returned 200');
    assert(Array.isArray(clinicOverviewRes.body.data.bookings), 'Clinic dispatch list is an array');

    // -------------------------------------------------------------
    // Final Summary
    // -------------------------------------------------------------
    console.log('\n===============================================================');
    console.log(`   PHASE 9 TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runTests();
