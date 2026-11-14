const http = require('http');
const crypto = require('crypto');
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
  console.log('   SMART CLINIC OS — PHASE 10 HEALTHCARE ECOSYSTEM TEST SUITE ');
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
    // 1. Role Authentications
    // -------------------------------------------------------------
    console.log('\n--- 1. Authenticating Roles ---');
    const adminToken = await loginUser('admin@smartclinic.in', 'Password@123');
    assert(adminToken, 'Super Admin logged in successfully');

    const clinicToken = await loginUser('owner@careplus.in', 'Password@123');
    assert(clinicToken, 'Clinic Owner logged in successfully');

    const doctorToken = await loginUser('doctor@careplus.in', 'Password@123');
    assert(doctorToken, 'Doctor (Dr. Rajesh / CarePlus) logged in successfully');

    // Patient OTP Login
    const patientOtpRes = await request('POST', '/auth/verify-otp', {
      phone_number: '+919876599999',
      otp: '123456',
      full_name: 'Aditi Sharma Patient'
    });
    assert(patientOtpRes.status === 200 && patientOtpRes.body.success, 'Patient verified OTP successfully');
    const patientToken = patientOtpRes.body.data.token;
    assert(patientToken, 'Patient JWT token issued');

    // Resolve IDs
    const clinicRes = await query('SELECT id FROM clinics LIMIT 1');
    const clinicId = clinicRes.rows[0].id;

    const patientRes = await query('SELECT id FROM patients WHERE phone_number = $1 LIMIT 1', ['+919876599999']);
    const patientId = patientRes.rows[0].id;

    const docRes = await query('SELECT id FROM doctor_profiles LIMIT 1');
    const doctorProfileId = docRes.rows[0].id;

    const apptRes = await query('SELECT id, branch_id FROM appointments LIMIT 1');
    const appointmentId = apptRes.rows[0].id;
    const branchId = apptRes.rows[0].branch_id;

    let prescriptionId;
    const rxRes = await query('SELECT id FROM prescriptions LIMIT 1');
    if (rxRes.rows.length > 0) {
      prescriptionId = rxRes.rows[0].id;
    } else {
      const { v4: uuidv4 } = require('uuid');
      const newRxId = uuidv4();
      const insRx = await query(`
        INSERT INTO prescriptions (
          id, clinic_id, branch_id, patient_id, doctor_id, appointment_id, prescription_number, status, finalized_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'RX-202611-0001', 'FINALIZED', NOW(), NOW(), NOW())
        RETURNING id
      `, [newRxId, clinicId, branchId, patientId, doctorProfileId, appointmentId]);
      prescriptionId = insRx.rows[0].id;
    }

    // -------------------------------------------------------------
    // 2. AI-Assisted Clinical Documentation
    // -------------------------------------------------------------
    console.log('\n--- 2. AI-Assisted Clinical Documentation ---');
    const rawTranscript = `Patient presents with high fever, sore throat, and dry cough for 3 days. No known drug allergies. Systemic exam clear. Diagnosis: Acute Viral Pharyngitis.`;
    
    const draftRes = await request('POST', '/ai/soap/draft', {
      appointment_id: appointmentId,
      doctor_id: doctorProfileId,
      patient_id: patientId,
      raw_notes: rawTranscript
    }, doctorToken);

    assert(draftRes.status === 201 && draftRes.body.success, 'POST /ai/soap/draft returned 201 Created');
    const draft = draftRes.body.data.draft;
    assert(draft && draft.structured_soap && draft.structured_soap.subjective, 'SOAP Subjective section parsed');
    assert(draft.structured_soap.objective && draft.structured_soap.plan, 'SOAP Objective and Plan sections parsed');
    assert(draft.missing_fields && draft.missing_fields.length > 0, `Missing vitals warnings detected (${draft.missing_fields.length} warnings)`);
    assert(draft.status === 'DRAFT', 'Initial AI SOAP status is strictly DRAFT');

    // Doctor approves draft
    const approveDraftRes = await request('POST', '/ai/soap/approve', {
      draft_id: draft.id,
      edits: {
        structured_soap: {
          ...draft.structured_soap,
          plan: {
            ...draft.structured_soap.plan,
            doctor_addendum: 'Reviewed and confirmed in person.'
          }
        }
      }
    }, doctorToken);

    assert(approveDraftRes.status === 200 && approveDraftRes.body.success, 'POST /ai/soap/approve returned 200');
    assert(approveDraftRes.body.data.draft.status === 'APPROVED', 'Draft status transitioned to APPROVED');
    assert(approveDraftRes.body.data.draft.approved_at, 'Doctor approved timestamp recorded');

    // -------------------------------------------------------------
    // 3. AI-Assisted Lab Report Understanding
    // -------------------------------------------------------------
    console.log('\n--- 3. AI-Assisted Lab Report Understanding ---');
    const labExtRes = await request('POST', '/ai/lab/extract', {
      clinic_id: clinicId,
      patient_id: patientId,
      file_name: 'Metropolis_CBC_Lipid_Panel.pdf',
      source_lab: 'Metropolis Healthcare Labs'
    }, doctorToken);

    assert(labExtRes.status === 201 && labExtRes.body.success, 'POST /ai/lab/extract returned 201 Created');
    const extraction = labExtRes.body.data.extraction;
    assert(extraction.extracted_data && extraction.extracted_data.length >= 5, `Extracted ${extraction.extracted_data.length} lab test metrics`);
    
    const abnormalItems = extraction.extracted_data.filter(x => x.is_abnormal);
    assert(abnormalItems.length >= 2, `Abnormal test values highlighted (${abnormalItems.length} abnormal items detected)`);
    assert(extraction.overall_confidence >= 95.0, `High OCR confidence score: ${extraction.overall_confidence}%`);
    assert(extraction.status === 'PENDING_REVIEW', 'Extraction status is PENDING_REVIEW prior to doctor verification');

    // Doctor verification of lab extraction
    const verifyLabRes = await request('POST', '/ai/lab/verify', {
      extraction_id: extraction.id,
      doctor_notes: 'Confirmed mild leukocytosis and elevated HbA1c. Glycemic optimization advised.'
    }, doctorToken);

    assert(verifyLabRes.status === 200 && verifyLabRes.body.success, 'POST /ai/lab/verify returned 200');
    assert(verifyLabRes.body.data.extraction.status === 'VERIFIED', 'Lab report extraction status updated to VERIFIED');

    // -------------------------------------------------------------
    // 4. Intelligent Healthcare Assistant & Safety Guard
    // -------------------------------------------------------------
    console.log('\n--- 4. Intelligent Healthcare Assistant & Safety Guard ---');
    
    // Test 4a: Routine informational inquiry
    const routineQueryRes = await request('POST', '/ai/assistant/query', {
      query: 'What does HbA1c 7.2% mean for my health?',
      patient_id: patientId
    });
    assert(routineQueryRes.status === 200 && routineQueryRes.body.success, 'Routine query returned 200');
    assert(!routineQueryRes.body.data.is_emergency, 'Routine query is marked is_emergency: false');
    assert(routineQueryRes.body.data.answer.includes('HbA1c'), 'Educational explanation provided');
    assert(routineQueryRes.body.data.disclaimer, 'Mandatory non-diagnostic disclaimer present');

    // Test 4b: Emergency symptom detection & triage interruption
    const emergencyQueryRes = await request('POST', '/ai/assistant/query', {
      query: 'I am feeling severe crushing chest pain and shortness of breath since 20 minutes',
      patient_id: patientId
    });
    assert(emergencyQueryRes.status === 200 && emergencyQueryRes.body.success, 'Emergency query returned 200');
    assert(emergencyQueryRes.body.data.is_emergency === true, 'EMERGENCY DETECTED: is_emergency is TRUE');
    assert(emergencyQueryRes.body.data.triage_level === 'RED_CRITICAL', 'Triage level escalated to RED_CRITICAL');
    assert(emergencyQueryRes.body.data.protocols.some(p => p.includes('112') || p.includes('108')), 'National Emergency 112/108 protocols returned');

    // -------------------------------------------------------------
    // 5. Teleconsultation & Video Consultation Engine
    // -------------------------------------------------------------
    console.log('\n--- 5. Teleconsultation & Video Engine ---');
    const roomRes = await request('POST', '/teleconsultation/rooms', {
      appointment_id: appointmentId,
      clinic_id: clinicId,
      doctor_id: doctorProfileId,
      patient_id: patientId
    }, clinicToken);

    assert(roomRes.status === 201 && roomRes.body.success, 'POST /teleconsultation/rooms returned 201');
    const room = roomRes.body.data.room;
    assert(room && room.room_code.startsWith('ROOM-'), `Room code generated: ${room.room_code}`);
    assert(room.doctor_token && room.patient_token, 'Cryptographic tokens generated for doctor and patient');
    assert(room.ice_servers && room.ice_servers.length > 0, 'WebRTC STUN/ICE server list configured');

    // Patient joins waiting room
    const patientJoinRes = await request('POST', `/teleconsultation/rooms/${room.room_code}/join`, {
      role: 'PATIENT',
      token: room.patient_token
    }, patientToken);

    assert(patientJoinRes.status === 200 && patientJoinRes.body.success, 'Patient joined room successfully');
    assert(patientJoinRes.body.data.room.status === 'WAITING_ROOM', 'Room transitioned to WAITING_ROOM');

    // Doctor joins call
    const doctorJoinRes = await request('POST', `/teleconsultation/rooms/${room.room_code}/join`, {
      role: 'DOCTOR',
      token: room.doctor_token
    }, doctorToken);

    assert(doctorJoinRes.status === 200 && doctorJoinRes.body.success, 'Doctor joined room successfully');
    assert(doctorJoinRes.body.data.room.status === 'IN_CALL', 'Room transitioned to IN_CALL');

    // Conclude teleconsultation
    const endRoomRes = await request('POST', `/teleconsultation/rooms/${room.room_code}/end`, {
      notes: 'Video consultation concluded. Digital prescription issued.'
    }, doctorToken);

    assert(endRoomRes.status === 200 && endRoomRes.body.success, 'Conclude teleconsultation returned 200');
    assert(endRoomRes.body.data.room.status === 'COMPLETED', 'Room status updated to COMPLETED');

    // -------------------------------------------------------------
    // 6. ABDM / ABHA Interoperability Readiness
    // -------------------------------------------------------------
    console.log('\n--- 6. ABDM / ABHA Interoperability ---');
    const abhaRes = await request('GET', '/abdm/verify-abha?abha_address=citizen@abdm', null, clinicToken);
    assert(abhaRes.status === 200 && abhaRes.body.success, 'GET /abdm/verify-abha returned 200');
    assert(abhaRes.body.data.verification.status === 'VERIFIED', 'ABHA status is VERIFIED');
    assert(abhaRes.body.data.verification.abha_number, `ABHA Number retrieved: ${abhaRes.body.data.verification.abha_number}`);

    // Generate FHIR R4 Bundle
    const fhirRes = await request('POST', '/abdm/fhir/export', {
      patient_id: patientId,
      appointment_id: appointmentId,
      clinic_id: clinicId
    }, clinicToken);

    assert(fhirRes.status === 200 && fhirRes.body.success, 'POST /abdm/fhir/export returned 200');
    const fhirBundle = fhirRes.body.data.bundle;
    assert(fhirBundle.resourceType === 'Bundle' && fhirBundle.type === 'document', 'Valid FHIR R4 Document Bundle generated');
    const entryTypes = fhirBundle.entry.map(e => e.resource.resourceType);
    assert(entryTypes.includes('Composition') && entryTypes.includes('Patient') && entryTypes.includes('Organization'), 'Bundle includes Composition, Patient, and Organization');

    // ABDM Consent creation & revocation
    const consentRes = await request('POST', '/abdm/consents', {
      patient_id: patientId,
      clinic_id: clinicId,
      abha_address: 'citizen@abdm',
      purpose: 'CAREMGT'
    }, patientToken);

    assert(consentRes.status === 201 && consentRes.body.success, 'POST /abdm/consents returned 201 Created');
    const consentArtefactId = consentRes.body.data.consent.consent_artefact_id;

    const revokeConsentRes = await request('POST', `/abdm/consents/${consentArtefactId}/revoke`, {
      patient_id: patientId
    }, patientToken);

    assert(revokeConsentRes.status === 200 && revokeConsentRes.body.success, 'Revoke consent returned 200');
    assert(revokeConsentRes.body.data.consent.status === 'REVOKED', 'Consent artefact status updated to REVOKED');

    // -------------------------------------------------------------
    // 7. Diagnostic Laboratory Framework
    // -------------------------------------------------------------
    console.log('\n--- 7. Diagnostic Laboratory Framework ---');
    const labsRes = await request('GET', '/integrations/labs');
    assert(labsRes.status === 200 && labsRes.body.success, 'GET /integrations/labs returned 200');
    assert(labsRes.body.data.laboratories.length >= 2, `Active lab partners registered: ${labsRes.body.data.laboratories.length}`);

    // Create Lab Order
    const labOrderRes = await request('POST', '/integrations/labs/orders', {
      clinic_id: clinicId,
      patient_id: patientId,
      doctor_id: doctorProfileId,
      lab_code: 'METROPOLIS',
      test_codes: ['CBC', 'LIPID_PANEL'],
      sample_collection_type: 'CLINIC_WALKIN'
    }, clinicToken);

    assert(labOrderRes.status === 201 && labOrderRes.body.success, 'Lab order created with 201');
    const labOrder = labOrderRes.body.data.order;
    assert(labOrder.order_reference.startsWith('LAB-ORD-'), `Order reference generated: ${labOrder.order_reference}`);
    assert(labOrder.sample_barcode.startsWith('BC-'), `Sample barcode issued: ${labOrder.sample_barcode}`);

    // Process Laboratory Webhook with HMAC
    const webhookPayload = {
      order_reference: labOrder.order_reference,
      event_id: 'EVT-' + Date.now(),
      status: 'REPORT_READY',
      report_url: 'https://storage.metropolis.in/reports/signed_cbc.pdf'
    };

    const webhookRes = await request('POST', '/integrations/labs/webhook/METROPOLIS', webhookPayload, null, {
      'x-lab-signature': 'test_signature_valid'
    });

    assert(webhookRes.status === 200 && webhookRes.body.success, 'Lab webhook accepted and processed');
    assert(webhookRes.body.data.order.status === 'REPORT_READY', 'Order status updated to REPORT_READY');

    // Idempotency check: sending duplicate webhook
    const duplicateWebhookRes = await request('POST', '/integrations/labs/webhook/METROPOLIS', webhookPayload, null, {
      'x-lab-signature': 'test_signature_valid'
    });
    assert(duplicateWebhookRes.status === 200 && duplicateWebhookRes.body.data.idempotent === true, 'Duplicate webhook event handled idempotently');

    // -------------------------------------------------------------
    // 8. Pharmacy Partner Framework
    // -------------------------------------------------------------
    console.log('\n--- 8. Pharmacy Partner Framework ---');
    const partnersRes = await request('GET', '/integrations/pharmacy/partners');
    assert(partnersRes.status === 200 && partnersRes.body.success, 'GET /integrations/pharmacy/partners returned 200');
    assert(partnersRes.body.data.partners.some(p => p.code === 'APOLLO_PHARMACY'), 'Apollo Pharmacy partner present');

    // Check Availability
    const availRes = await request('POST', '/integrations/pharmacy/availability', {
      pharmacy_code: 'APOLLO_PHARMACY',
      medications: ['Paracetamol 650mg', 'Amoxicillin 500mg']
    });
    assert(availRes.status === 200 && availRes.body.data.in_stock_all === true, 'Medication stock check confirmed availability');

    // Dispatch Order
    const pharmOrderRes = await request('POST', '/integrations/pharmacy/orders', {
      prescription_id: prescriptionId,
      pharmacy_code: 'APOLLO_PHARMACY',
      delivery_type: 'HOME_DELIVERY'
    }, clinicToken);

    assert(pharmOrderRes.status === 201 && pharmOrderRes.body.success, 'POST /integrations/pharmacy/orders returned 201');
    const pharmOrder = pharmOrderRes.body.data.order;
    assert(pharmOrder.order_reference.startsWith('PHARM-ORD-'), `Pharmacy order reference generated: ${pharmOrder.order_reference}`);

    // Update Status
    const updatePharmRes = await request('PATCH', `/integrations/pharmacy/orders/${pharmOrder.order_reference}/status`, {
      status: 'DELIVERED',
      tracking_url: 'https://track.apollopharmacy.in/live/' + pharmOrder.order_reference
    });
    assert(updatePharmRes.status === 200 && updatePharmRes.body.data.order.status === 'DELIVERED', 'Pharmacy order status updated to DELIVERED');

    // -------------------------------------------------------------
    // 9. Clinic Intelligence & Demand Forecasting
    // -------------------------------------------------------------
    console.log('\n--- 9. Clinic Intelligence & Demand Forecasting ---');
    const forecastRes = await request('GET', `/intelligence/forecast/${clinicId}?days=7`, null, clinicToken);
    assert(forecastRes.status === 200 && forecastRes.body.success, 'GET /intelligence/forecast returned 200');
    assert(forecastRes.body.data.daily_projections.length === 7, '7-day moving average volume projection generated');
    assert(forecastRes.body.data.daily_projections[0].staffing_recommendations.doctors_on_duty >= 1, 'Doctor staffing recommendation included');

    const heatmapRes = await request('GET', `/intelligence/heatmap/${clinicId}`, null, clinicToken);
    assert(heatmapRes.status === 200 && heatmapRes.body.success, 'GET /intelligence/heatmap returned 200');
    assert(heatmapRes.body.data.heatmap_cells.length >= 80, 'Hourly congestion matrix computed');

    const noShowRes = await request('GET', `/intelligence/no-show/${clinicId}`, null, clinicToken);
    assert(noShowRes.status === 200 && noShowRes.body.success, 'GET /intelligence/no-show returned 200');
    assert(typeof noShowRes.body.data.metrics.no_show_rate_percent === 'number', 'No-show rate percentage calculated');
    assert(noShowRes.body.data.risk_factors.length >= 3, 'No-show risk factors and mitigations provided');

    // -------------------------------------------------------------
    // 10. Secure Medical Record Sharing
    // -------------------------------------------------------------
    console.log('\n--- 10. Secure Medical Record Sharing ---');
    const shareRes = await request('POST', '/records/share', {
      patient_id: patientId,
      recipient_name: 'Dr. External Specialist',
      recipient_contact: 'dr.external@hospital.in',
      shared_records: ['PRESCRIPTION', 'LAB_REPORT', 'CLINICAL_NOTE'],
      duration_hours: 48
    }, patientToken);

    assert(shareRes.status === 201 && shareRes.body.success, 'POST /records/share created signed link');
    const shareToken = shareRes.body.data.share_token;
    const shareId = shareRes.body.data.share_id;
    assert(shareToken.startsWith('rec_share_'), `Signed share token generated: ${shareToken}`);

    // Public view access with audit logging
    const accessRes = await request('GET', `/records/shared/${shareToken}`);
    assert(accessRes.status === 200 && accessRes.body.success, 'GET /records/shared/:token retrieved permitted records');
    assert(accessRes.body.data.access_count >= 1, `Audit access count incremented to ${accessRes.body.data.access_count}`);
    assert(accessRes.body.data.records, 'Shared record categories delivered');

    // Patient revokes share link
    const revokeShareRes = await request('DELETE', `/records/share/${shareId}`, null, patientToken);
    assert(revokeShareRes.status === 200 && revokeShareRes.body.success, 'DELETE /records/share/:id revoked share link');

    // Re-access revoked link must fail with 403 Forbidden
    const reAccessRes = await request('GET', `/records/shared/${shareToken}`);
    assert(reAccessRes.status === 403, 'Access to revoked share link denied with 403 Forbidden');

    // -------------------------------------------------------------
    // 11. Super Admin Integration Management
    // -------------------------------------------------------------
    console.log('\n--- 11. Super Admin Integration Management ---');
    const adminIntegRes = await request('GET', '/admin/integrations', null, adminToken);
    assert(adminIntegRes.status === 200 && adminIntegRes.body.success, 'GET /admin/integrations returned 200');
    assert(adminIntegRes.body.data.integrations.length >= 6, `Found ${adminIntegRes.body.data.integrations.length} registered platform integrations`);

    // Toggle integration
    const toggleRes = await request('PATCH', '/admin/integrations/abdm', { is_enabled: true }, adminToken);
    assert(toggleRes.status === 200 && toggleRes.body.data.integration.is_enabled === true, 'Super Admin toggled ABDM integration to active');

    // Manual sync trigger
    const syncRes = await request('POST', '/admin/integrations/abdm/sync', {}, adminToken);
    assert(syncRes.status === 200 && syncRes.body.success, 'Manual integration sync and latency test completed');

    // -------------------------------------------------------------
    // Final Summary
    // -------------------------------------------------------------
    console.log('\n===============================================================');
    console.log(` PHASE 10 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Test Suite Unhandled Exception:', err);
    process.exit(1);
  }
}

runTests();
