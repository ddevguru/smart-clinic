const { query } = require('../config/db');

async function inspectUsers() {
  try {
    const cmCols = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'clinic_memberships';
    `);
    console.log('CM Columns:', cmCols.rows);

    const users = await query(`SELECT * FROM users;`);
    console.log('Users:', users.rows.map(u => ({ id: u.id, email: u.email, phone: u.phone_number, name: u.full_name })));

    const cms = await query(`SELECT * FROM clinic_memberships;`);
    console.log('Memberships:', cms.rows);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

inspectUsers();
