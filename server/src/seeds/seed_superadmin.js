const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');

async function seedSuperAdmin() {
  console.log('Seeding Super Admin users...');
  const hash1 = bcrypt.hashSync('AdminSecurePassword123!', 10);
  const hash2 = bcrypt.hashSync('Password@123', 10);

  const roleRes = await query("SELECT id FROM roles WHERE name='SUPER_ADMIN'");
  const roleId = roleRes.rows[0].id;
  const clinicRes = await query('SELECT id FROM clinics LIMIT 1');
  const clinicId = clinicRes.rows[0]?.id;

  async function upsertAdmin(email, phone, passHash) {
    const existing = await query("SELECT * FROM users WHERE email = $1", [email]);
    let uid;
    if (existing.rows.length === 0) {
      uid = uuidv4();
      await query(
        `INSERT INTO users (id, email, phone_number, password_hash, full_name, is_active, is_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'Platform Super Admin', true, true, NOW(), NOW())`,
        [uid, email, phone, passHash]
      );
      console.log(`Created admin user ${email}`);
    } else {
      uid = existing.rows[0].id;
      await query("UPDATE users SET password_hash = $1 WHERE id = $2", [passHash, uid]);
      console.log(`Updated password for admin user ${email}`);
    }

    if (clinicId) {
      const exMem = await query("SELECT * FROM clinic_memberships WHERE user_id = $1 AND role_id = $2", [uid, roleId]);
      if (exMem.rows.length === 0) {
        await query(
          `INSERT INTO clinic_memberships (id, clinic_id, user_id, role_id, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, 'ACTIVE', NOW(), NOW())`,
          [uuidv4(), clinicId, uid, roleId]
        );
      }
    }
  }

  // Pre-filled admin in SuperAdminLive.js
  await upsertAdmin('admin@smartclinicos.in', '+919999999998', hash1);
  // Original seed admin
  await upsertAdmin('admin@smartclinic.in', '+919999999999', hash2);

  console.log('Super Admin users ready!');
  process.exit(0);
}

seedSuperAdmin();

