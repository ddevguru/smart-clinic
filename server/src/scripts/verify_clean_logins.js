const http = require('http');

function postJSON(url, payload) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = JSON.stringify(payload);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function verifyLogins() {
  console.log('--- VERIFYING CLEAN STAFF LOGINS ---');

  const testAccounts = [
    { label: 'Super Admin', email: 'admin@smartclinic.in', pass: 'Password@123' },
    { label: 'Clinic Owner (CarePlus)', email: 'owner@careplus.in', pass: 'Password@123' },
    { label: 'Doctor (CarePlus)', email: 'doctor@careplus.in', pass: 'Password@123' },
    { label: 'Receptionist (CarePlus)', email: 'reception@careplus.in', pass: 'Password@123' },
    { label: 'Apex Owner (Multi-tenant)', email: 'owner@apex.in', pass: 'Password@123' },
    { label: 'Apex Doctor (Multi-tenant)', email: 'doctor@apex.in', pass: 'Password@123' }
  ];

  for (const acc of testAccounts) {
    try {
      const res = await postJSON('http://localhost:5000/api/v1/auth/login-password', {
        identifier: acc.email,
        password: acc.pass
      });

      if (res.status === 200 && res.body?.success) {
        const u = res.body.data.user;
        const role = u.platform_role || res.body.data.memberships?.[0]?.role_name || 'AUTHENTICATED';
        console.log(`[PASS] ${acc.label.padEnd(28)}: Login SUCCESS! Name: "${u.full_name}", Role: ${role}`);
      } else {
        console.log(`[FAIL] ${acc.label.padEnd(28)}: Status ${res.status}, Error:`, res.body?.error || res.body);
      }
    } catch (e) {
      console.log(`[ERROR] ${acc.label.padEnd(27)}:`, e.message);
    }
  }

  process.exit(0);
}

verifyLogins();

