/**
 * SMART CLINIC OS — AUTOMATED SECURITY AUDIT & PENETRATION RESILIENCE TEST
 * Probes API attack vectors: SQLi, Path Traversal, Tenant Isolation & Token Tampering
 */

const assert = require('assert');

const BASE_URL = 'http://localhost:5000/api/v1';

async function request(method, endpoint, body = null, token = null, headers = {}) {
  const reqHeaders = { 'Content-Type': 'application/json', ...headers };
  if (token) reqHeaders['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  let responseBody;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    responseBody = await res.json();
  } else {
    responseBody = await res.text();
  }

  return { status: res.status, headers: res.headers, body: responseBody };
}

async function runSecurityAudit() {
  console.log('================================================================');
  console.log('   SMART CLINIC OS — AUTOMATED SECURITY AUDIT TEST SUITE        ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function test(description, fn) {
    return Promise.resolve()
      .then(fn)
      .then(() => {
        console.log(`  [PASS] ${description}`);
        passed++;
      })
      .catch((err) => {
        console.error(`  [FAIL] ${description}`);
        console.error(`         ${err.message}`);
        failed++;
      });
  }

  // 1. Authenticate Personas for Tenant Boundary Testing
  console.log('--- 1. Authenticating Personas for Multi-Tenant Boundary Probe ---');
  let tokenClinicA, clinicAId, tokenClinicB, clinicBId;

  await test('Clinic A Owner logged in', async () => {
    const res = await request('POST', '/auth/login-password', {
      identifier: 'owner@careplus.in',
      password: 'Password@123',
    });
    assert.strictEqual(res.status, 200);
    tokenClinicA = res.body.data.token || res.body.data.access_token;
    clinicAId = res.body.data.memberships[0].clinic_id;
    assert.ok(tokenClinicA);
  });

  await test('Clinic B Owner logged in', async () => {
    const res = await request('POST', '/auth/login-password', {
      identifier: 'owner@apex.in',
      password: 'Password@123',
    });
    assert.strictEqual(res.status, 200);
    tokenClinicB = res.body.data.token || res.body.data.access_token;
    clinicBId = res.body.data.memberships[0].clinic_id;
    assert.ok(tokenClinicB);
  });

  // 2. Multi-Tenant Data Isolation Probe
  console.log('\n--- 2. Multi-Tenant Cross-Clinic Boundary Tests ---');
  await test('Clinic A cannot access Clinic B financial analytics (HTTP 403)', async () => {
    const res = await request('GET', '/clinic/subscriptions/analytics', null, tokenClinicA, {
      'X-Clinic-ID': clinicBId // Forged clinic header
    });
    assert.strictEqual(res.status, 403, 'Cross-tenant access must be rejected with 403 Forbidden');
  });

  await test('Clinic B cannot modify Clinic A automation settings (HTTP 403)', async () => {
    const res = await request('PUT', '/clinic/automation/settings', {
      buffer_minutes: 45
    }, tokenClinicB, {
      'X-Clinic-ID': clinicAId
    });
    assert.strictEqual(res.status, 403, 'Cross-tenant settings mutation must be rejected with 403');
  });

  // 3. SQL Injection Resilience
  console.log('\n--- 3. SQL Injection Attack Vector Tests ---');
  await test('SQL injection in patient search query sanitized and safely evaluated', async () => {
    const sqliPayload = "'; DROP TABLE users; --";
    const res = await request('GET', `/clinic/patients?search=${encodeURIComponent(sqliPayload)}`, null, tokenClinicA, {
      'X-Clinic-ID': clinicAId
    });
    assert.notStrictEqual(res.status, 500, 'Database must not throw unhandled SQL syntax error');
    assert.strictEqual(res.status, 200, 'Query should return empty array safely');
    assert.ok(Array.isArray(res.body.data?.patients || res.body.data), 'Returns sanitized array');
  });

  await test('SQL injection in login identifier safely rejected without syntax error', async () => {
    const sqliLogin = "' OR '1'='1' --";
    const res = await request('POST', '/auth/login-password', {
      identifier: sqliLogin,
      password: 'Password@123'
    });
    assert.strictEqual(res.status, 401, 'Unauthorized login attempt rejected');
  });

  // 4. Path Traversal & File Upload Validation
  console.log('\n--- 4. Directory Traversal & Storage Security Tests ---');
  await test('Path traversal attempt in storage download rejected', async () => {
    const res = await fetch('http://localhost:5000/storage/../../../../etc/passwd');
    assert.ok(res.status === 404 || res.status === 403, 'Path traversal must be denied');
  });

  await test('Windows path traversal attempt in storage download rejected', async () => {
    const res = await fetch('http://localhost:5000/storage/..%5C..%5C..%5Cwindows%5Cwin.ini');
    assert.ok(res.status === 404 || res.status === 403, 'Path traversal must be denied');
  });

  // 5. Unauthenticated Access Protection
  console.log('\n--- 5. Unauthenticated Boundary Protection Tests ---');
  await test('Unauthenticated access to Teleconsultation rooms rejected (HTTP 401)', async () => {
    const res = await request('POST', '/teleconsultation/rooms', {
      appointment_id: 'sample_id'
    });
    assert.strictEqual(res.status, 401, 'Protected route requires JWT');
  });

  await test('Unauthenticated access to AI SOAP assistant rejected (HTTP 401)', async () => {
    const res = await request('POST', '/ai/soap/draft', {
      dictation_text: 'Fever 101F for 2 days'
    });
    assert.strictEqual(res.status, 401, 'Protected AI route requires JWT');
  });

  await test('Tampered JWT token rejected with HTTP 401/403', async () => {
    const forgedToken = tokenClinicA.substring(0, tokenClinicA.length - 8) + 'ABCDEFGH';
    const res = await request('GET', '/clinic/dashboard/receptionist', null, forgedToken, {
      'X-Clinic-ID': clinicAId
    });
    assert.ok(res.status === 401 || res.status === 403, 'Forged token must be rejected');
  });

  // 6. Security Headers Verification
  console.log('\n--- 6. Production HTTP Security Headers Verification ---');
  await test('Production security headers present on API responses', async () => {
    const res = await request('GET', '/health');
    assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff');
    assert.strictEqual(res.headers.get('x-frame-options'), 'DENY');
    assert.strictEqual(res.headers.get('x-xss-protection'), '1; mode=block');
    assert.ok(res.headers.get('strict-transport-security'), 'HSTS header configured');
    assert.ok(res.headers.get('x-request-id'), 'X-Request-ID present for request tracing');
  });

  console.log('\n================================================================');
  console.log(` SECURITY AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED `);
  console.log('================================================================');

  if (failed > 0) process.exit(1);
  process.exit(0);
}

runSecurityAudit();
