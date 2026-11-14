const { query } = require('../config/db');

async function inspect() {
  try {
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('--- DATABASE TABLES & ROW COUNTS ---');
    for (const r of tables.rows) {
      try {
        const c = await query(`SELECT count(*) as cnt FROM "${r.table_name}"`);
        console.log(`${r.table_name.padEnd(35)}: ${c.rows[0].cnt} rows`);
      } catch (err) {
        console.log(`${r.table_name.padEnd(35)}: ERROR (${err.message})`);
      }
    }
  } catch (e) {
    console.error('Inspect error:', e);
  } finally {
    process.exit(0);
  }
}

inspect();

