const { query } = require('./config/db');

async function auditDatabase() {
  console.log('--- Database Performance & Index Audit ---');

  // 1. Table Row Counts
  const tables = await query(`
    SELECT relname as table_name, n_live_tup as row_estimate
    FROM pg_stat_user_tables
    ORDER BY n_live_tup DESC;
  `);
  console.log('Live tuples per table:');
  tables.rows.forEach(t => {
    if (t.row_estimate > 0) console.log(`  - ${t.table_name}: ${t.row_estimate} rows`);
  });

  // 2. Indexes Count
  const indexes = await query(`
    SELECT tablename, count(*) as index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
    GROUP BY tablename
    ORDER BY index_count DESC;
  `);
  console.log('\nIndexes per table:');
  indexes.rows.forEach(i => console.log(`  - ${i.tablename}: ${i.index_count} indexes`));

  // 3. Check for foreign keys without indexes
  const unindexedFks = await query(`
    SELECT c.conrelid::regclass AS table_name,
           string_agg(a.attname, ', ') AS columns
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE c.contype = 'f'
      AND NOT EXISTS (
        SELECT 1
        FROM pg_index i
        WHERE i.indrelid = c.conrelid
          AND c.conkey = (i.indkey::smallint[])[1:array_length(c.conkey, 1)]
      )
    GROUP BY c.conrelid, c.conname;
  `);
  console.log(`\nForeign keys without exact leading index: ${unindexedFks.rows.length}`);
  unindexedFks.rows.forEach(fk => console.log(`  - ${fk.table_name} (${fk.columns})`));

  process.exit(0);
}

auditDatabase().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});

