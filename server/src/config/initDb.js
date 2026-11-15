const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

async function initializeDatabaseIfNeeded(force = false) {
  try {
    const res = await pool.query("SELECT to_regclass('public.users') as exists");
    const tableExists = !!(res.rows[0] && res.rows[0].exists);

    if (!tableExists || force) {
      console.log('⚡ Initializing database schema & seed data...');

      const schemaPath = path.join(__dirname, '../../schema.sql');
      const seedsPath = path.join(__dirname, '../../seeds.sql');

      if (fs.existsSync(schemaPath)) {
        console.log('Applying database schema from schema.sql...');
        let schemaSql = fs.readFileSync(schemaPath, 'utf8');
        // Extra safeguard: strip any residual OWNER TO statements
        schemaSql = schemaSql.replace(/^ALTER .* OWNER TO .*;\r?\n?/gm, '');
        await pool.query(schemaSql);
        console.log('✓ Database schema created successfully.');
      } else {
        console.warn('schema.sql not found at:', schemaPath);
      }

      if (fs.existsSync(seedsPath)) {
        console.log('Seeding initial verified data from seeds.sql...');
        const seedsSql = fs.readFileSync(seedsPath, 'utf8');
        await pool.query(seedsSql);
        console.log('✓ Initial verified seeds loaded successfully.');
      } else {
        console.warn('seeds.sql not found at:', seedsPath);
      }

      return { success: true, message: 'Database schema and seeds applied successfully.' };
    } else {
      console.log('✓ Database already initialized and ready.');
      return { success: true, message: 'Database already initialized and ready.' };
    }
  } catch (err) {
    console.error('Error during database initialization:', err);
    return { success: false, error: err.message, stack: err.stack };
  }
}

module.exports = { initializeDatabaseIfNeeded };
