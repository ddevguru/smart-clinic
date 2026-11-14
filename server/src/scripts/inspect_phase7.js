const { query } = require('../config/db');

async function inspect() {
  const tables = await query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema='public' 
    ORDER BY table_name
  `);
  console.log('--- ALL TABLES ---');
  console.log(tables.rows.map(r => r.table_name).join(', '));

  // Check columns of relevant tables: queue_sessions, queue_entries, queue_policies, appointments, clinic_branches, patients
  const checkTables = ['queue_sessions', 'queue_entries', 'queue_policies', 'appointments', 'clinic_branches', 'patients', 'audit_logs'];
  for (const t of checkTables) {
    const cols = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema='public' AND table_name=$1
      ORDER BY ordinal_position
    `, [t]);
    console.log(`\n--- ${t} COLUMNS ---`);
    console.log(cols.rows.map(c => `${c.column_name} (${c.data_type})`).join(', '));
  }
  process.exit(0);
}

inspect();

