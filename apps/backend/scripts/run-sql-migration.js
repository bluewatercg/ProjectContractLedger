const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  const migrationPath = process.argv[2];

  if (!migrationPath) {
    console.error('Usage: node scripts/run-sql-migration.js <sql-file>');
    process.exit(1);
  }

  const resolvedPath = path.resolve(process.cwd(), migrationPath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`Migration file not found: ${resolvedPath}`);
    process.exit(1);
  }

  const database = process.env.DB_DATABASE || 'contract_ledger';
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database,
    multipleStatements: true,
  });

  try {
    const sql = fs.readFileSync(resolvedPath, 'utf8');
    await connection.query(sql);
    console.log(`Migration applied: ${path.relative(process.cwd(), resolvedPath)}`);
  } finally {
    await connection.end();
  }
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
