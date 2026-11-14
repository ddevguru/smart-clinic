const { server } = require('../src/server');
const { query } = require('../src/config/db');

async function runTests() {
  console.log('====================================================');
  console.log('  SMART CLINIC OS — 12/12 MANUAL TESTING TRACKER TEST');
  console.log('====================================================\n');

  // Start server on ephemeral port for test
  const testPort = 5001;
  await new Promise((resolve) => server.listen(testPort, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${testPort}/api/v1`;

  const results = [];
  function assert(name, condition, extra = '') {
    if (condition) {
      console.log(`[PASS] ${name} ${extra}`);
      results.push({ name, pass: true });
    } else {
      console.error(`[FAIL] ${name} ${extra}`);
      results.push({ name, pass: false, extra });
    }
  }

  try {
    // Fetch seeded clinic IDs
    const clinicARes = await query("SELECT id FROM clinics WHERE slug = 'careplus-indiranagar'");
    const clinicBRes = await query("SELECT id FROM clinics WHERE slug = 'apex-heart-koramangala'");
    const clinicAId = clinicARes.rows[0].id;
    const clinicBId = clinicBRes.rows[0].id;

    // Helper for fetch
    async function apiPost(endpoint, body, token = null, clinicId = null) {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (clinicId) headers['X-Clinic-ID'] = clinicId;
      const res = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
      return { status: res.status, json: await res.json() };
    }

    async function apiGet(endpoint, token = null, clinicId = null) {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (clinicId) headers['X-Clinic-ID'] = clinicId;
      const res = await fetch(`${baseUrl}${endpoint}`, { headers });
      return { status: res.status, json: await res.json() };
    }

    async function apiPatch(endpoint, body, token = null, clinicId = null) {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (clinicId) headers['X-Clinic-ID'] = clinicId;
      const res = await fetch(`${baseUrl}${endpoint}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body)
      });
      return { status: res.status, json: await res.json() };
    }

    // 1. Clinic Owner login and dashboard
    const ownerLogin = await apiPost('/auth/login-password', {
      identifier: 'owner@careplus.in',
      password: 'Password@123'
    });
    const ownerToken = ownerLogin.json.data?.token;
    assert('1. Clinic Owner login', ownerLogin.status === 200 && !!ownerToken);

    const ownerDash = await apiGet('/clinic/dashboard/owner', ownerToken, clinicAId);
    assert(
      '1. Clinic Owner dashboard',
      ownerDash.status === 200 && ownerDash.json.data?.metrics?.total_branches >= 1,
      `Branches: ${ownerDash.json.data?.metrics?.total_branches}`
    );

    // 2. Receptionist login and patient registration
    const recLogin = await apiPost('/auth/login-password', {
      identifier: 'reception@careplus.in',
      password: 'Password@123'
    });
    const recToken = recLogin.json.data?.token;
    assert('2. Receptionist login', recLogin.status === 200 && !!recToken);

    const testMobile = `+9198${Math.floor(10000000 + Math.random() * 90000000)}`;
    const regPatient = await apiPost('/clinic/patients', {
      full_name: 'Aditi Sharma',
      phone_number: testMobile,
      date_of_birth: '1992-04-12',
      gender: 'FEMALE',
      blood_group: 'B+',
      allergies: 'Penicillin',
      medical_history_summary: 'Asthma since childhood'
    }, recToken, clinicAId);
    const newPatientId = regPatient.json.data?.patient?.id;
    assert('2. Receptionist patient registration', regPatient.status === 201 && !!newPatientId);

    // 3. Search existing patient by mobile number
    const searchPatient = await apiGet(`/clinic/patients?phone_number=${testMobile}`, recToken, clinicAId);
    assert(
      '3. Search existing patient by mobile number',
      searchPatient.status === 200 && searchPatient.json.data?.patients?.length > 0 && searchPatient.json.data.patients[0].phone_number === testMobile
    );

    // Get doctor ID for Clinic A
    const doctorsRes = await apiGet('/clinic/doctors', recToken, clinicAId);
    const doctorProfileId = doctorsRes.json.data?.doctors[0]?.id;

    // 4. Create appointment for a doctor
    const todayStr = new Date().toISOString().split('T')[0];
    const createAppt = await apiPost('/clinic/appointments', {
      patient_id: newPatientId,
      doctor_id: doctorProfileId,
      appointment_date: todayStr,
      appointment_time: '11:30',
      appointment_source: 'DESK',
      consultation_fee: 500,
      appointment_notes: 'Regular checkup'
    }, recToken, clinicAId);
    const apptId = createAppt.json.data?.appointment?.id;
    assert('4. Create appointment for a doctor', createAppt.status === 201 && !!apptId);

    // 5. Register a walk-in patient
    const walkinMobile = `+9197${Math.floor(10000000 + Math.random() * 90000000)}`;
    const walkinRes = await apiPost('/clinic/appointments/walkin', {
      full_name: 'Rajesh Kumar Walkin',
      phone_number: walkinMobile,
      gender: 'MALE',
      doctor_id: doctorProfileId,
      priority_flag: false
    }, recToken, clinicAId);
    const walkinToken = walkinRes.json.data?.token_number;
    assert('5. Register a walk-in patient', walkinRes.status === 201 && !!walkinToken, `Token: ${walkinToken}`);

    // 6. Doctor views assigned appointments
    const docLogin = await apiPost('/auth/login-password', {
      identifier: 'doctor@careplus.in',
      password: 'Password@123'
    });
    const docToken = docLogin.json.data?.token;
    assert('6. Doctor login', docLogin.status === 200 && !!docToken);

    const docDash = await apiGet('/clinic/dashboard/doctor', docToken, clinicAId);
    assert(
      '6. Doctor views assigned appointments',
      docDash.status === 200 && docDash.json.data?.today_appointments?.length > 0,
      `Assigned count: ${docDash.json.data?.today_appointments?.length}`
    );

    // 7. Doctor accesses authorized patient information
    const patientDetail = await apiGet(`/clinic/patients/${newPatientId}`, docToken, clinicAId);
    assert(
      '7. Doctor accesses authorized patient information',
      patientDetail.status === 200 && patientDetail.json.data?.patient?.full_name === 'Aditi Sharma' && patientDetail.json.data?.patient?.allergies === 'Penicillin'
    );

    // 8. Create and update branch details
    const createBranch = await apiPost('/clinic/branches', {
      name: 'CarePlus Whitefield Diagnostic Hub',
      phone: '+919876543299',
      city: 'Bengaluru',
      state: 'Karnataka'
    }, ownerToken, clinicAId);
    const newBranchId = createBranch.json.data?.branch?.id;
    assert('8. Create branch details', createBranch.status === 201 && !!newBranchId);

    const updateBranch = await apiPatch(`/clinic/branches/${newBranchId}`, {
      operating_status: 'OPERATIONAL',
      address: 'ITPL Main Road, Whitefield'
    }, ownerToken, clinicAId);
    assert('8. Update branch details', updateBranch.status === 200 && updateBranch.json.data?.branch?.operating_status === 'OPERATIONAL');

    // 9. Configure doctor and clinic schedules
    const configSchedule = await apiPost(`/clinic/schedules/doctor/${doctorProfileId}`, {
      branch_id: newBranchId,
      day_of_week: 6, // Saturday
      start_time: '14:00',
      end_time: '18:00',
      is_available: true
    }, ownerToken, clinicAId);
    assert('9. Configure doctor and clinic schedules', configSchedule.status === 201 && configSchedule.json.data?.schedule?.start_time === '14:00');

    // 10. Record payment and generate receipt
    const recordPayment = await apiPost('/clinic/billing/record', {
      appointment_id: apptId,
      patient_id: newPatientId,
      amount: 500,
      payment_method: 'UPI',
      payment_reference: 'UPI-REF-992384'
    }, recToken, clinicAId);
    const receiptNumber = recordPayment.json.data?.receipt?.receipt_number;
    assert('10. Record payment and generate receipt', recordPayment.status === 201 && !!receiptNumber, `Receipt: ${receiptNumber}`);

    // 11. Verify role-based permissions (Receptionist cannot delete or create branches, Doctor cannot access owner financials)
    const unauthorizedBranchCreate = await apiPost('/clinic/branches', {
      name: 'Unauthorized Branch Attempt',
      city: 'Bengaluru'
    }, recToken, clinicAId);
    assert(
      '11. Verify role-based permissions (Receptionist cannot create branches)',
      unauthorizedBranchCreate.status === 403
    );

    // 12. Verify Clinic A cannot access Clinic B data (Multi-tenant isolation)
    const clinicACrossTenantAttempt = await apiGet('/clinic/dashboard/owner', ownerToken, clinicBId);
    assert(
      '12. Verify Clinic A cannot access Clinic B data',
      clinicACrossTenantAttempt.status === 403,
      `Received status: ${clinicACrossTenantAttempt.status}`
    );

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    server.close();
    console.log('\n====================================================');
    const passed = results.filter(r => r.pass).length;
    console.log(`TEST SUMMARY: ${passed}/${results.length} PASSED`);
    console.log('====================================================');
    process.exit(passed === results.length ? 0 : 1);
  }
}

runTests();

