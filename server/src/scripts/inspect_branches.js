const { query } = require('../config/db');

async function inspectBranches() {
  const res = await query('SELECT id, clinic_id, name, latitude, longitude, address, city FROM clinic_branches');
  console.log('Branches:', res.rows);
  process.exit(0);
}
inspectBranches();

