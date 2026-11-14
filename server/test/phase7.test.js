const { server } = require('../src/server');
const { query } = require('../src/config/db');

async function runPhase7Tests() {
  console.log('================================================================');
  console.log('  SMART CLINIC OS — PHASE 7 AUTOMATED TEST SUITE');
  console.log('  Smart Automation, Queue Intelligence & Google Maps Departure');
  console.log('================================================================\n');

  const testPort = 5003;
  await new Promise(r => server.listen(testPort, '127.0.0.1', r));
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
    // 1. Fetch clinic & user tokens
    const clinicRes = await query("SELECT id FROM clinics WHERE slug = 'careplus-indiranagar'");
    const clinicBRes = await query("SELECT id FROM clinics WHERE slug = 'apex-heart-koramangala'");
    const clinicAId = clinicRes.rows[0].id;
    const clinicBId = clinicBRes.rows[0].id;

    // Helper functions
    async function apiPost(endpoint, body, token = null, clinicId = null) {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (clinicId) headers['X-Clinic-ID'] = clinicId;
      const res = await fetch(`${baseUrl}${endpoint}`, { method: 'POST', headers, body: JSON.stringify(body) });
      return { status: res.status, json: await res.json() };
    }

    async function apiGet(endpoint, token = null, clinicId = null) {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (clinicId) headers['X-Clinic-ID'] = clinicId;
      const res = await fetch(`${baseUrl}${endpoint}`, { headers });
      return { status: res.status, json: await res.json() };
    }

    async function apiPut(endpoint, body, token = null, clinicId = null) {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (clinicId) headers['X-Clinic-ID'] = clinicId;
      const res = await fetch(`${baseUrl}${endpoint}`, { method: 'PUT', headers, body: JSON.stringify(body) });
      return { status: res.status, json: await res.json() };
    }

    // Login Owner, Doctor, Receptionist
    const ownerLogin = await apiPost('/auth/login-password', { identifier: 'owner@careplus.in', password: 'Password@123' });
    const ownerToken = ownerLogin.json.data?.token;

    const docLogin = await apiPost('/auth/login-password', { identifier: 'doctor@careplus.in', password: 'Password@123' });
    const docToken = docLogin.json.data?.token;

    const recLogin = await apiPost('/auth/login-password', { identifier: 'reception@careplus.in', password: 'Password@123' });
    const recToken = recLogin.json.data?.token;

    assert('1. Authentication established for test actors', !!ownerToken && !!docToken && !!recToken);

    // Get a test patient & doctor in Clinic A
    const pRes = await query('SELECT * FROM patients WHERE clinic_id = $1 LIMIT 1', [clinicAId]);
    const patientA = pRes.rows[0];

    const dRes = await query('SELECT * FROM doctor_profiles WHERE clinic_id = $1 LIMIT 1', [clinicAId]);
    const doctorProfileA = dRes.rows[0];

    // Create a new walk-in / appointment for today
    const walkinRes = await apiPost('/clinic/appointments/walkin', {
      patient_id: patientA.id,
      doctor_id: doctorProfileA.id,
      priority_flag: false
    }, recToken, clinicAId);

    const apptId = walkinRes.json.data?.appointment?.id;
    const queueEntryId = walkinRes.json.data?.queue_entry?.id;
    assert('2. Queue entry created for test patient', walkinRes.status === 201 && !!queueEntryId);

    // Test 1: Smart Queue Intelligence - Calculation of dynamic waiting time & turn
    const QueueIntelligenceService = require('../src/services/queueIntelligence');
    const qEst = await QueueIntelligenceService.calculateEntryEstimate(queueEntryId, clinicAId);
    assert(
      '3. Queue Intelligence: Expected turn and wait time calculated',
      !!qEst.expected_turn_at && qEst.estimated_waiting_minutes >= 0,
      `Turn: ${qEst.expected_turn_at}, Wait: ${qEst.estimated_waiting_minutes}m, Confidence: ${qEst.estimation_confidence}`
    );

    assert(
      '4. Queue Intelligence: Confidence score is valid enum (HIGH, MEDIUM, LOW)',
      ['HIGH', 'MEDIUM', 'LOW'].includes(qEst.estimation_confidence)
    );

    // Test 2: Traffic-Aware Departure Recommendation
    // Origin: Koramangala (12.9352, 77.6245), Destination: Indiranagar Clinic (12.9784, 77.6408)
    const TrafficIntelligenceService = require('../src/services/trafficIntelligence');
    const depRec = await TrafficIntelligenceService.calculateDepartureRecommendation({
      patientId: patientA.id,
      appointmentId: apptId,
      queueEntryId: queueEntryId,
      clinicId: clinicAId,
      originLat: 12.9352,
      originLng: 77.6245,
      originAddress: 'Koramangala 4th Block',
      expectedTurnAt: qEst.expected_turn_at,
      arrivalBufferMinutes: 10,
      queueConfidence: qEst.estimation_confidence
    });

    assert(
      '5. Traffic Intelligence: Travel duration & distance computed',
      depRec.estimated_travel_seconds > 0 && depRec.distance_meters > 0,
      `Distance: ${depRec.distance_text}, Duration: ${depRec.estimated_travel_text}`
    );

    // Verify Formula: recommended_departure_at = expected_turn_at - estimated_travel_seconds - arrival_buffer_seconds
    const turnMs = new Date(depRec.expected_turn_at).getTime();
    const depMs = new Date(depRec.recommended_departure_at).getTime();
    const expectedDiffSec = Math.round((turnMs - depMs) / 1000);
    const requiredDiffSec = depRec.estimated_travel_seconds + (10 * 60);

    assert(
      '6. Traffic Intelligence: Formula holds (turn - travel - buffer)',
      expectedDiffSec === requiredDiffSec,
      `Diff: ${expectedDiffSec}s === Expected: ${requiredDiffSec}s`
    );

    // Test 3: Departure Recommendation API Endpoint (Patient Facing)
    const depApiRes = await apiGet(`/patient/traffic/departure-recommendation/${apptId}?origin_lat=12.9352&origin_lng=77.6245&arrival_buffer_minutes=10`, docToken);
    assert(
      '7. API: GET /patient/traffic/departure-recommendation/:id',
      depApiRes.status === 200 && depApiRes.json.data?.recommended_departure_at !== undefined,
      `Recommended departure: ${depApiRes.json.data?.recommended_departure_at}`
    );

    // Test 4: Update Patient Origin Endpoint
    const updateOriginRes = await apiPost('/patient/traffic/update-origin', {
      appointment_id: apptId,
      origin_lat: 12.9716, // Whitefield
      origin_lng: 77.7500,
      origin_address: 'ITPL Whitefield',
      arrival_buffer_minutes: 15
    }, docToken);

    assert(
      '8. API: POST /patient/traffic/update-origin updates travel route',
      updateOriginRes.status === 200 && updateOriginRes.json.data?.arrival_buffer_minutes === 15
    );

    // Test 5: Route Snapshot Cache verification (Subsequent call should hit cache)
    const cachedTravel = await TrafficIntelligenceService.getTravelDuration(12.9716, 77.7500, 12.9784, 77.6408);
    assert(
      '9. Traffic Cache: Request deduplication and snapshot caching active',
      cachedTravel.is_cached === true,
      `Source: ${cachedTravel.source}`
    );

    // Test 6: Automation Settings API (Clinic Owner)
    const getSettings = await apiGet('/clinic/automation/settings', ownerToken, clinicAId);
    assert('10. API: GET /clinic/automation/settings', getSettings.status === 200 && getSettings.json.data?.reminders_enabled !== undefined);

    const updateSettings = await apiPut('/clinic/automation/settings', {
      reminders_enabled: true,
      reminder_intervals_hours: [24, 2, 0],
      delay_threshold_minutes: 20,
      default_arrival_buffer_minutes: 15
    }, ownerToken, clinicAId);
    assert(
      '11. API: PUT /clinic/automation/settings updates delay and buffer rules',
      updateSettings.status === 200 && updateSettings.json.data?.delay_threshold_minutes === 20
    );

    // Test 7: Doctor Delay Alert & Logging
    const delayRes = await apiPost('/clinic/queue/delay-alert', {
      doctor_id: doctorProfileA.id,
      delay_minutes: 25,
      reason: 'Emergency post-op clinical complication'
    }, docToken, clinicAId);
    assert(
      '12. API: POST /clinic/queue/delay-alert logs operational delay',
      delayRes.status === 201 && delayRes.json.data?.delay_minutes === 25
    );

    // Test 8: Patient Notification Preferences (GET & PUT)
    const getPref = await apiGet('/patient/notifications/preferences', docToken);
    assert('13. API: GET /patient/notifications/preferences', getPref.status === 200 && getPref.json.data?.appointment_reminders === true);

    const updatePref = await apiPut('/patient/notifications/preferences', {
      departure_recommendations: true,
      whatsapp_enabled: true
    }, docToken);
    assert('14. API: PUT /patient/notifications/preferences', updatePref.status === 200 && updatePref.json.data?.whatsapp_enabled === true);

    // Test 9: Appointment Reminders & Idempotency
    const AutomationService = require('../src/services/automationService');
    const jobLog1 = await AutomationService.logJob({
      jobType: 'APPOINTMENT_REMINDER_2H',
      clinicId: clinicAId,
      appointmentId: apptId,
      idempotencyKey: `reminder:appt:${apptId}:2h`,
      payload: { test: true }
    });
    assert('15. Automation: Log job executed and recorded', jobLog1.duplicate === false);

    // Duplicate attempt with same idempotency key must be prevented
    const jobLog2 = await AutomationService.logJob({
      jobType: 'APPOINTMENT_REMINDER_2H',
      clinicId: clinicAId,
      appointmentId: apptId,
      idempotencyKey: `reminder:appt:${apptId}:2h`,
      payload: { test: true }
    });
    assert('16. Automation Idempotency: Duplicate reminder prevented', jobLog2.duplicate === true);

    // Test 10: Multi-Tenant Isolation
    // Owner of Clinic A cannot access or modify Clinic B automation settings
    const crossTenantSettings = await apiGet('/clinic/automation/settings', ownerToken, clinicBId);
    assert(
      '17. Multi-Tenant Security: Clinic A cannot access Clinic B automation settings (403)',
      crossTenantSettings.status === 403
    );

    // Owner of Clinic A cannot post delay alerts in Clinic B
    const crossTenantDelay = await apiPost('/clinic/queue/delay-alert', {
      doctor_id: doctorProfileA.id,
      delay_minutes: 15
    }, ownerToken, clinicBId);
    assert(
      '18. Multi-Tenant Security: Cross-tenant delay alerts rejected (403)',
      crossTenantDelay.status === 403
    );

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    server.close();
    console.log('\n================================================================');
    const passed = results.filter(r => r.pass).length;
    console.log(`PHASE 7 TEST SUMMARY: ${passed}/${results.length} PASSED`);
    console.log('================================================================');
    process.exit(passed === results.length ? 0 : 1);
  }
}

runPhase7Tests();

