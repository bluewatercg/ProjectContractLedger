const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

function splitSqlStatements(sql) {
  const statements = [];
  let delimiter = ';';
  let buffer = '';

  for (const line of sql.split(/\r?\n/)) {
    const delimiterMatch = line.match(/^\s*DELIMITER\s+(.+)\s*$/i);
    if (delimiterMatch) {
      if (buffer.trim()) {
        statements.push(buffer.trim());
        buffer = '';
      }
      delimiter = delimiterMatch[1];
      continue;
    }

    buffer += `${line}\n`;
    if (buffer.trimEnd().endsWith(delimiter)) {
      const statement = buffer.trimEnd().slice(0, -delimiter.length).trim();
      if (statement) {
        statements.push(statement);
      }
      buffer = '';
    }
  }

  if (buffer.trim()) {
    statements.push(buffer.trim());
  }

  return statements;
}

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
    multipleStatements: false,
  });

  try {
    const sql = fs.readFileSync(resolvedPath, 'utf8');
    for (const statement of splitSqlStatements(sql)) {
      await connection.query(statement);
    }
    console.log(`Migration applied: ${path.relative(process.cwd(), resolvedPath)}`);
  } finally {
    await connection.end();
  }
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
