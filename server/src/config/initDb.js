const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

async function initializeDatabaseIfNeeded() {
  try {
    const res = await pool.query("SELECT to_regclass('public.users') as exists");
    if (!res.rows[0] || !res.rows[0].exists) {
      console.log('⚡ Fresh database detected! Initializing schema & seed data for Render deployment...');

      const schemaPath = path.join(__dirname, '../../schema.sql');
      const seedsPath = path.join(__dirname, '../../seeds.sql');

      if (fs.existsSync(schemaPath)) {
        console.log('Applying database schema from schema.sql...');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await pool.query(schemaSql);
        console.log('✓ Database schema created successfully.');
      }

      if (fs.existsSync(seedsPath)) {
        console.log('Seeding initial verified data from seeds.sql...');
        const seedsSql = fs.readFileSync(seedsPath, 'utf8');
        await pool.query(seedsSql);
        console.log('✓ Initial verified seeds loaded successfully.');
      }
    } else {
      console.log('✓ Database already initialized and ready.');
    }
  } catch (err) {
    console.error('Warning during database auto-init check:', err.message);
  }
}

module.exports = { initializeDatabaseIfNeeded };

