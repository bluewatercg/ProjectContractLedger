const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

async function runMigrations() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '192.168.1.254',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || 'procontractledger',
    multipleStatements: true
  });

  const migrations = [
    {
      name: '1. create_subscription_renewal_records_table',
      file: path.join(__dirname, '../../../database/migrations/create_subscription_renewal_records_table.sql')
    },
    {
      name: '2. add_active_renewal_record_ref',
      file: path.join(__dirname, '../../../database/migrations/add_active_renewal_record_ref.sql')
    },
    {
      name: '3. migrate_subscription_data',
      file: path.join(__dirname, '../../../database/migrations/migrate_subscription_data.sql')
    }
  ];

  try {
    for (const migration of migrations) {
      console.log(`\n=== Running: ${migration.name} ===`);
      const sql = fs.readFileSync(migration.file, 'utf8');
      try {
        await connection.query(sql);
        console.log(`✓ ${migration.name} completed`);
      } catch (err) {
        console.error(`✗ ${migration.name} failed:`, err.message);
        // If column/table already exists, continue
        if (err.message.includes('Duplicate column') || err.message.includes('already exists')) {
          console.log(`  (already exists, skipping)`);
        } else {
          throw err;
        }
      }
    }

    // Verify
    console.log('\n=== Verification ===');
    const [tables] = await connection.query("SHOW TABLES LIKE 'subscription_renewal_records'");
    console.log('subscription_renewal_records table exists:', tables.length > 0);

    if (tables.length > 0) {
      const [columns] = await connection.query('DESCRIBE subscription_renewal_records');
      console.log('Columns:', columns.map(c => c.Field).join(', '));

      const [records] = await connection.query('SELECT COUNT(*) as count FROM subscription_renewal_records');
      console.log('Renewal records count:', records[0].count);
    }

    const [mainColumns] = await connection.query('DESCRIBE subscription_records');
    const hasActiveRecordId = mainColumns.some(c => c.Field === 'active_renewal_record_id');
    console.log('subscription_records has active_renewal_record_id:', hasActiveRecordId);

    console.log('\n✓ All migrations completed successfully');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigrations();
